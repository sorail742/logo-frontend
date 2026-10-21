import type {
  AppNotification,
  AuditEntry,
  AvailabilityCheck,
  Brief,
  Comment,
  EntityType,
  GenerationJob,
  Invoice,
  JobKind,
  LedgerEntry,
  LedgerReason,
  LogoEngine,
  LogoSpec,
  LogoStyle,
  LogoType,
  NameStyle,
  Payment,
  PlanCode,
  PlatformRole,
  ProjectStatus,
  Signature,
  Slogan,
  WorkspaceKind,
  WorkspaceRole,
} from "@/lib/types";

// Base de données simulée, persistée dans le navigateur. Elle reproduit le modèle Prisma
// (§12) pour que les écrans se comportent comme avec l'API réelle.

export interface DbUser {
  id: string;
  email: string;
  phone: string | null;
  password: string;
  fullName: string;
  avatarUrl: string | null;
  locale: string;
  country: string;
  role: PlatformRole;
  emailVerifiedAt: string | null;
  totpEnabled: boolean;
  suspendedAt: string | null;
  createdAt: string;
}

export interface DbWorkspace {
  id: string;
  name: string;
  slug: string;
  kind: WorkspaceKind;
  creditBalance: number;
  planCode: PlanCode;
  renewsAt: string | null;
}

export interface DbProject {
  id: string;
  workspaceId: string;
  entityType: EntityType;
  status: ProjectStatus;
  title: string;
  chosenNameId: string | null;
  brief: Brief | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DbName {
  id: string;
  projectId: string;
  jobId: string | null;
  value: string;
  acronym: string | null;
  meaning: string;
  style: NameStyle;
  pronunciation: string | null;
  score: number | null;
  isFavorite: boolean;
  isRejected: boolean;
  votes: Record<string, -1 | 1>;
  checks: AvailabilityCheck[];
  createdAt: string;
}

export interface DbLogo {
  id: string;
  projectId: string;
  jobId: string | null;
  type: LogoType;
  engine: LogoEngine;
  style: LogoStyle;
  isFavorite: boolean;
  isExclusive: boolean;
  createdAt: string;
}

export interface DbLogoVersion {
  id: string;
  logoId: string;
  number: number;
  label: string | null;
  spec: LogoSpec;
  createdAt: string;
}

export interface DbBrandKit {
  id: string;
  projectId: string;
  version: number;
  /** Nom figé à la création de la version (absent des kits simulés plus anciens). */
  name?: string | null;
  restoredFrom?: number | null;
  logoSpec: LogoSpec | null;
  slogan: string | null;
  shareToken: string | null;
  sharePassword: string | null;
  shareExpiresAt: string | null;
  guideReady: boolean;
  zipReady: boolean;
  createdAt: string;
}

export interface DbJob extends GenerationJob {
  workspaceId: string;
  input: Record<string, unknown>;
  durationMs: number;
  materialized: boolean;
  willFail: boolean;
}

export interface Db {
  version: 1;
  currentUserId: string | null;
  users: DbUser[];
  workspaces: DbWorkspace[];
  memberships: { userId: string; workspaceId: string; role: WorkspaceRole; joinedAt: string }[];
  invitations: { id: string; workspaceId: string; email: string; role: WorkspaceRole; token: string; expiresAt: string }[];
  projects: DbProject[];
  names: DbName[];
  logos: DbLogo[];
  logoVersions: DbLogoVersion[];
  slogans: Slogan[];
  signatures: Signature[];
  brandKits: DbBrandKit[];
  jobs: DbJob[];
  ledger: (LedgerEntry & { workspaceId: string; jobId?: string; paymentId?: string })[];
  payments: (Payment & { workspaceId: string; creditsGranted: number; resolveAt: number; willFail: boolean })[];
  invoices: (Invoice & { workspaceId: string; paymentId: string })[];
  notifications: (AppNotification & { userId: string })[];
  comments: (Comment & { projectId: string })[];
  activity: { id: string; projectId: string; actor: string; action: string; createdAt: string }[];
  audit: AuditEntry[];
  publicTries: { day: string; count: number };
  freeUsage: Record<string, { day: string; names: number; logos: number }>;
}

const STORAGE_KEY = "identite:mock-db:v1";

export const now = () => new Date().toISOString();

export function id(prefix = "") {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return prefix ? `${prefix}_${value}` : value;
}

function seed(): Db {
  const created = now();
  const demoBrief: Brief = {
    sector: "Environnement",
    mission: "Mobiliser les jeunes de Conakry pour reboiser les quartiers et sensibiliser à la gestion des déchets.",
    values: ["solidarité", "nature", "jeunesse"],
    audience: "Jeunes de 15 à 30 ans, partenaires locaux",
    languages: ["fr"],
    nameStyles: ["ACRONYM", "METAPHORICAL", "COMPOUND"],
    maxLength: 14,
    mustInclude: ["vert"],
    mustAvoid: [],
    tone: "engagé",
  };
  return {
    version: 1,
    currentUserId: null,
    users: [
      {
        id: "u_demo",
        email: "demo@exemple.gn",
        phone: "+224620000000",
        password: "demo1234",
        fullName: "Aïssatou Diallo",
        avatarUrl: null,
        locale: "fr",
        country: "GN",
        role: "USER",
        emailVerifiedAt: created,
        totpEnabled: false,
        suspendedAt: null,
        createdAt: created,
      },
      {
        id: "u_admin",
        email: "admin@exemple.gn",
        phone: null,
        password: "admin1234",
        fullName: "Mamadou Camara",
        avatarUrl: null,
        locale: "fr",
        country: "GN",
        role: "SUPER_ADMIN",
        emailVerifiedAt: created,
        totpEnabled: true,
        suspendedAt: null,
        createdAt: created,
      },
    ],
    workspaces: [
      { id: "w_demo", name: "Espace d'Aïssatou", slug: "aissatou", kind: "PERSONAL", creditBalance: 20, planCode: "FREE", renewsAt: null },
      { id: "w_admin", name: "Espace de Mamadou", slug: "mamadou", kind: "PERSONAL", creditBalance: 100, planCode: "PRO", renewsAt: null },
    ],
    memberships: [
      { userId: "u_demo", workspaceId: "w_demo", role: "OWNER", joinedAt: created },
      { userId: "u_admin", workspaceId: "w_admin", role: "OWNER", joinedAt: created },
    ],
    invitations: [],
    projects: [
      {
        id: "p_demo",
        workspaceId: "w_demo",
        entityType: "ASSOCIATION",
        status: "IN_PROGRESS",
        title: "Association de jeunes pour l'environnement",
        chosenNameId: null,
        brief: demoBrief,
        createdAt: created,
        updatedAt: created,
        deletedAt: null,
      },
    ],
    names: [],
    logos: [],
    logoVersions: [],
    slogans: [],
    signatures: [],
    brandKits: [],
    jobs: [],
    ledger: [
      { id: id("l"), workspaceId: "w_demo", delta: 20, reason: "PROMO", note: "Crédits de bienvenue", createdAt: created },
      { id: id("l"), workspaceId: "w_admin", delta: 100, reason: "SUBSCRIPTION_GRANT", note: "Offre Pro", createdAt: created },
    ],
    payments: [],
    invoices: [],
    notifications: [
      {
        id: id("n"),
        userId: "u_demo",
        type: "LOW_CREDITS",
        title: "Bienvenue !",
        body: "20 crédits de bienvenue ont été ajoutés à votre espace.",
        href: "/app/facturation",
        readAt: null,
        createdAt: created,
      },
    ],
    comments: [],
    activity: [],
    audit: [],
    publicTries: { day: "", count: 0 },
    freeUsage: {},
  };
}

let cache: Db | null = null;

export function db(): Db {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = seed());
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Db) : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

