import type { ApiClient, Session } from "../contract";
import { problem } from "../errors";
import { tokenStore } from "../token";
import {
  JOB_DURATIONS,
  audit,
  db,
  id,
  logActivity,
  notify,
  now,
  save,
  writeLedger,
  type DbJob,
  type DbProject,
} from "./db";
import { availabilityChecks, generateLogoSpecs, generateNames, generateSlogans } from "./generators";
import { CREDIT_COSTS, FREE_QUOTAS, LOW_CREDITS_THRESHOLD } from "@/lib/credits";
import { PLANS } from "@/lib/plans";
import { paletteFromColors } from "@/lib/render/color";
import { FONTS } from "@/lib/render/fonts";
import { findOfficialTerms, renderStampSvg } from "@/lib/render/stamp";
import { DEFAULT_SPEC } from "@/lib/render/logo";
import type {
  BrandKit,
  JobEvent,
  JobKind,
  Logo,
  NameSuggestion,
  Project,
  PublicKit,
  StampData,
  User,
  Workspace,
  WorkspaceRole,
} from "@/lib/types";

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));
const today = () => new Date().toISOString().slice(0, 10);

function currentUser() {
  const data = db();
  const user = data.users.find((u) => u.id === data.currentUserId);
  if (!user || !tokenStore.get()) throw problem(401, "Session expirée", "UNAUTHENTICATED");
  if (user.suspendedAt) throw problem(403, "Compte suspendu", "SUSPENDED");
  return user;
}

function toUser(user: ReturnType<typeof currentUser>): User {
  const { password: _password, suspendedAt: _suspended, ...rest } = user;
  return rest;
}

function roleIn(workspaceId: string): WorkspaceRole | null {
  const user = currentUser();
  return db().memberships.find((m) => m.userId === user.id && m.workspaceId === workspaceId)?.role ?? null;
}

const RANK: Record<WorkspaceRole, number> = { VIEWER: 1, EDITOR: 2, OWNER: 3 };

/** Équivalent du WorkspaceGuard côté API. */
function requireRole(workspaceId: string, minimum: WorkspaceRole) {
  const role = roleIn(workspaceId);
  if (!role || RANK[role] < RANK[minimum]) throw problem(403, "Action non autorisée pour votre rôle", "FORBIDDEN");
  return role;
}

function projectOr404(pid: string): DbProject {
  const project = db().projects.find((p) => p.id === pid);
  if (!project) throw problem(404, "Projet introuvable", "NOT_FOUND");
  return project;
}

function latestVersion(logoId: string) {
  return db()
    .logoVersions.filter((v) => v.logoId === logoId)
    .sort((a, b) => b.number - a.number)[0]!;
}

function toLogo(logo: ReturnType<typeof db>["logos"][number]): Logo {
  const { jobId: _jobId, ...rest } = logo;
  const current = latestVersion(logo.id);
  return { ...rest, current: { id: current.id, number: current.number, label: current.label, spec: current.spec, createdAt: current.createdAt } };
}

function toName(name: ReturnType<typeof db>["names"][number]): NameSuggestion {
  const userId = db().currentUserId ?? "";
  const { jobId: _jobId, votes, ...rest } = name;
  return {
    ...rest,
    votes: Object.values(votes).reduce<number>((sum, v) => sum + v, 0),
    myVote: votes[userId] ?? 0,
  };
}

function toProject(project: DbProject): Project {
  const data = db();
  const chosen = data.names.find((n) => n.id === project.chosenNameId);
  const logos = data.logos.filter((l) => l.projectId === project.id);
  const favorite = logos.find((l) => l.isFavorite) ?? logos[0];
  return {
    ...project,
    chosenName: chosen ? toName(chosen) : null,
    progress: {
      brief: Boolean(project.brief),
      name: Boolean(chosen),
      logo: logos.length > 0,
      signatures: data.signatures.some((s) => s.projectId === project.id) || data.slogans.some((s) => s.projectId === project.id && s.isChosen),
      kit: data.brandKits.some((k) => k.projectId === project.id),
    },
    previewSpec: favorite ? latestVersion(favorite.id).spec : null,
  };
}

function toWorkspace(workspace: ReturnType<typeof db>["workspaces"][number], role: WorkspaceRole): Workspace {
  const { renewsAt: _renewsAt, ...rest } = workspace;
  return { ...rest, role };
}

function projectName(project: DbProject) {
  return db().names.find((n) => n.id === project.chosenNameId)?.value ?? project.title;
}

// ─── Tâches de génération ───

function startJob(project: DbProject, kind: JobKind, cost: number, input: Record<string, unknown>, idempotencyKey: string) {
  const data = db();
  const existing = data.jobs.find((j) => j.input.idempotencyKey === idempotencyKey);
  if (existing) return existing; // Idempotency-Key : même requête, même tâche

  const workspace = data.workspaces.find((w) => w.id === project.workspaceId)!;
  if (workspace.creditBalance < cost) throw problem(402, "Crédits insuffisants", "INSUFFICIENT_CREDITS");

  if (workspace.planCode === "FREE" && (kind === "NAMES" || kind === "LOGOS")) {
    const usage = data.freeUsage[workspace.id]?.day === today() ? data.freeUsage[workspace.id]! : { day: today(), names: 0, logos: 0 };
    if (kind === "NAMES" && usage.names >= FREE_QUOTAS.nameBatchesPerDay) throw problem(429, "Quota gratuit atteint : 3 lots de noms par jour", "FREE_QUOTA");
    if (kind === "LOGOS" && usage.logos >= FREE_QUOTAS.logoBatchesPerDay) throw problem(429, "Quota gratuit atteint : 1 lot de logos par jour", "FREE_QUOTA");
    if (kind === "NAMES") usage.names += 1;
    else usage.logos += 1;
    data.freeUsage[workspace.id] = usage;
  }

  const job: DbJob = {
    id: id("job"),
    projectId: project.id,
    workspaceId: workspace.id,
    kind,
    status: "QUEUED",
    progress: 0,
    costCredits: cost,
    error: null,
    createdAt: now(),
    finishedAt: null,
    input: { ...input, idempotencyKey },
    durationMs: JOB_DURATIONS[kind],
    materialized: false,
    willFail: String(input.feedback ?? "").includes("__echec__"),
  };
  // Débit au lancement, dans la même transaction que la création de la tâche (§11.4)
  if (cost > 0) writeLedger(workspace.id, -cost, "GENERATION", `${kind} — ${projectName(project)}`, { jobId: job.id });
  data.jobs.unshift(job);
  if (project.status === "DRAFT") project.status = "IN_PROGRESS";
  save();
  return job;
}

