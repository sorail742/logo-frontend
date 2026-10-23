import type { ApiClient, Session } from "../contract";
import { ApiError, problem } from "../errors";
import { randomString } from "@/lib/random";
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
import { DEFAULT_SPEC, LOGO_VARIANTS, renderLogoSvg } from "@/lib/render/logo";
import { hashSeed, renderArtwork, styleFromPrompt } from "@/lib/render/artwork";
import type { StudioDesign } from "@/lib/studio/types";
import { DEFAULT_TEMPLATES } from "@/lib/apparel/defaults";
import { checkElements } from "@/lib/apparel/rules";
import type { ApparelDesign, ApparelIssue, ApparelTemplate, RosterEntry, RulePreset } from "@/lib/apparel/types";
import { slugify } from "@/lib/format";
import { brandAssets } from "@/lib/render/logo-assets";
import { resolveFontVars } from "@/lib/render/export";
import { defaultSiteContent, siteMediaIds } from "@/lib/render/site";
import { brandStyle, sectorIcons, socialsOf } from "@/lib/site-defaults";
import type {
  BrandKit,
  EmailSignatureData,
  Website,
  WebsiteMessage,
  CreditRequest,
  JobEvent,
  JobKind,
  Logo,
  NameSuggestion,
  Project,
  PublicKit,
  StampData,
  PlatformRole,
  User,
  Workspace,
  WorkspaceRole,
} from "@/lib/types";

/** Base64 d'un texte UTF-8 (SVG avec accents) pour une data URL. */
function base64Utf8(text: string) {
  return btoa(Array.from(new TextEncoder().encode(text), (byte) => String.fromCodePoint(byte)).join(""));
}

const wait = (ms = 180) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
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

/** Équivalent du WorkspaceGuard côté API : un espace supprimé n'existe plus pour personne. */
function requireRole(workspaceId: string, minimum: WorkspaceRole) {
  const workspace = db().workspaces.find((w) => w.id === workspaceId);
  if (!workspace || workspace.deletedAt) throw problem(404, "Espace introuvable", "NOT_FOUND");
  const role = roleIn(workspaceId);
  if (!role) throw problem(404, "Ressource introuvable", "NOT_FOUND");
  if (RANK[role] < RANK[minimum]) throw problem(403, "Action non autorisée pour votre rôle", "FORBIDDEN");
  return role;
}

const PLATFORM_RANK: Record<PlatformRole, number> = { USER: 0, SUPPORT: 1, ADMIN: 2, SUPER_ADMIN: 3 };

