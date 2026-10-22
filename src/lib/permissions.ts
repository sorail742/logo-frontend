import type { PlatformRole, WorkspaceRole } from "./types";

// Matrice des droits (§3), alignée sur les guards de l'API (docs/permissions.md du backend).
// Le front masque les actions interdites ; l'API fait foi.
export type Action =
  | "project.view"
  | "comment.create"
  | "comment.moderate"
  | "credits.view"
  | "project.create"
  | "generation.run"
  | "content.edit"
  | "export.download"
  | "members.manage"
  | "billing.manage"
  | "project.delete"
  | "trash.view"
  | "workspace.settings"
  | "workspace.delete"
  | "workspace.leave";

const ALL: WorkspaceRole[] = ["VIEWER", "EDITOR", "OWNER"];
const EDITORS: WorkspaceRole[] = ["EDITOR", "OWNER"];
const OWNERS: WorkspaceRole[] = ["OWNER"];

const WORKSPACE_MATRIX: Record<Action, WorkspaceRole[]> = {
  "project.view": ALL,
  "comment.create": ALL,
  // Résoudre ou rouvrir le fil d'un autre : éditeur et propriétaire (l'auteur, toujours).
  "comment.moderate": EDITORS,
  // Solde visible de tous : un éditeur consomme des crédits ; le grand livre reste au propriétaire.
  "credits.view": ALL,
  "project.create": EDITORS,
  "generation.run": EDITORS,
  "content.edit": EDITORS,
  // Lecteur : seulement si l'espace l'autorise (voir can()).
  "export.download": EDITORS,
  "members.manage": OWNERS,
  "billing.manage": OWNERS,
  "project.delete": OWNERS,
  "trash.view": OWNERS,
  "workspace.settings": OWNERS,
  "workspace.delete": OWNERS,
  // Tout membre peut partir ; l'espace garde au moins un propriétaire (vérifié par l'API).
  "workspace.leave": ALL,
};

export interface WorkspacePolicy {
  /** Les lecteurs peuvent télécharger fichiers et exports (réglage de l'espace). */
  viewerDownloads?: boolean;
}

export function can(action: Action, workspaceRole: WorkspaceRole | null | undefined, policy: WorkspacePolicy = {}): boolean {
  if (!workspaceRole) return false;
  if (action === "export.download" && workspaceRole === "VIEWER" && policy.viewerDownloads) return true;
  return WORKSPACE_MATRIX[action].includes(workspaceRole);
}

export type AdminSection = "dashboard" | "users" | "payments" | "moderation" | "library" | "ai" | "settings" | "audit";

const SUPPORT_UP: PlatformRole[] = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];
const ADMIN_UP: PlatformRole[] = ["ADMIN", "SUPER_ADMIN"];
const SUPER: PlatformRole[] = ["SUPER_ADMIN"];

const ADMIN_MATRIX: Record<AdminSection, PlatformRole[]> = {
  dashboard: SUPPORT_UP,
  users: SUPPORT_UP,
  payments: SUPPORT_UP,
  moderation: SUPPORT_UP,
  library: ADMIN_UP,
  // Offres, prix et clés d'API IA : super admin (§3).
  ai: SUPER,
  settings: SUPER,
  audit: SUPER,
};

export function canAccessAdmin(role: PlatformRole | null | undefined, section: AdminSection = "dashboard") {
  if (!role) return false;
  return ADMIN_MATRIX[section].includes(role);
}

/** Actions du back-office, mêmes seuils que l'API (RolesGuard). */
export type AdminAction =
  | "users.manage"
  | "roles.assign"
  | "credits.request"
  | "credits.adjust"
  | "payments.refund"
  | "moderation.review"
  | "terms.manage";

const ADMIN_ACTIONS: Record<AdminAction, PlatformRole[]> = {
  // Suspension et réinitialisation de la double authentification, sur un rang inférieur.
  "users.manage": ADMIN_UP,
  "roles.assign": SUPER,
  // Le support propose un ajustement de crédits ; un admin l'applique ou le valide.
  "credits.request": SUPPORT_UP,
  "credits.adjust": ADMIN_UP,
  "payments.refund": ADMIN_UP,
  "moderation.review": SUPPORT_UP,
  "terms.manage": ADMIN_UP,
};

export function canAdmin(action: AdminAction, role: PlatformRole | null | undefined) {
  return !!role && ADMIN_ACTIONS[action].includes(role);
}

const PLATFORM_RANK: Record<PlatformRole, number> = { USER: 0, SUPPORT: 1, ADMIN: 2, SUPER_ADMIN: 3 };

/** Un compte n'agit que sur un rang inférieur au sien ; le super admin agit sur tous. */
export function outranks(actor: PlatformRole | null | undefined, target: PlatformRole) {
  if (!actor) return false;
  return actor === "SUPER_ADMIN" || PLATFORM_RANK[actor] > PLATFORM_RANK[target];
}

export function isInternalRole(role: PlatformRole | null | undefined) {
  return role === "SUPPORT" || role === "ADMIN" || role === "SUPER_ADMIN";
}