function materialize(job: DbJob) {
  if (job.materialized) return;
  const data = db();
  job.materialized = true;
  job.finishedAt = now();
  const project = data.projects.find((p) => p.id === job.projectId);

  if (job.willFail || !project) {
    job.status = "FAILED";
    job.error = "Le fournisseur IA n'a pas répondu après 3 tentatives.";
    // Remboursement automatique (PAY-05)
    if (job.costCredits > 0) writeLedger(job.workspaceId, job.costCredits, "REFUND", `Échec ${job.kind}`, { jobId: job.id });
    save();
    return;
  }

  const seed = Date.parse(job.createdAt) % 100000;
  if (job.kind === "NAMES") {
    const existing = new Set(data.names.filter((n) => n.projectId === project.id).map((n) => n.value.toLowerCase()));
    const reference = data.names.find((n) => n.id === job.input.referenceNameId)?.value;
    const names = generateNames({
      brief: project.brief,
      title: project.title,
      entityType: project.entityType,
      exclude: existing,
      feedback: job.input.feedback as string | undefined,
      reference,
      seed,
    });
    for (const name of names) {
      data.names.unshift({ ...name, id: id("nm"), projectId: project.id, jobId: job.id, isFavorite: false, isRejected: false, votes: {}, checks: [], createdAt: now() });
    }
    logActivity(project.id, `a généré ${names.length} noms`);
  }

  if (job.kind === "LOGOS") {
    const chosen = data.names.find((n) => n.id === project.chosenNameId);
    const slogan = data.slogans.find((s) => s.projectId === project.id && s.isChosen)?.text;
    const reference = job.input.referenceLogoId ? latestVersion(String(job.input.referenceLogoId))?.spec : undefined;
    const specs = generateLogoSpecs({
      text: chosen?.value ?? project.title,
      tagline: slogan ?? (chosen?.acronym && chosen.meaning.startsWith("Sigle") ? chosen.meaning.replace(/^Sigle de « (.*) »\.$/, "$1") : ""),
      type: job.input.type as Logo["type"],
      style: job.input.style as Logo["style"],
      palette: job.input.palette as string[] | undefined,
      brief: project.brief,
      feedback: job.input.feedback as string | undefined,
      reference,
      seed,
    });
    for (const spec of specs) {
      const logoId = id("lg");
      data.logos.unshift({
        id: logoId,
        projectId: project.id,
        jobId: job.id,
        type: spec.type,
        engine: job.input.engine as Logo["engine"],
        style: job.input.style as Logo["style"],
        isFavorite: false,
        isExclusive: false,
        createdAt: now(),
      });
      data.logoVersions.push({ id: id("lv"), logoId, number: 1, label: "Proposition", spec, createdAt: now() });
    }
    logActivity(project.id, `a généré ${specs.length} logos`);
  }

  if (job.kind === "SLOGANS") {
    const exclude = new Set(data.slogans.filter((s) => s.projectId === project.id).map((s) => s.text.toLowerCase()));
    const texts = generateSlogans({
      name: projectName(project),
      brief: project.brief,
      tone: job.input.tone as never,
      maxWords: Number(job.input.maxWords ?? 8),
      language: (job.input.language as "fr" | "en") ?? "fr",
      kind: (job.input.kind as never) ?? "SLOGAN",
      exclude,
      seed,
    });
    for (const text of texts) {
      data.slogans.unshift({ id: id("sl"), projectId: project.id, text, kind: (job.input.kind as never) ?? "SLOGAN", tone: job.input.tone as never, isFavorite: false, isChosen: false, createdAt: now() });
    }
    logActivity(project.id, `a généré ${texts.length} propositions de signature`);
  }

  if (job.kind === "BRAND_GUIDE" || job.kind === "EXPORT_ZIP") {
    const kit = data.brandKits.find((k) => k.id === job.input.kitId);
    if (kit) {
      if (job.kind === "BRAND_GUIDE") kit.guideReady = true;
      else kit.zipReady = true;
    }
    if (data.currentUserId) {
      notify(data.currentUserId, {
        type: "EXPORT_READY",
        title: job.kind === "BRAND_GUIDE" ? "Charte graphique prête" : "Archive ZIP prête",
        body: `${projectName(project)} : votre export est disponible pendant 7 jours.`,
        href: `/app/projets/${project.id}/kit`,
      });
    }
  }

  job.status = "SUCCEEDED";
  job.progress = 100;
  const workspace = data.workspaces.find((w) => w.id === job.workspaceId);
  if (workspace && workspace.creditBalance <= LOW_CREDITS_THRESHOLD && data.currentUserId) {
    notify(data.currentUserId, { type: "LOW_CREDITS", title: "Crédits bas", body: `Il reste ${workspace.creditBalance} crédits dans ${workspace.name}.`, href: "/app/facturation" });
  }
  save();
}