/** Équivalent du RolesGuard : rôle plateforme minimal. */
function requirePlatform(minimum: PlatformRole) {
  const user = currentUser();
  if (PLATFORM_RANK[user.role] < PLATFORM_RANK[minimum]) throw problem(403, "Droits insuffisants", "FORBIDDEN");
  return user;
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

// Créations du Studio : rangées à part (images intégrées), sous une clé dédiée du navigateur.
const STUDIO_KEY = "identite:mock-studio:v1";
let studioCache: StudioDesign[] | null = null;

function studioDesigns(): StudioDesign[] {
  if (studioCache) return studioCache;
  try {
    studioCache = JSON.parse(window.localStorage.getItem(STUDIO_KEY) ?? "[]") as StudioDesign[];
  } catch {
    studioCache = [];
  }
  return studioCache;
}

function saveStudioDesigns(designs: StudioDesign[]) {
  try {
    window.localStorage.setItem(STUDIO_KEY, JSON.stringify(designs));
    studioCache = designs;
  } catch {
    studioCache = null;
    throw problem(413, "Création trop lourde", "PAYLOAD_TOO_LARGE", "Le stockage du navigateur est plein : réduisez le nombre ou la taille des images.");
  }
}

function studioDesign(sdid: string) {
  const design = studioDesigns().find((d) => d.id === sdid);
  if (!design) throw problem(404, "Création introuvable", "NOT_FOUND");
  return design;
}

const ROSTER_INVALID = "Fichier d’effectif invalide";
const NAME_NOT_FOUND = "Nom introuvable";

// Textile : tenues rangées à part (images intégrées), sous une clé dédiée du navigateur.
const APPAREL_KEY = "identite:mock-apparel:v1";
const RULES_DISCLAIMER = "Les préréglages reprennent les principales règles connues ; le règlement officiel de la compétition fait foi.";
const MOCK_PRESETS: RulePreset[] = [
  { id: "rp-football-men", code: "FOOTBALL_MEN", name: "Football hommes (FIFA, UEFA)" },
  { id: "rp-football-women", code: "FOOTBALL_WOMEN", name: "Football femmes (FIFA, UEFA)" },
  { id: "rp-fiba", code: "FIBA", name: "Basket (FIBA)" },
  { id: "rp-free", code: "FREE", name: "Libre (t-shirt, loisir)" },
];
let apparelCache: ApparelDesign[] | null = null;

function apparelDesigns(): ApparelDesign[] {
  if (apparelCache) return apparelCache;
  try {
    apparelCache = JSON.parse(window.localStorage.getItem(APPAREL_KEY) ?? "[]") as ApparelDesign[];
  } catch {
    apparelCache = [];
  }
  return apparelCache;
}

function saveApparel(designs: ApparelDesign[]) {
  try {
    window.localStorage.setItem(APPAREL_KEY, JSON.stringify(designs));
    apparelCache = designs;
  } catch {
    apparelCache = null;
    throw problem(413, "Tenue trop lourde", "PAYLOAD_TOO_LARGE", "Le stockage du navigateur est plein : réduisez le nombre ou la taille des images.");
  }
}

function apparelDesign(did: string) {
  const design = apparelDesigns().find((d) => d.id === did);
  if (!design) throw problem(404, "Tenue introuvable", "NOT_FOUND");
  return design;
}

function apparelTemplate(tid: string): ApparelTemplate {
  const template = DEFAULT_TEMPLATES.find((t) => t.id === tid);
  if (!template) throw problem(400, "Support introuvable ou désactivé", "BAD_REQUEST");
  return template;
}

/** Une tenue modifiée après l'envoi du BAT doit être revalidée. */
function unlockApparel(design: ApparelDesign) {
  if (design.status === "PROOF_SENT" || design.status === "APPROVED") Object.assign(design, { status: "DRAFT", approvedAt: null, proofToken: null });
  design.updatedAt = now();
}

/** Contrôle de l'effectif : numéros en double, tailles absentes du support. */
function rosterIssues(entries: RosterEntry[], sizes: string[]): ApparelIssue[] {
  const issues: ApparelIssue[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (e.number && seen.has(e.number)) issues.push({ code: "DUPLICATE_NUMBER", severity: "error", message: `Numéro ${e.number} attribué deux fois` });
    if (e.number) seen.add(e.number);
    if (!sizes.includes(e.size)) issues.push({ code: "UNKNOWN_SIZE", severity: "error", message: `Taille ${e.size} indisponible pour ${e.displayName}` });
  }
  return issues;
}

function apparelCheck(design: ApparelDesign) {
  const template = apparelTemplate(design.templateId);
  const issues = checkElements(template.zones, design.elements, design.technique, design.garmentColor);
  if (design.roster) issues.push(...rosterIssues(design.roster.entries, template.sizes.map((s) => s.label)));
  const errors = issues.filter((i) => i.severity === "error");
  return { ok: errors.length === 0, errors, warnings: issues.filter((i) => i.severity === "warning"), disclaimer: design.rulePresetId ? RULES_DISCLAIMER : undefined, referenceSize: "M" };
}

/** CSV d'effectif (virgule ou point-virgule) : nom, nom_imprime, numero, taille, poste, quantite. */
function parseRoster(csv: string): RosterEntry[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  const separator = (lines[0] ?? "").includes(";") ? ";" : ",";
  const header = (lines[0] ?? "").split(separator).map((h) => h.trim().toLowerCase());
  const missing = ["nom", "numero", "taille"].filter((c) => !header.includes(c));
  if (!lines.length || missing.length) throw problem(422, ROSTER_INVALID, "UNPROCESSABLE", `Colonnes manquantes : ${missing.join(", ") || "nom, numero, taille"}`);
  return lines.slice(1).map((line, i) => {
    const cells = line.split(separator).map((c) => c.trim());
    const get = (key: string) => cells[header.indexOf(key)] ?? "";
    const quantity = get("quantite") ? Number(get("quantite")) : 1;
    if (!get("nom")) throw problem(422, ROSTER_INVALID, "UNPROCESSABLE", `Ligne ${i + 2} : nom manquant`);
    if (!Number.isInteger(quantity) || quantity < 1) throw problem(422, ROSTER_INVALID, "UNPROCESSABLE", `Ligne ${i + 2} : quantité invalide`);
    return { playerName: get("nom"), displayName: get("nom_imprime") || get("nom").toUpperCase(), number: get("numero") || null, size: get("taille").toUpperCase(), quantity, role: get("poste") || null };
  });
}

// Sites web : rangés à part (images téléversées en data URL), sous une clé dédiée du navigateur.
const SITES_KEY = "identite:mock-sites:v1";
type MockSite = Omit<Website, "dirty" | "url" | "formUrl" | "assetsUrl" | "unreadMessages" | "displayedLogoId" | "free"> & {
  messages: WebsiteMessage[];
};
let sitesCache: MockSite[] | null = null;

function mockSites(): MockSite[] {
  if (sitesCache) return sitesCache;
  try {
    sitesCache = JSON.parse(window.localStorage.getItem(SITES_KEY) ?? "[]") as MockSite[];
  } catch {
    sitesCache = [];
  }
  return sitesCache;
}

function saveMockSites(sites: MockSite[]) {
  try {
    window.localStorage.setItem(SITES_KEY, JSON.stringify(sites));
    sitesCache = sites;
  } catch {
    sitesCache = null;
    throw problem(413, "Site trop lourd", "PAYLOAD_TOO_LARGE", "Le stockage du navigateur est plein : retirez des images du site.");
  }
}

function mockSite(webid: string) {
  const site = mockSites().find((s) => s.id === webid);
  if (!site) throw problem(404, "Site introuvable", "NOT_FOUND");
  return site;
}

/** Logo du site : le choisi, sinon le favori ou le plus récent du projet. */
function siteLogo(projectId: string, logoId: string | null) {
  const logos = db().logos.filter((l) => l.projectId === projectId);
  return (
    logos.find((l) => l.id === logoId) ??
    logos.find((l) => l.isFavorite) ??
    [...logos].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  );
}

function siteDto(site: MockSite): Website {
  const project = projectOr404(site.projectId);
  const workspace = db().workspaces.find((w) => w.id === project.workspaceId);
  const { messages, ...rest } = site;
  return structuredClone({
    ...rest,
    dirty: site.published && !!site.publishedAt && Date.parse(site.updatedAt) > Date.parse(site.publishedAt),
    url: `${typeof window === "undefined" ? "" : window.location.origin}/site/${site.slug}`,
    formUrl: "",
    assetsUrl: "",
    unreadMessages: messages.filter((m) => !m.readAt).length,
    displayedLogoId: siteLogo(site.projectId, site.logoId)?.id ?? null,
    free: workspace?.planCode === "FREE",
  });
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
      site: typeof window !== "undefined" && mockSites().some((site) => site.projectId === project.id && site.published),
    },
    previewSpec: favorite ? latestVersion(favorite.id).spec : null,
  };
}