export function save() {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Stockage plein ou bloqué : la session continue en mémoire
  }
}

export function resetDb() {
  cache = seed();
  save();
}

/** Écrit dans le grand livre et met à jour le solde dans la même « transaction » (§12.1). */
export function writeLedger(workspaceId: string, delta: number, reason: LedgerReason, note: string | null, refs: { jobId?: string; paymentId?: string } = {}) {
  const data = db();
  const workspace = data.workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return;
  workspace.creditBalance += delta;
  data.ledger.unshift({ id: id("l"), workspaceId, delta, reason, note, createdAt: now(), ...refs });
}

export function logActivity(projectId: string, action: string) {
  const data = db();
  const actor = data.users.find((u) => u.id === data.currentUserId)?.fullName ?? "—";
  data.activity.unshift({ id: id("a"), projectId, actor, action, createdAt: now() });
}

export function notify(userId: string, notification: Omit<AppNotification, "id" | "readAt" | "createdAt">) {
  db().notifications.unshift({ ...notification, id: id("n"), userId, readAt: null, createdAt: now() });
}

export function audit(action: string, entityType: string, entityId: string) {
  const data = db();
  const actorName = data.users.find((u) => u.id === data.currentUserId)?.fullName ?? "système";
  data.audit.unshift({ id: id("au"), actorName, action, entityType, entityId, ip: "127.0.0.1", createdAt: now() });
}

export const JOB_DURATIONS: Record<JobKind, number> = {
  NAMES: 2200,
  LOGOS: 3200,
  LOGO_EXPORT: 1500,
  SLOGANS: 1800,
  SIGNATURE: 1200,
  BRAND_GUIDE: 2500,
  EXPORT_ZIP: 2500,
  DESIGN_EXPORT: 1500,
  STUDIO_IMAGES: 1800,
};