function jobState(job: DbJob): JobEvent {
  const elapsed = Date.now() - Date.parse(job.createdAt);
  if (!job.materialized && elapsed >= job.durationMs) materialize(job);
  if (!job.materialized) {
    job.status = elapsed < 300 ? "QUEUED" : "RUNNING";
    job.progress = Math.min(95, Math.round((elapsed / job.durationMs) * 100));
  }
  return { jobId: job.id, status: job.status, progress: job.progress, error: job.error };
}

function session(userId: string): Session {
  const data = db();
  data.currentUserId = userId;
  const token = `mock.${userId}.${Date.now()}`;
  tokenStore.set(token);
  save();
  const user = data.users.find((u) => u.id === userId)!;
  return { accessToken: token, user: toUser(user) };
}

function kitToDto(kit: ReturnType<typeof db>["brandKits"][number]): BrandKit {
  const spec = kit.logoSpec;
  const fontIds = spec ? [spec.fontId, "montserrat"] : ["montserrat"];
  return {
    id: kit.id,
    projectId: kit.projectId,
    version: kit.version,
    palette: spec ? paletteFromColors(spec.colors) : [],
    fonts: [...new Set(fontIds)].map((fid) => {
      const font = FONTS.find((f) => f.id === fid)!;
      return { id: font.id, name: font.name, license: "SIL Open Font License 1.1" };
    }),
    logoSpec: spec,
    slogan: kit.slogan,
    shareToken: kit.shareToken,
    shareExpiresAt: kit.shareExpiresAt,
    hasPassword: Boolean(kit.sharePassword),
    guidePdfUrl: kit.guideReady ? `/app/projets/${kit.projectId}/kit/charte?v=${kit.version}` : null,
    zipUrl: kit.zipReady ? "client" : null,
    createdAt: kit.createdAt,
  };
}