function toWorkspace(workspace: ReturnType<typeof db>["workspaces"][number], role: WorkspaceRole): Workspace {
  const { renewsAt: _renewsAt, deletedAt: _deletedAt, ...rest } = workspace;
  return { ...rest, viewerDownloads: Boolean(workspace.viewerDownloads), role };
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
    willFail: typeof input.feedback === "string" && input.feedback.includes("__echec__"),
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
    const reference = typeof job.input.referenceLogoId === "string" ? latestVersion(job.input.referenceLogoId)?.spec : undefined;
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
  // Simulation : sigle et origine du nom retenu actuel (l'API les fige dans la version).
  const project = db().projects.find((p) => p.id === kit.projectId);
  const chosen = db().names.find((n) => n.id === project?.chosenNameId);
  const fontIds = spec ? [spec.fontId, "montserrat"] : ["montserrat"];
  return {
    id: kit.id,
    projectId: kit.projectId,
    version: kit.version,
    name: kit.name ?? null,
    acronym: chosen?.acronym ?? null,
    meaning: chosen?.meaning ?? null,
    devise: null,
    mission: null,
    logoSvg: null,
    guideCost: kit.guideReady ? 0 : CREDIT_COSTS.BRAND_GUIDE_PDF,
    restoredFrom: kit.restoredFrom ?? null,
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
  isAvailable: (feature) => feature !== "googleLogin" && feature !== "studioExport",

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
    async google() {
      throw problem(501, "Connexion Google indisponible en mode simulé", "NOT_AVAILABLE");
    },
    async verifyEmail() {
      await wait();
    },
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
      return { backupCodes: Array.from({ length: 8 }, () => randomString(8)) };
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
        .map((m) => ({ workspace: data.workspaces.find((w) => w.id === m.workspaceId), role: m.role }))
        .filter(({ workspace }) => workspace && !workspace.deletedAt)
        .map(({ workspace, role }) => toWorkspace(workspace!, role));
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
    async update(wid, { name, viewerDownloads }) {
      requireRole(wid, "OWNER");
      const workspace = db().workspaces.find((w) => w.id === wid)!;
      if (name !== undefined) workspace.name = name;
      if (viewerDownloads !== undefined) workspace.viewerDownloads = viewerDownloads;
      audit("workspace.update", "Workspace", wid);
      save();
      return toWorkspace(workspace, "OWNER");
    },
    async remove(wid, confirm) {
      await wait();
      requireRole(wid, "OWNER");
      const data = db();
      const workspace = data.workspaces.find((w) => w.id === wid)!;
      if (workspace.kind === "PERSONAL") throw problem(400, "L’espace personnel disparaît avec le compte", "VALIDATION");
      if (confirm.trim() !== workspace.name) throw problem(400, "Saisissez le nom exact de l’espace pour confirmer", "VALIDATION");
      workspace.deletedAt = now();
      for (const project of data.projects) if (project.workspaceId === wid && !project.deletedAt) project.deletedAt = now();
      data.invitations = data.invitations.filter((i) => i.workspaceId !== wid);
      audit("workspace.delete", "Workspace", wid);
      save();
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
      // Retrait par un propriétaire, ou départ volontaire de n'importe quel membre.
      const role = requireRole(wid, "VIEWER");
      const user = currentUser();
      if (uid !== user.id && role !== "OWNER") throw problem(403, "Seul un propriétaire peut retirer un autre membre", "FORBIDDEN");
      const data = db();
      const member = data.memberships.find((m) => m.workspaceId === wid && m.userId === uid);
      if (!member) throw problem(404, "Membre introuvable", "NOT_FOUND");
      const owners = data.memberships.filter((m) => m.workspaceId === wid && m.role === "OWNER").length;
      if (member.role === "OWNER" && owners <= 1) throw problem(409, "L’espace doit garder au moins un propriétaire", "CONFLICT");
      data.memberships = data.memberships.filter((m) => m !== member);
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
      // La corbeille relève de qui peut supprimer et restaurer : le propriétaire.
      requireRole(wid, filters.trash ? "OWNER" : "VIEWER");
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
      if (!name) throw problem(404, NAME_NOT_FOUND);
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
      if (!name) throw problem(404, NAME_NOT_FOUND);
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
      if (!name) throw problem(404, NAME_NOT_FOUND);
      const hadName = Boolean(project.chosenNameId);
      project.chosenNameId = nid;
      project.updatedAt = now();
      name.isFavorite = true;
      // Changer de nom final crée une nouvelle version du kit (NOM-33)
      if (hadName && data.brandKits.some((k) => k.projectId === pid)) {
        const last = data.brandKits.filter((k) => k.projectId === pid).sort((a, b) => b.version - a.version)[0]!;
        data.brandKits.push({ ...last, id: id("kit"), version: last.version + 1, name: name.value, restoredFrom: null, shareToken: null, guideReady: false, zipReady: false, createdAt: now() });
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
    async variants(lid) {
      const logo = db().logos.find((l) => l.id === lid);
      if (!logo) throw problem(404, "Logo introuvable", "NOT_FOUND");
      requireRole(projectOr404(logo.projectId).workspaceId, "VIEWER");
      const version = latestVersion(lid);
      return {
        versionId: version.id,
        variants: LOGO_VARIANTS.map((def) => ({
          id: def.id,
          file: `logo-${def.id}.svg`,
          dark: def.dark,
          svg: renderLogoSvg(version.spec, { variant: def.variant, layout: def.layout, withBackground: false }).svg,
        })),
      };
    },
  },

  studio: {
    async list(pid) {
      requireRole(projectOr404(pid).workspaceId, "VIEWER");
      return studioDesigns()
        .filter((d) => d.projectId === pid)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(({ doc: _doc, ...summary }) => summary);
    },
    async create(pid, input) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      const design: StudioDesign = {
        id: id("sd"),
        projectId: pid,
        name: input.name.trim(),
        format: input.format,
        width: Math.round(input.doc.width),
        height: Math.round(input.doc.height),
        doc: input.doc,
        thumbnail: input.thumbnail ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      saveStudioDesigns([design, ...studioDesigns()]);
      logActivity(pid, `a créé « ${design.name} » dans le Studio`);
      return structuredClone(design);
    },
    async get(sdid) {
      const design = studioDesign(sdid);
      requireRole(projectOr404(design.projectId).workspaceId, "VIEWER");
      return structuredClone(design);
    },
    async save(sdid, patch) {
      const design = studioDesign(sdid);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      if (patch.name) design.name = patch.name.trim();
      if (patch.doc) Object.assign(design, { doc: patch.doc, width: Math.round(patch.doc.width), height: Math.round(patch.doc.height) });
      if (patch.thumbnail) design.thumbnail = patch.thumbnail;
      design.updatedAt = now();
      saveStudioDesigns(studioDesigns());
      const { doc: _doc, ...summary } = design;
      return structuredClone(summary);
    },
    async duplicate(sdid) {
      const source = studioDesign(sdid);
      requireRole(projectOr404(source.projectId).workspaceId, "EDITOR");
      const copy: StudioDesign = { ...structuredClone(source), id: id("sd"), name: `${source.name} (copie)`.slice(0, 120), createdAt: now(), updatedAt: now() };
      saveStudioDesigns([copy, ...studioDesigns()]);
      return structuredClone(copy);
    },
    async remove(sdid) {
      const design = studioDesign(sdid);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      saveStudioDesigns(studioDesigns().filter((d) => d.id !== sdid));
    },
    async requestExport() {
      throw problem(501, "Bientôt disponible", "NOT_AVAILABLE", "Le PDF d'impression est produit par le serveur de la plateforme.");
    },
    async cutout() {
      throw problem(501, "Détourage IA non activé", "NOT_AVAILABLE", "Le détourage par IA est fourni par le serveur de la plateforme : utilisez le fond uni, la baguette ou les pinceaux.");
    },
    async generateImages(pid, input, key) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      const job = startJob(project, "STUDIO_IMAGES", CREDIT_COSTS.STUDIO_IMAGES, { ...input }, key);
      // Même générateur que le fournisseur de démonstration de l'API.
      const ratio = input.aspect === "square" ? 1 : input.aspect === "portrait" ? 4 / 5 : 16 / 9;
      const width = ratio >= 1 ? 1200 : Math.round(1200 * ratio);
      const height = ratio >= 1 ? Math.round(1200 / ratio) : 1200;
      const palette = input.palette?.length ? input.palette : ["#0f6b5c", "#f2b705", "#14281d", "#f6fbf4"];
      const style = input.style === "auto" ? (styleFromPrompt(input.prompt) ?? "abstract") : input.style;
      const seed = hashSeed(`${input.prompt}|${input.style}|${palette.join()}`);
      job.result = {
        demo: true,
        provider: "mock",
        images: Array.from({ length: 4 }, (_, i) => ({
          url: `data:image/svg+xml;base64,${base64Utf8(renderArtwork({ style, palette, width, height, seed: seed + i * 7919 }))}`,
          width,
          height,
        })),
      };
      save();
      return { jobId: job.id };
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
        name: projectName(project),
        restoredFrom: null,
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
    async restore(kid) {
      await wait();
      const data = db();
      const source = data.brandKits.find((k) => k.id === kid)!;
      requireRole(projectOr404(source.projectId).workspaceId, "EDITOR");
      const version = Math.max(...data.brandKits.filter((k) => k.projectId === source.projectId).map((k) => k.version)) + 1;
      const kit = { ...source, id: id("kit"), version, restoredFrom: source.version, shareToken: null, sharePassword: null, shareExpiresAt: null, zipReady: false, createdAt: now() };
      data.brandKits.push(kit);
      logActivity(source.projectId, `a restauré le kit v${source.version} (nouvelle version v${version})`);
      save();
      return kitToDto(kit);
    },
    async generateGuide(kid, idempotencyKey) {
      const kit = db().brandKits.find((k) => k.id === kid)!;
      const project = projectOr404(kit.projectId);
      requireRole(project.workspaceId, "EDITOR");
      return { jobId: startJob(project, "BRAND_GUIDE", kit.guideReady ? 0 : CREDIT_COSTS.BRAND_GUIDE_PDF, { kitId: kid }, idempotencyKey).id };
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

  apparel: {
    async templates() {
      return structuredClone(DEFAULT_TEMPLATES);
    },
    async rulePresets() {
      return { disclaimer: RULES_DISCLAIMER, presets: structuredClone(MOCK_PRESETS) };
    },
    async list(pid) {
      requireRole(projectOr404(pid).workspaceId, "VIEWER");
      return apparelDesigns()
        .filter((d) => d.projectId === pid)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((d) => ({
          id: d.id,
          templateId: d.templateId,
          name: d.name,
          technique: d.technique,
          garmentColor: d.garmentColor,
          status: d.status,
          updatedAt: d.updatedAt,
          template: { name: d.template.name, category: d.template.category },
          _count: { elements: d.elements.length },
        }));
    },
    async create(pid, input) {
      await wait();
      requireRole(projectOr404(pid).workspaceId, "EDITOR");
      const template = apparelTemplate(input.templateId);
      const preset = input.rulePresetId ? MOCK_PRESETS.find((p) => p.id === input.rulePresetId) : null;
      if (input.rulePresetId && !preset) throw problem(404, "Préréglage introuvable", "NOT_FOUND");
      const design: ApparelDesign = {
        id: id("ad"),
        projectId: pid,
        templateId: template.id,
        rulePresetId: preset?.id ?? null,
        name: input.name.trim(),
        technique: input.technique,
        garmentColor: input.garmentColor,
        status: "DRAFT",
        proofToken: null,
        approvedAt: null,
        createdAt: now(),
        updatedAt: now(),
        template: { id: template.id, name: template.name, category: template.category },
        rulePreset: preset ?? null,
        elements: [],
        roster: null,
      };
      saveApparel([design, ...apparelDesigns()]);
      logActivity(pid, `a créé la tenue « ${design.name} »`);
      return structuredClone(design);
    },
    async get(did) {
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "VIEWER");
      return structuredClone(design);
    },
    async update(did, patch) {
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      if (patch.rulePresetId !== undefined) {
        const preset = patch.rulePresetId ? MOCK_PRESETS.find((p) => p.id === patch.rulePresetId) : null;
        if (patch.rulePresetId && !preset) throw problem(404, "Préréglage introuvable", "NOT_FOUND");
        Object.assign(design, { rulePresetId: preset?.id ?? null, rulePreset: preset ?? null });
      }
      if (patch.name) design.name = patch.name.trim();
      if (patch.technique) design.technique = patch.technique;
      if (patch.garmentColor) design.garmentColor = patch.garmentColor;
      unlockApparel(design);
      saveApparel(apparelDesigns());
      return structuredClone(design);
    },
    async remove(did) {
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      saveApparel(apparelDesigns().filter((d) => d.id !== did));
    },
    async saveElements(did, elements) {
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      const keys = new Set(apparelTemplate(design.templateId).zones.map((z) => z.key));
      const unknown = [...new Set(elements.filter((e) => !keys.has(e.zoneKey)).map((e) => e.zoneKey))];
      if (unknown.length) throw problem(400, `Zones absentes de ce support : ${unknown.join(", ")}`, "BAD_REQUEST");
      design.elements = elements.map((e, i) => ({ ...structuredClone(e), id: id("el"), rotationDeg: e.rotationDeg ?? 0, zIndex: e.zIndex ?? i }));
      unlockApparel(design);
      saveApparel(apparelDesigns());
      return structuredClone(design);
    },
    async check(did) {
      await wait();
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      return apparelCheck(design);
    },
    async importRoster(did, csv, name) {
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      const entries = parseRoster(csv);
      const issues = rosterIssues(entries, apparelTemplate(design.templateId).sizes.map((s) => s.label));
      if (issues.length) throw new ApiError({ status: 422, title: "Effectif non conforme", detail: issues[0]!.message, code: "UNPROCESSABLE", issues });
      const rosterName = name?.trim() ?? "";
      design.roster = { name: rosterName.length > 0 ? rosterName : "Effectif", entries };
      unlockApparel(design);
      saveApparel(apparelDesigns());
      const bySize: Record<string, number> = {};
      for (const e of entries) bySize[e.size] = (bySize[e.size] ?? 0) + e.quantity;
      return { roster: structuredClone(design.roster), summary: { players: entries.length, garments: Object.values(bySize).reduce((a, b) => a + b, 0), bySize } };
    },
    async proof(did) {
      await wait();
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      if (design.status === "APPROVED" || design.status === "IN_PRODUCTION") throw problem(409, "Cette tenue est déjà approuvée", "CONFLICT");
      const report = apparelCheck(design);
      if (!report.ok) throw new ApiError({ status: 422, title: "BAT refusé", detail: "Corrigez les erreurs avant d’envoyer le BAT", code: "UNPROCESSABLE", issues: report.errors });
      design.proofToken ??= id().replace(/-/g, "").slice(0, 32);
      design.status = "PROOF_SENT";
      saveApparel(apparelDesigns());
      return { token: design.proofToken, url: `${window.location.origin}/bat/${design.proofToken}` };
    },
    async revokeProof(did) {
      const design = apparelDesign(did);
      requireRole(projectOr404(design.projectId).workspaceId, "EDITOR");
      design.proofToken = null;
      if (design.status === "PROOF_SENT") design.status = "DRAFT";
      saveApparel(apparelDesigns());
      return { revoked: true as const };
    },
    async publicProof(token) {
      await wait();
      const design = apparelDesigns().find((d) => d.proofToken === token);
      if (!design) throw problem(404, "BAT introuvable ou révoqué", "NOT_FOUND");
      const template = apparelTemplate(design.templateId);
      return structuredClone({
        name: design.name,
        technique: design.technique,
        garmentColor: design.garmentColor,
        status: design.status,
        approvedAt: design.approvedAt,
        template: { name: template.name, category: template.category, zones: template.zones },
        elements: design.elements,
        roster: design.roster ? { name: design.roster.name, entries: design.roster.entries.map(({ displayName, number, size, quantity }) => ({ displayName, number, size, quantity })) } : null,
      });
    },
    async approveProof(token) {
      await wait();
      const design = apparelDesigns().find((d) => d.proofToken === token);
      if (!design) throw problem(404, "BAT introuvable ou révoqué", "NOT_FOUND");
      if (design.status === "APPROVED") return { status: design.status, approvedAt: design.approvedAt };
      if (design.status !== "PROOF_SENT") throw problem(410, "Ce BAT n’est plus en attente d’approbation", "GONE");
      Object.assign(design, { status: "APPROVED", approvedAt: now() });
      saveApparel(apparelDesigns());
      return { status: design.status, approvedAt: design.approvedAt };
    },
  },

  websites: {
    async get(pid) {
      requireRole(projectOr404(pid).workspaceId, "VIEWER");
      const site = mockSites().find((s) => s.projectId === pid);
      return site ? siteDto(site) : null;
    },
    async create(pid) {
      await wait();
      const project = projectOr404(pid);
      requireRole(project.workspaceId, "EDITOR");
      if (mockSites().some((s) => s.projectId === pid)) throw problem(409, "Ce projet a déjà un site web", "SITE_EXISTS");
      const logo = siteLogo(pid, null);
      if (!logo) throw problem(400, "Créez d’abord un logo : le site reprend votre identité visuelle", "NO_LOGO");
      const data = db();
      const name = projectName(project);
      const chosen = (kind: string) => data.slogans.find((s) => s.projectId === pid && s.isChosen && s.kind === kind)?.text ?? null;
      const card = data.signatures.find((s) => s.projectId === pid && s.kind === "EMAIL")?.data as EmailSignatureData | undefined;
      const brief = project.brief;
      const content = defaultSiteContent({
        name,
        slogan: chosen("SLOGAN"),
        mission: chosen("MISSION") ?? brief?.mission ?? null,
        sector: brief?.sector ?? null,
        values: brief?.values ?? [],
        audience: brief?.audience ?? null,
        language: brief?.languages?.[0] === "en" ? "en" : "fr",
        ...brandStyle(latestVersion(logo.id).spec),
        contact: { phone: card?.phones.find(Boolean) ?? "", email: card?.email ?? "", address: card?.address ?? "" },
        social: card ? socialsOf(card.socials) : {},
        icons: sectorIcons(brief?.sector ?? ""),
      });
      const stem = slugify(name).slice(0, 40);
      const base = stem.length >= 3 ? stem : `${stem || "mon"}-site`;
      const taken = new Set(mockSites().map((s) => s.slug));
      const slug = taken.has(base) ? `${base}-${id().slice(0, 4)}` : base;
      const site: MockSite = {
        id: id("site"),
        projectId: pid,
        slug,
        logoId: null,
        content,
        published: false,
        publishedAt: null,
        views: 0,
        media: [],
        messages: [],
        createdAt: now(),
        updatedAt: now(),
      };
      saveMockSites([...mockSites(), site]);
      logActivity(pid, "a créé le site web");
      save();
      return siteDto(site);
    },
    async update(webid, input) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "EDITOR");
      if (input.content) {
        const owned = new Set(site.media.map((m) => m.id));
        if (siteMediaIds(input.content).some((mid) => !owned.has(mid))) throw problem(400, "Image inconnue dans le contenu du site", "BAD_REQUEST");
        site.content = structuredClone(input.content);
      }
      if (input.slug !== undefined && input.slug !== site.slug) {
        const slug = input.slug.trim().toLowerCase();
        if (!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(slug) || ["admin", "api", "app", "site", "sites", "www", "aide", "support"].includes(slug)) {
          throw problem(400, "Adresse invalide : 3 à 48 lettres minuscules, chiffres ou tirets", "SLUG_INVALID");
        }
        if (mockSites().some((s) => s.slug === slug && s.id !== webid)) throw problem(409, "Cette adresse est déjà prise", "SLUG_TAKEN");
        site.slug = slug;
      }
      if (input.logoId !== undefined) site.logoId = input.logoId;
      site.updatedAt = now();
      saveMockSites(mockSites());
      return siteDto(site);
    },
    async brand(webid) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "VIEWER");
      const logo = siteLogo(site.projectId, site.logoId);
      if (!logo) throw problem(400, "Le projet n’a plus de logo", "NO_LOGO");
      // Rendu du navigateur : polices nommées (l'API vectorise le texte).
      const assets = brandAssets(latestVersion(logo.id).spec);
      for (const group of [assets.logo, assets.mark]) {
        for (const asset of Object.values(group)) asset.svg = resolveFontVars(asset.svg);
      }
      return { name: projectName(projectOr404(site.projectId)), logoId: logo.id, assets };
    },
    async publish(webid) {
      await wait(400);
      const site = mockSite(webid);
      const project = projectOr404(site.projectId);
      requireRole(project.workspaceId, "EDITOR");
      if (!siteLogo(site.projectId, site.logoId)) throw problem(400, "Le projet n’a plus de logo", "NO_LOGO");
      const stamp = now();
      Object.assign(site, { published: true, publishedAt: stamp, updatedAt: stamp });
      saveMockSites(mockSites());
      logActivity(site.projectId, `a publié le site web (/site/${site.slug})`);
      save();
      return siteDto(site);
    },
    async unpublish(webid) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "EDITOR");
      site.published = false;
      saveMockSites(mockSites());
      logActivity(site.projectId, "a dépublié le site web");
      save();
      return siteDto(site);
    },
    async remove(webid) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "OWNER");
      saveMockSites(mockSites().filter((s) => s.id !== webid));
      logActivity(site.projectId, "a supprimé le site web");
      save();
    },
    async addMedia(webid, input) {
      await wait();
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "EDITOR");
      if (site.media.length >= 24) throw problem(400, "24 images au plus par site", "BAD_REQUEST");
      const match = /^data:(image\/(?:png|jpeg|webp));base64,/.exec(input.dataUrl);
      if (!match) throw problem(400, "Image JPEG, PNG ou WebP attendue", "BAD_REQUEST");
      const sizeBytes = Math.floor(((input.dataUrl.length - match[0].length) * 3) / 4);
      if (sizeBytes > 4 * 1024 * 1024) throw problem(400, "Image de 4 Mo au plus", "BAD_REQUEST");
      const media = { id: id("media"), url: input.dataUrl, alt: input.alt?.trim() ?? "", mimeType: match[1]!, sizeBytes };
      site.media.push(media);
      saveMockSites(mockSites());
      return { id: media.id, url: media.url, alt: media.alt };
    },
    async removeMedia(webid, mid) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "EDITOR");
      if (!site.media.some((m) => m.id === mid)) throw problem(404, "Image introuvable", "NOT_FOUND");
      site.media = site.media.filter((m) => m.id !== mid);
      if (siteMediaIds(site.content).includes(mid)) {
        site.content.sections = site.content.sections.map((section) => {
          if (section.type === "hero" && section.image?.kind === "media" && section.image.id === mid) return { ...section, image: null };
          if (section.type === "gallery") return { ...section, images: section.images.filter((img) => img.kind !== "media" || img.id !== mid) };
          return section;
        });
        site.updatedAt = now();
      }
      saveMockSites(mockSites());
      return siteDto(site);
    },
    async messages(webid) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "EDITOR");
      return structuredClone(site.messages);
    },
    async markMessage(webid, msgid, read) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "EDITOR");
      const message = site.messages.find((m) => m.id === msgid);
      if (!message) throw problem(404, "Message introuvable", "NOT_FOUND");
      message.readAt = read ? now() : null;
      saveMockSites(mockSites());
      return structuredClone(message);
    },
    async removeMessage(webid, msgid) {
      const site = mockSite(webid);
      requireRole(projectOr404(site.projectId).workspaceId, "EDITOR");
      site.messages = site.messages.filter((m) => m.id !== msgid);
      saveMockSites(mockSites());
    },
    async exportZip() {
      throw problem(501, "Bientôt disponible", "NOT_AVAILABLE", "L’archive du site est produite par le serveur de la plateforme.");
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
    async list(pid, filter) {
      return db().comments.filter((c) => c.projectId === pid && (!filter || (c.targetType === filter.targetType && c.targetId === filter.targetId)));
    },
    async create(pid, input) {
      const user = currentUser();
      requireRole(projectOr404(pid).workspaceId, "VIEWER");
      const data = db();
      const parent = input.parentId ? data.comments.find((c) => c.id === input.parentId && c.projectId === pid && !c.parentId) : null;
      if (input.parentId && !parent) throw problem(400, "Ce fil de discussion n'existe pas sur cet élément");
      // Une réponse rouvre un fil résolu.
      if (parent) Object.assign(parent, { resolvedAt: null, resolvedById: null });
      const comment = {
        id: id("c"),
        projectId: pid,
        authorId: user.id,
        authorName: user.fullName,
        mentions: [],
        targetType: input.targetType,
        targetId: input.targetId,
        body: input.body.trim(),
        anchor: parent ? null : (input.anchor ?? null),
        parentId: parent?.id ?? null,
        resolvedAt: null,
        resolvedById: null,
        createdAt: now(),
      };
      data.comments.unshift(comment);
      save();
      return comment;
    },
    async resolve(cid, resolved) {
      const user = currentUser();
      const comment = db().comments.find((c) => c.id === cid);
      if (!comment) throw problem(404, "Commentaire introuvable");
      if (comment.authorId !== user.id) requireRole(projectOr404(comment.projectId).workspaceId, "EDITOR");
      Object.assign(comment, resolved ? { resolvedAt: now(), resolvedById: user.id } : { resolvedAt: null, resolvedById: null });
      save();
      return comment;
    },
    async remove(cid) {
      const user = currentUser();
      const data = db();
      const comment = data.comments.find((c) => c.id === cid);
      if (!comment) throw problem(404, "Commentaire introuvable");
      if (comment.authorId !== user.id) requireRole(projectOr404(comment.projectId).workspaceId, "OWNER");
      data.comments = data.comments.filter((c) => c.id !== cid && c.parentId !== cid);
      save();
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
        redirectUrl: undefined,
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
    // Démonstration locale : visuels génératifs, pas de banque de photos (elle demande une clé côté serveur).
    async capabilities() {
      await wait(80);
      return { aiImages: { provider: "demo", demo: true }, photos: false, cutout: false };
    },
    async photos() {
      await wait(120);
      throw problem(501, "Banque de photos non activée", "NOT_AVAILABLE");
    },
    async photoFile() {
      throw problem(501, "Banque de photos non activée", "NOT_AVAILABLE");
    },
  },

  admin: {
    async stats() {
      await wait();
      requirePlatform("SUPPORT");
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
        generations: { NAMES: count("NAMES") + 820, LOGOS: count("LOGOS") + 410, LOGO_EXPORT: count("LOGO_EXPORT") + 95, SLOGANS: count("SLOGANS") + 260, SIGNATURE: 140, BRAND_GUIDE: 52, EXPORT_ZIP: 61, DESIGN_EXPORT: count("DESIGN_EXPORT") + 38, STUDIO_IMAGES: count("STUDIO_IMAGES") + 74 },
        conversionRate: 0.064,
        revenueGnf: days.reduce((s, d) => s + d.revenueGnf, 0),
        aiCostUsd: days.reduce((s, d) => s + d.aiCostUsd, 0),
        daily: days,
      };
    },
    async users(q) {
      requirePlatform("SUPPORT");
      const term = q?.toLowerCase() ?? "";
      const data = db();
      return data.users
        .filter((u) => !term || u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
        .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, createdAt: u.createdAt, suspendedAt: u.suspendedAt, totpEnabled: u.totpEnabled, workspaces: data.memberships.filter((m) => m.userId === u.id).length }));
    },
    async updateUser(uid, patch) {
      const actor = requirePlatform("ADMIN");
      const data = db();
      const user = data.users.find((u) => u.id === uid)!;
      if (uid === actor.id && patch.suspended) throw problem(403, "Action impossible sur votre propre compte", "FORBIDDEN");
      // Hiérarchie : on n'agit que sur un rang inférieur au sien (le super admin agit sur tous).
      if (uid !== actor.id && actor.role !== "SUPER_ADMIN" && PLATFORM_RANK[user.role] >= PLATFORM_RANK[actor.role]) {
        throw problem(403, "Action impossible sur un compte de rang égal ou supérieur", "FORBIDDEN");
      }
      if (patch.suspended !== undefined) user.suspendedAt = patch.suspended ? now() : null;
      if (patch.reset2fa) user.totpEnabled = false;
      audit(patch.reset2fa ? "user.reset_2fa" : patch.suspended ? "user.suspend" : "user.reactivate", "User", uid);
      save();
      return (await mockClient.admin.users()).find((u) => u.id === uid)!;
    },
    async adjustCredits({ workspaceId, delta, reason }) {
      requirePlatform("ADMIN");
      if (!reason.trim()) throw problem(400, "Le motif est obligatoire", "VALIDATION");
      writeLedger(workspaceId, delta, "ADMIN_ADJUSTMENT", reason);
      audit("credits.adjust", "Workspace", workspaceId);
      save();
    },
    async requestCredits({ workspaceId, delta, reason }) {
      const actor = requirePlatform("SUPPORT");
      const data = db();
      const workspace = data.workspaces.find((w) => w.id === workspaceId);
      if (!workspace) throw problem(404, "Espace introuvable", "NOT_FOUND");
      if (reason.trim().length < 5) throw problem(400, "Le motif est obligatoire", "VALIDATION");
      const request = {
        id: id("cr"),
        workspaceId,
        workspaceName: workspace.name,
        delta,
        reason: reason.trim(),
        status: "PENDING" as const,
        requestedBy: actor.fullName,
        requestedById: actor.id,
        decidedBy: null,
        decisionNote: null,
        decidedAt: null,
        createdAt: now(),
      };
      data.creditRequests ??= [];
      data.creditRequests.unshift(request);
      audit("credits.request", "Workspace", workspaceId);
      save();
      const { requestedById: _requester, ...dto } = request;
      return dto;
    },
    async creditRequests(status) {
      requirePlatform("SUPPORT");
      return (db().creditRequests ?? []).filter((r) => !status || r.status === status).map(({ requestedById: _requester, ...dto }): CreditRequest => dto);
    },
    async decideCreditRequest(requestId, approve, note) {
      const actor = requirePlatform("ADMIN");
      const data = db();
      const request = (data.creditRequests ?? []).find((r) => r.id === requestId);
      if (!request) throw problem(404, "Demande introuvable", "NOT_FOUND");
      if (request.status !== "PENDING") throw problem(409, "Cette demande a déjà été traitée", "CONFLICT");
      if (request.requestedById === actor.id) throw problem(403, "Une demande est validée par un autre administrateur que son auteur", "FORBIDDEN");
      if (approve) writeLedger(request.workspaceId, request.delta, "ADMIN_ADJUSTMENT", `Demande du support validée : ${request.reason}`);
      Object.assign(request, { status: approve ? "APPROVED" : "REJECTED", decidedBy: actor.fullName, decisionNote: note ?? null, decidedAt: now() });
      audit(approve ? "credits.request.approve" : "credits.request.reject", "Workspace", request.workspaceId);
      save();
      const { requestedById: _requester, ...dto } = request;
      return dto;
    },
    async payments() {
      requirePlatform("SUPPORT");
      const data = db();
      return data.payments.map(({ workspaceId, creditsGranted: _c, resolveAt: _r, willFail: _f, ...rest }) => ({ ...rest, workspaceName: data.workspaces.find((w) => w.id === workspaceId)?.name }));
    },
    async refund(paymentId) {
      requirePlatform("ADMIN");
      const data = db();
      const payment = data.payments.find((p) => p.id === paymentId);
      if (!payment || payment.status !== "SUCCEEDED") throw problem(400, "Seul un paiement réussi peut être remboursé");
      payment.status = "REFUNDED";
      writeLedger(payment.workspaceId, -payment.creditsGranted, "REFUND", "Remboursement du paiement", { paymentId });
      audit("payment.refund", "Payment", paymentId);
      save();
    },
    async moderation() {
      requirePlatform("SUPPORT");
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
      requirePlatform("SUPPORT");
      const signature = db().signatures.find((s) => s.id === sid);
      if (signature) signature.status = decision === "APPROVE" ? "ACTIVE" : "REJECTED";
      audit(`moderation.${decision.toLowerCase()}`, "Signature", sid);
      save();
    },
    async auditLogs() {
      requirePlatform("SUPER_ADMIN");
      return db().audit;
    },
  },
};