export const mockClient: ApiClient = {
  mode: "mock",

  auth: {
    async register({ fullName, email, password }) {
      await wait();
      const data = db();
      if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw problem(409, "Un compte existe déjà avec cet e-mail", "EMAIL_TAKEN");
      if (password.length < 8) throw problem(400, "Le mot de passe doit contenir au moins 8 caractères", "WEAK_PASSWORD");
      const userId = id("u");
      const workspaceId = id("w");
      data.users.push({ id: userId, email, phone: null, password, fullName, avatarUrl: null, locale: "fr", country: "GN", role: "USER", emailVerifiedAt: null, totpEnabled: false, suspendedAt: null, createdAt: now() });
      // Espace personnel créé à l'inscription (PRJ-01)
      data.workspaces.push({ id: workspaceId, name: `Espace de ${fullName.split(" ")[0]}`, slug: workspaceId, kind: "PERSONAL", creditBalance: 0, planCode: "FREE", renewsAt: null });
      data.memberships.push({ userId, workspaceId, role: "OWNER", joinedAt: now() });
      writeLedger(workspaceId, 10, "PROMO", "Crédits de bienvenue");
      return session(userId);
    },
    async login({ email, password }) {
      await wait(300);
      const user = db().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.password !== password) throw problem(401, "E-mail ou mot de passe incorrect", "INVALID_CREDENTIALS");
      if (user.suspendedAt) throw problem(403, "Ce compte est suspendu", "SUSPENDED");
      return session(user.id);
    },
    async refresh() {
      const data = db();
      if (!data.currentUserId || !data.users.some((u) => u.id === data.currentUserId)) return null;
      return session(data.currentUserId);
    },
    async logout() {
      db().currentUserId = null;
      tokenStore.set(null);
      save();
    },
    googleUrl: () => "#google-indisponible-en-mode-simule",
    async requestOtp() {
      await wait();
    },
    async verifyOtp(phone, code) {
      await wait();
      if (code !== "123456") throw problem(400, "Code incorrect (en mode simulé : 123456)", "INVALID_OTP");
      const user = db().users.find((u) => u.phone === phone.replace(/\s/g, "")) ?? db().users[0]!;
      return session(user.id);
    },
    async forgotPassword() {
      await wait();
    },
    async resetPassword() {
      await wait();
    },
    async setup2fa() {
      await wait();
      const secret = "JBSWY3DPEHPK3PXP";
      return { secret, otpauthUrl: `otpauth://totp/Identite:${currentUser().email}?secret=${secret}&issuer=Identite` };
    },
    async verify2fa(code) {
      await wait();
      if (!/^\d{6}$/.test(code)) throw problem(400, "Code à 6 chiffres attendu", "INVALID_TOTP");
      currentUser().totpEnabled = true;
      save();
      return { backupCodes: Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10).toUpperCase()) };
    },
  },

  me: {
    async get() {
      return toUser(currentUser());
    },
    async update(patch) {
      await wait();
      Object.assign(currentUser(), patch);
      save();
      return toUser(currentUser());
    },
    async remove() {
      await wait();
      const user = currentUser();
      const data = db();
      data.users = data.users.filter((u) => u.id !== user.id);
      data.currentUserId = null;
      tokenStore.set(null);
      save();
    },
    async exportData() {
      const data = db();
      const user = currentUser();
      const blob = new Blob([JSON.stringify({ user: toUser(user), memberships: data.memberships.filter((m) => m.userId === user.id) }, null, 2)], { type: "application/json" });
      return { url: URL.createObjectURL(blob) };
    },
  },

  workspaces: {
    async list() {
      const user = currentUser();
      const data = db();
      return data.memberships
        .filter((m) => m.userId === user.id)
        .map((m) => toWorkspace(data.workspaces.find((w) => w.id === m.workspaceId)!, m.role));
    },
    async create({ name }) {
      await wait();
      const user = currentUser();
      const data = db();
      const workspace = { id: id("w"), name, slug: name.toLowerCase().replace(/\W+/g, "-"), kind: "ORGANIZATION" as const, creditBalance: 0, planCode: "FREE" as const, renewsAt: null };
      data.workspaces.push(workspace);
      data.memberships.push({ userId: user.id, workspaceId: workspace.id, role: "OWNER", joinedAt: now() });
      save();
      return toWorkspace(workspace, "OWNER");
    },
    async update(wid, { name }) {
      requireRole(wid, "OWNER");
      const workspace = db().workspaces.find((w) => w.id === wid)!;
      workspace.name = name;
      save();
      return toWorkspace(workspace, "OWNER");
    },
    async members(wid) {
      requireRole(wid, "VIEWER");
      const data = db();
      return data.memberships
        .filter((m) => m.workspaceId === wid)
        .map((m) => {
          const user = data.users.find((u) => u.id === m.userId);
          return { userId: m.userId, fullName: user?.fullName ?? "—", email: user?.email ?? null, role: m.role, joinedAt: m.joinedAt };
        });
    },
    async invitations(wid) {
      requireRole(wid, "OWNER");
      return db().invitations.filter((i) => i.workspaceId === wid).map(({ token, ...rest }) => ({ ...rest, link: `/invitation/${token}` }));
    },
    async invite(wid, { email, role, asLink }) {
      await wait();
      requireRole(wid, "OWNER");
      const token = id("inv");
      const invitation = { id: id("i"), workspaceId: wid, email: asLink ? "lien d'invitation" : email ?? "", role, token, expiresAt: new Date(Date.now() + 7 * 864e5).toISOString() };
      db().invitations.push(invitation);
      save();
      return { id: invitation.id, email: invitation.email, role, expiresAt: invitation.expiresAt, link: `/invitation/${token}` };
    },
    async updateMember(wid, uid, role) {
      requireRole(wid, "OWNER");
      const membership = db().memberships.find((m) => m.workspaceId === wid && m.userId === uid);
      if (membership) membership.role = role;
      save();
    },
    async removeMember(wid, uid) {
      requireRole(wid, "OWNER");
      const data = db();
      data.memberships = data.memberships.filter((m) => !(m.workspaceId === wid && m.userId === uid));
      save();
    },
    async acceptInvitation(token) {
      await wait();
      const user = currentUser();
      const data = db();
      const invitation = data.invitations.find((i) => i.token === token);
      if (!invitation || Date.parse(invitation.expiresAt) < Date.now()) throw problem(410, "Invitation expirée ou invalide", "INVITATION_EXPIRED");
      if (!data.memberships.some((m) => m.userId === user.id && m.workspaceId === invitation.workspaceId)) {
        data.memberships.push({ userId: user.id, workspaceId: invitation.workspaceId, role: invitation.role, joinedAt: now() });
      }
      data.invitations = data.invitations.filter((i) => i.id !== invitation.id);
      save();
      return toWorkspace(data.workspaces.find((w) => w.id === invitation.workspaceId)!, invitation.role);
    },
  },

  projects: {
    async list(wid, filters = {}) {
      await wait(120);
      requireRole(wid, "VIEWER");
      const q = filters.q?.toLowerCase().trim();
      return db()
        .projects.filter((p) => p.workspaceId === wid)
        .filter((p) => (filters.trash ? p.deletedAt && Date.now() - Date.parse(p.deletedAt) < 30 * 864e5 : !p.deletedAt))
        .filter((p) => !filters.entityType || p.entityType === filters.entityType)
        .filter((p) => !filters.status || p.status === filters.status)
        .filter((p) => !q || p.title.toLowerCase().includes(q) || projectName(p).toLowerCase().includes(q))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(toProject);
    },
    async create(wid, { title, entityType, existingName }) {
      await wait();
      requireRole(wid, "EDITOR");
      const data = db();
      const project: DbProject = { id: id("p"), workspaceId: wid, entityType, status: "DRAFT", title, chosenNameId: null, brief: null, createdAt: now(), updatedAt: now(), deletedAt: null };
      data.projects.push(project);
      if (existingName?.trim()) {
        // Parcours « J'ai déjà un nom »
        const nameId = id("nm");
        data.names.push({ id: nameId, projectId: project.id, jobId: null, value: existingName.trim(), acronym: null, meaning: "Nom saisi par l'utilisateur", style: "PROPER", pronunciation: null, score: null, isFavorite: true, isRejected: false, votes: {}, checks: [], createdAt: now() });
        project.chosenNameId = nameId;
        project.status = "IN_PROGRESS";
      }
      logActivity(project.id, "a créé le projet");
      save();
      return toProject(project);
    },
    async get(pid) {
      await wait(80);
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "VIEWER");
      return toProject(project);
    },
    async update(pid, patch) {
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      Object.assign(project, patch, { updatedAt: now() });
      save();
      return toProject(project);
    },
    async remove(pid) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "OWNER");
      project.deletedAt = now();
      save();
    },
    async restore(pid) {
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "OWNER");
      project.deletedAt = null;
      save();
      return toProject(project);
    },
    async duplicate(pid) {
      await wait();
      const source = projectOr404(pid);
      requireRole(source.workspaceId, "EDITOR");
      const copy: DbProject = { ...structuredClone(source), id: id("p"), title: `${source.title} (copie)`, chosenNameId: null, status: "DRAFT", createdAt: now(), updatedAt: now() };
      db().projects.push(copy);
      save();
      return toProject(copy);
    },
    async saveBrief(pid, brief) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      if (brief.mission.length > 500) throw problem(400, "La mission est limitée à 500 caractères", "VALIDATION");
      project.brief = brief;
      project.updatedAt = now();
      if (project.status === "DRAFT") project.status = "IN_PROGRESS";
      logActivity(pid, "a enregistré le brief");
      save();
      return toProject(project);
    },
    async activity(pid) {
      return db().activity.filter((a) => a.projectId === pid).slice(0, 30);
    },
  },

  names: {
    async generate(pid, input, key) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      return { jobId: startJob(project, "NAMES", CREDIT_COSTS.NAMES_BATCH, { ...input }, key).id };
    },
    async list(pid) {
      await wait(100);
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "VIEWER");
      return db().names.filter((n) => n.projectId === pid).map(toName);
    },
    async update(nid, patch) {
      const name = db().names.find((n) => n.id === nid);
      if (!name) throw problem(404, "Nom introuvable");
      requireRole(projectOr404(name.projectId).workspaceId, "EDITOR");
      Object.assign(name, patch);
      if (patch.isRejected) name.isFavorite = false;
      save();
      return toName(name);
    },
    async check(nid) {
      await wait(900);
      const data = db();
      const name = data.names.find((n) => n.id === nid);
      if (!name) throw problem(404, "Nom introuvable");
      // Cache 24 h (NOM-25)
      const fresh = name.checks[0] && Date.now() - Date.parse(name.checks[0].checkedAt) < 864e5;
      if (!fresh) {
        const others = data.projects.filter((p) => p.chosenNameId && p.id !== name.projectId).map((p) => projectName(p));
        name.checks = availabilityChecks(name.value, others);
        const domainsFree = name.checks.filter((c) => c.kind === "DOMAIN" && c.status === "AVAILABLE").length;
        name.score = Math.min(99, Math.round((name.score ?? 60) * 0.8 + domainsFree * 3.4));
        save();
      }
      return name.checks;
    },
    async vote(nid, value) {
      const user = currentUser();
      const name = db().names.find((n) => n.id === nid)!;
      requireRole(projectOr404(name.projectId).workspaceId, "VIEWER");
      if (name.votes[user.id] === value) delete name.votes[user.id];
      else name.votes[user.id] = value;
      save();
      return toName(name);
    },
    async choose(pid, nid) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      const data = db();
      const name = data.names.find((n) => n.id === nid);
      if (!name) throw problem(404, "Nom introuvable");
      const hadName = Boolean(project.chosenNameId);
      project.chosenNameId = nid;
      project.updatedAt = now();
      name.isFavorite = true;
      // Changer de nom final crée une nouvelle version du kit (NOM-33)
      if (hadName && data.brandKits.some((k) => k.projectId === pid)) {
        const last = data.brandKits.filter((k) => k.projectId === pid).sort((a, b) => b.version - a.version)[0]!;
        data.brandKits.push({ ...last, id: id("kit"), version: last.version + 1, shareToken: null, guideReady: false, zipReady: false, createdAt: now() });
      }
      logActivity(pid, `a retenu le nom « ${name.value} »`);
      save();
      return toProject(project);
    },
    async tryPublic(input) {
      await wait(700);
      const data = db();
      if (data.publicTries.day !== today()) data.publicTries = { day: today(), count: 0 };
      if (data.publicTries.count >= FREE_QUOTAS.publicTriesPerDay) throw problem(429, "Vous avez utilisé vos 3 essais du jour. Créez un compte gratuit pour continuer.", "TRY_LIMIT");
      data.publicTries.count += 1;
      save();
      const names = generateNames({
        brief: { sector: input.sector, mission: "", values: input.keywords, audience: "", languages: ["fr"], nameStyles: [], maxLength: 16, mustInclude: input.keywords, mustAvoid: [], tone: "" },
        title: input.sector,
        entityType: input.entityType,
        exclude: new Set(),
        seed: Date.now() % 100000,
      });
      return { names: names.map(({ value, meaning, style }) => ({ value, meaning, style })), remaining: FREE_QUOTAS.publicTriesPerDay - data.publicTries.count };
    },
  },

  logos: {
    async generate(pid, input, key) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      const cost = input.engine === "IMAGE_VECTORIZE" ? CREDIT_COSTS.LOGOS_IMAGE_VECTORIZE : CREDIT_COSTS.LOGOS_SVG_COMPOSER;
      return { jobId: startJob(project, "LOGOS", cost, { ...input }, key).id };
    },
    async importLogo(pid, { palette }) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      const data = db();
      const logoId = id("lg");
      const [primary = "#111827", secondary = "#6b7280", text = "#111827"] = palette;
      data.logos.unshift({ id: logoId, projectId: pid, jobId: null, type: "ICON_TEXT", engine: "UPLOAD", style: "MODERN", isFavorite: true, isExclusive: false, createdAt: now() });
      data.logoVersions.push({
        id: id("lv"),
        logoId,
        number: 1,
        label: "Logo importé",
        spec: { ...DEFAULT_SPEC, text: projectName(project), colors: { primary, secondary, text, background: "#ffffff" } },
        createdAt: now(),
      });
      logActivity(pid, "a importé un logo existant");
      save();
      return toLogo(data.logos[0]!);
    },
    async list(pid) {
      await wait(100);
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "VIEWER");
      return db().logos.filter((l) => l.projectId === pid).map(toLogo);
    },
    async get(lid) {
      const logo = db().logos.find((l) => l.id === lid);
      if (!logo) throw problem(404, "Logo introuvable", "NOT_FOUND");
      requireRole(projectOr404(logo.projectId).workspaceId, "VIEWER");
      return toLogo(logo);
    },
    async update(lid, patch) {
      const logo = db().logos.find((l) => l.id === lid)!;
      requireRole(projectOr404(logo.projectId).workspaceId, "EDITOR");
      Object.assign(logo, patch);
      save();
      return toLogo(logo);
    },
    async versions(lid) {
      return db()
        .logoVersions.filter((v) => v.logoId === lid)
        .sort((a, b) => b.number - a.number)
        .map(({ logoId: _logoId, ...v }) => v);
    },
    async saveVersion(lid, { spec, label }) {
      await wait();
      const logo = db().logos.find((l) => l.id === lid)!;
      requireRole(projectOr404(logo.projectId).workspaceId, "EDITOR");
      const number = latestVersion(lid).number + 1;
      const version = { id: id("lv"), logoId: lid, number, label: label ?? null, spec, createdAt: now() };
      db().logoVersions.push(version);
      logActivity(logo.projectId, `a enregistré la version ${number} d'un logo`);
      save();
      const { logoId: _logoId, ...rest } = version;
      return rest;
    },
    async requestExport(lid) {
      const logo = db().logos.find((l) => l.id === lid)!;
      requireRole(projectOr404(logo.projectId).workspaceId, "EDITOR");
      return { jobId: "client-export" };
    },
  },

  slogans: {
    async generate(pid, input, key) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      return { jobId: startJob(project, "SLOGANS", CREDIT_COSTS.SLOGANS_BATCH, { ...input }, key).id };
    },
    async list(pid) {
      return db().slogans.filter((s) => s.projectId === pid);
    },
    async update(sid, patch) {
      const data = db();
      const slogan = data.slogans.find((s) => s.id === sid)!;
      requireRole(projectOr404(slogan.projectId).workspaceId, "EDITOR");
      if (patch.isChosen) data.slogans.filter((s) => s.projectId === slogan.projectId && s.kind === slogan.kind).forEach((s) => (s.isChosen = false));
      Object.assign(slogan, patch);
      save();
      return slogan;
    },
  },

  signatures: {
    async list(pid) {
      return db().signatures.filter((s) => s.projectId === pid);
    },
    async create(pid, input) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      const data = db();
      if (input.kind !== "EMAIL" && !input.attested) throw problem(400, "Vous devez certifier être habilité à représenter la structure", "ATTESTATION_REQUIRED");
      let status: "ACTIVE" | "PENDING_REVIEW" = "ACTIVE";
      if (input.kind === "STAMP") {
        const stamp = input.data as StampData;
        if (findOfficialTerms(stamp.ringText, stamp.bottomText, stamp.centerText).length) status = "PENDING_REVIEW";
      }
      if (input.kind !== "EMAIL") {
        const workspace = data.workspaces.find((w) => w.id === project.workspaceId)!;
        if (workspace.creditBalance < CREDIT_COSTS.HANDWRITTEN_OR_STAMP) throw problem(402, "Crédits insuffisants", "INSUFFICIENT_CREDITS");
        writeLedger(workspace.id, -CREDIT_COSTS.HANDWRITTEN_OR_STAMP, "GENERATION", input.kind === "STAMP" ? "Cachet" : "Paraphe");
      }
      const signature = {
        id: id("sg"),
        projectId: pid,
        kind: input.kind,
        status,
        templateId: input.templateId ?? null,
        data: input.data,
        html: null,
        isPrivate: input.kind !== "EMAIL",
        attestedAt: input.attested ? now() : null,
        createdAt: now(),
      };
      data.signatures.unshift(signature);
      logActivity(pid, `a créé une signature (${input.kind.toLowerCase()})`);
      if (status === "PENDING_REVIEW") audit("signature.pending_review", "Signature", signature.id);
      save();
      return signature;
    },
    async update(sid, patch) {
      const signature = db().signatures.find((s) => s.id === sid)!;
      requireRole(projectOr404(signature.projectId).workspaceId, "EDITOR");
      const { attested, ...rest } = patch;
      if (signature.kind !== "EMAIL" && !attested) throw problem(400, "Vous devez certifier être habilité à représenter la structure", "ATTESTATION_REQUIRED");
      Object.assign(signature, rest);
      if (attested) signature.attestedAt = now();
      if (signature.kind === "STAMP") {
        const stamp = signature.data as StampData;
        signature.status = findOfficialTerms(stamp.ringText, stamp.bottomText, stamp.centerText).length ? "PENDING_REVIEW" : "ACTIVE";
      }
      save();
      return signature;
    },
    async html() {
      throw problem(501, "Généré dans le navigateur en mode simulé");
    },
    async fileUrl(sid) {
      return { url: `mock://signatures/${sid}`, expiresAt: new Date(Date.now() + 15 * 60e3).toISOString() };
    },
    async batch(_pid, csv) {
      return { count: csv.trim().split(/\r?\n/).length - 1, jobId: "client-batch" };
    },
  },

  brandKits: {
    async list(pid) {
      return db()
        .brandKits.filter((k) => k.projectId === pid)
        .sort((a, b) => b.version - a.version)
        .map(kitToDto);
    },
    async create(pid) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      const data = db();
      const logos = data.logos.filter((l) => l.projectId === pid);
      const logo = logos.find((l) => l.isFavorite) ?? logos[0];
      const version = Math.max(0, ...data.brandKits.filter((k) => k.projectId === pid).map((k) => k.version)) + 1;
      const kit = {
        id: id("kit"),
        projectId: pid,
        version,
        logoSpec: logo ? latestVersion(logo.id).spec : null,
        slogan: data.slogans.find((s) => s.projectId === pid && s.isChosen)?.text ?? null,
        shareToken: null,
        sharePassword: null,
        shareExpiresAt: null,
        guideReady: false,
        zipReady: false,
        createdAt: now(),
      };
      data.brandKits.push(kit);
      if (logo) logo.isExclusive = data.workspaces.find((w) => w.id === project.workspaceId)?.planCode !== "FREE";
      logActivity(pid, `a assemblé le kit v${version}`);
      save();
      return kitToDto(kit);
    },
    async generateGuide(kid) {
      const kit = db().brandKits.find((k) => k.id === kid)!;
      const project = projectOr404(kit.projectId);
      requireRole(project.workspaceId, "EDITOR");
      return { jobId: startJob(project, "BRAND_GUIDE", CREDIT_COSTS.BRAND_GUIDE_PDF, { kitId: kid }, `guide-${kid}-${Date.now()}`).id };
    },
    async generateZip(kid) {
      const kit = db().brandKits.find((k) => k.id === kid)!;
      const project = projectOr404(kit.projectId);
      requireRole(project.workspaceId, "EDITOR");
      return { jobId: startJob(project, "EXPORT_ZIP", 0, { kitId: kid }, `zip-${kid}-${Date.now()}`).id };
    },
    async share(kid, { enabled, password, expiresAt }) {
      await wait();
      const kit = db().brandKits.find((k) => k.id === kid)!;
      requireRole(projectOr404(kit.projectId).workspaceId, "EDITOR");
      kit.shareToken = enabled ? id("share").replace(/-/g, "").slice(0, 24) : null;
      kit.sharePassword = enabled && password ? password : null;
      kit.shareExpiresAt = enabled ? expiresAt ?? null : null;
      save();
      return kitToDto(kit);
    },
    async publicKit(token, password) {
      await wait();
      const data = db();
      const kit = data.brandKits.find((k) => k.shareToken === token);
      if (!kit || (kit.shareExpiresAt && Date.parse(kit.shareExpiresAt) < Date.now())) throw problem(404, "Ce lien de partage n'existe pas ou a expiré", "NOT_FOUND");
      if (kit.sharePassword && kit.sharePassword !== password) throw problem(401, "Mot de passe requis", "PASSWORD_REQUIRED");
      const project = projectOr404(kit.projectId);
      const name = data.names.find((n) => n.id === project.chosenNameId);
      const dto: PublicKit = { ...kitToDto(kit), projectName: projectName(project), acronym: name?.acronym ?? null, meaning: name?.meaning ?? null, entityType: project.entityType };
      return dto;
    },
  },

  jobs: {
    async get(jid) {
      const job = db().jobs.find((j) => j.id === jid);
      if (!job) throw problem(404, "Tâche introuvable");
      jobState(job);
      const { workspaceId: _w, input: _i, durationMs: _d, materialized: _m, willFail: _f, ...rest } = job;
      return rest;
    },
    subscribe(jid, onEvent) {
      const timer = setInterval(() => {
        const job = db().jobs.find((j) => j.id === jid);
        if (!job) return clearInterval(timer);
        const event = jobState(job);
        onEvent(event);
        if (event.status === "SUCCEEDED" || event.status === "FAILED" || event.status === "CANCELED") clearInterval(timer);
      }, 350);
      return () => clearInterval(timer);
    },
  },

  comments: {
    async list(pid) {
      return db().comments.filter((c) => c.projectId === pid);
    },
    async create(pid, input) {
      const user = currentUser();
      requireRole(projectOr404(pid).workspaceId, "VIEWER");
      const comment = { id: id("c"), projectId: pid, authorName: user.fullName, ...input, createdAt: now() };
      db().comments.unshift(comment);
      save();
      return comment;
    },
  },

  notifications: {
    async list() {
      const user = currentUser();
      return db().notifications.filter((n) => n.userId === user.id);
    },
    async markRead(nid) {
      const notification = db().notifications.find((n) => n.id === nid);
      if (notification) notification.readAt = now();
      save();
    },
  },

  billing: {
    async plans() {
      return PLANS;
    },
    async credits(wid) {
      requireRole(wid, "VIEWER");
      const workspace = db().workspaces.find((w) => w.id === wid)!;
      return { balance: workspace.creditBalance, planCode: workspace.planCode, renewsAt: workspace.renewsAt };
    },
    async ledger(wid) {
      requireRole(wid, "OWNER");
      return db()
        .ledger.filter((l) => l.workspaceId === wid)
        .map(({ id, delta, reason, note, createdAt }) => ({ id, delta, reason, note, createdAt }));
    },
    async checkout(wid, input, key) {
      await wait(500);
      requireRole(wid, "OWNER");
      const data = db();
      const existing = data.payments.find((p) => p.id === key);
      if (existing) return { paymentId: existing.id, status: existing.status === "REFUNDED" ? "SUCCEEDED" : existing.status };
      const plan = PLANS.find((p) => p.code === input.planCode);
      if (!plan || plan.priceGnf == null) throw problem(400, "Offre indisponible", "PLAN_UNAVAILABLE");
      if (input.provider !== "CARD" && !/^\+2246\d{8}$/.test((input.phone ?? "").replace(/\s/g, ""))) {
        throw problem(400, "Numéro Orange Money invalide (format +224 6XX XX XX XX)", "INVALID_PHONE");
      }
      const amount = input.interval === "year" ? plan.priceGnf * 10 : plan.priceGnf;
      data.payments.unshift({
        id: key,
        workspaceId: wid,
        provider: input.provider,
        amountGnf: amount,
        status: "PENDING",
        planCode: plan.code,
        createdAt: now(),
        creditsGranted: plan.includedCredits || plan.monthlyCredits,
        resolveAt: Date.now() + 4000,
        willFail: (input.phone ?? "").endsWith("0000"),
      });
      save();
      return {
        paymentId: key,
        status: "PENDING",
        instructions: input.provider === "CARD" ? undefined : "Validez le paiement sur votre téléphone en composant #144# puis votre code secret Orange Money.",
        redirectUrl: input.provider === "CARD" ? undefined : undefined,
      };
    },
    async payment(paymentId) {
      const data = db();
      const payment = data.payments.find((p) => p.id === paymentId);
      if (!payment) throw problem(404, "Paiement introuvable");
      // Simulation du webhook : aucun crédit sans confirmation, une seule fois (PAY-03)
      if (payment.status === "PENDING" && Date.now() >= payment.resolveAt) {
        payment.status = payment.willFail ? "FAILED" : "SUCCEEDED";
        if (payment.status === "SUCCEEDED") {
          const workspace = data.workspaces.find((w) => w.id === payment.workspaceId)!;
          workspace.planCode = payment.planCode ?? workspace.planCode;
          const plan = PLANS.find((p) => p.code === payment.planCode);
          workspace.renewsAt = plan?.interval ? new Date(Date.now() + 30 * 864e5).toISOString() : null;
          writeLedger(workspace.id, payment.creditsGranted, plan?.interval ? "SUBSCRIPTION_GRANT" : "PURCHASE", `Offre ${plan?.name}`, { paymentId });
          const sequence = String(data.invoices.length + 1).padStart(6, "0");
          data.invoices.unshift({ id: id("inv"), workspaceId: workspace.id, paymentId, number: `FAC-${new Date().getFullYear()}-${sequence}`, amountGnf: payment.amountGnf, taxGnf: 0, issuedAt: now(), pdfUrl: null });
          if (data.currentUserId) notify(data.currentUserId, { type: "PAYMENT", title: "Paiement confirmé", body: `${payment.creditsGranted} crédits ajoutés.`, href: "/app/facturation" });
        }
        save();
      }
      const { workspaceId: _w, creditsGranted: _c, resolveAt: _r, willFail: _f, ...rest } = payment;
      return rest;
    },
    async applyPromo(wid, code) {
      await wait();
      requireRole(wid, "OWNER");
      if (code.trim().toUpperCase() !== "BIENVENUE") throw problem(400, "Code promo invalide", "INVALID_PROMO");
      writeLedger(wid, 10, "PROMO", "Code BIENVENUE");
      save();
      return { credits: 10 };
    },
    async sendAssociationProof(wid) {
      await wait(600);
      requireRole(wid, "OWNER");
      audit("association_proof.submitted", "Workspace", wid);
      save();
    },
    async cancelSubscription(wid) {
      requireRole(wid, "OWNER");
      audit("subscription.cancel", "Workspace", wid);
      save();
    },
    async invoices(wid) {
      requireRole(wid, "OWNER");
      return db()
        .invoices.filter((i) => i.workspaceId === wid)
        .map(({ workspaceId: _w, paymentId: _p, ...rest }) => rest);
    },
  },

  library: {
    async fonts() {
      return FONTS.map((f) => ({ id: f.id, name: f.name, category: f.category, license: "OFL" as const, isActive: true }));
    },
  },

  admin: {
    async stats() {
      await wait();
      const data = db();
      const days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
        const r = (Math.sin(i * 1.7) + 1.4) / 2.4;
        return { date, revenueGnf: Math.round(r * 1_800_000), aiCostUsd: Math.round(r * 900) / 100, generations: Math.round(r * 140) };
      });
      const count = (kind: JobKind) => data.jobs.filter((j) => j.kind === kind).length;
      return {
        signups: data.users.length + 312,
        activeUsers: 187,
        generations: { NAMES: count("NAMES") + 820, LOGOS: count("LOGOS") + 410, SLOGANS: count("SLOGANS") + 260, SIGNATURE: 140, BRAND_GUIDE: 52, EXPORT_ZIP: 61 },
        conversionRate: 0.064,
        revenueGnf: days.reduce((s, d) => s + d.revenueGnf, 0),
        aiCostUsd: days.reduce((s, d) => s + d.aiCostUsd, 0),
        daily: days,
      };
    },
    async users(q) {
      const term = q?.toLowerCase() ?? "";
      const data = db();
      return data.users
        .filter((u) => !term || u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
        .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, createdAt: u.createdAt, suspendedAt: u.suspendedAt, totpEnabled: u.totpEnabled, workspaces: data.memberships.filter((m) => m.userId === u.id).length }));
    },
    async updateUser(uid, patch) {
      const data = db();
      const user = data.users.find((u) => u.id === uid)!;
      if (patch.suspended !== undefined) user.suspendedAt = patch.suspended ? now() : null;
      if (patch.reset2fa) user.totpEnabled = false;
      audit(patch.reset2fa ? "user.reset_2fa" : patch.suspended ? "user.suspend" : "user.reactivate", "User", uid);
      save();
      return (await mockClient.admin.users()).find((u) => u.id === uid)!;
    },
    async adjustCredits({ workspaceId, delta, reason }) {
      if (!reason.trim()) throw problem(400, "Le motif est obligatoire", "VALIDATION");
      writeLedger(workspaceId, delta, "ADMIN_ADJUSTMENT", reason);
      audit("credits.adjust", "Workspace", workspaceId);
      save();
    },
    async payments() {
      const data = db();
      return data.payments.map(({ workspaceId, creditsGranted: _c, resolveAt: _r, willFail: _f, ...rest }) => ({ ...rest, workspaceName: data.workspaces.find((w) => w.id === workspaceId)?.name }));
    },
    async refund(paymentId) {
      const data = db();
      const payment = data.payments.find((p) => p.id === paymentId);
      if (!payment || payment.status !== "SUCCEEDED") throw problem(400, "Seul un paiement réussi peut être remboursé");
      payment.status = "REFUNDED";
      writeLedger(payment.workspaceId, -payment.creditsGranted, "REFUND", "Remboursement du paiement", { paymentId });
      audit("payment.refund", "Payment", paymentId);
      save();
    },
    async moderation() {
      const data = db();
      return data.signatures
        .filter((s) => s.status === "PENDING_REVIEW")
        .map((s) => {
          const project = data.projects.find((p) => p.id === s.projectId);
          const stamp = s.data as StampData;
          return {
            id: s.id,
            kind: "STAMP" as const,
            title: stamp.ringText,
            reason: `Termes officiels : ${findOfficialTerms(stamp.ringText, stamp.bottomText, stamp.centerText).join(", ")}`,
            workspaceName: data.workspaces.find((w) => w.id === project?.workspaceId)?.name ?? "—",
            createdAt: s.createdAt,
            previewSvg: renderStampSvg(stamp, { idPrefix: `mod-${s.id}` }),
          };
        });
    },
    async review(sid, decision) {
      const signature = db().signatures.find((s) => s.id === sid);
      if (signature) signature.status = decision === "APPROVE" ? "ACTIVE" : "REJECTED";
      audit(`moderation.${decision.toLowerCase()}`, "Signature", sid);
      save();
    },
    async auditLogs() {
      return db().audit;
    },
  },
};
