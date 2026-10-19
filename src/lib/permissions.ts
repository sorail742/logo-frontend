import type { PlatformRole, WorkspaceRole } from "./types";

// Matrice des droits (§3). Le front masque les actions interdites ; l'API (guards NestJS) fait foi.
export type Action =
  | "project.view"
  | "comment.create"
  | "project.create"
  | "generation.run"
  | "content.edit"
  | "export.download"
  | "members.manage"
  | "billing.manage"
  | "project.delete";

const WORKSPACE_MATRIX: Record<Action, WorkspaceRole[]> = {
  "project.view": ["VIEWER", "EDITOR", "OWNER"],
  "comment.create": ["VIEWER", "EDITOR", "OWNER"],
  "project.create": ["EDITOR", "OWNER"],
  "generation.run": ["EDITOR", "OWNER"],
  "content.edit": ["EDITOR", "OWNER"],
  "export.download": ["EDITOR", "OWNER"],
  "members.manage": ["OWNER"],
  "billing.manage": ["OWNER"],
  "project.delete": ["OWNER"],
};

export function can(action: Action, workspaceRole: WorkspaceRole | null | undefined): boolean {
  if (!workspaceRole) return false;
  return WORKSPACE_MATRIX[action].includes(workspaceRole);
}

export type AdminSection =
  | "dashboard"
  | "users"
  | "payments"
  | "moderation"
  | "library"
  | "ai"
  | "settings"
  | "audit";

const ADMIN_MATRIX: Record<AdminSection, PlatformRole[]> = {
  dashboard: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  users: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  payments: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  moderation: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  library: ["ADMIN", "SUPER_ADMIN"],
  ai: ["ADMIN", "SUPER_ADMIN"],
  settings: ["SUPER_ADMIN"],
  audit: ["SUPER_ADMIN"],
};

export function canAccessAdmin(role: PlatformRole | null | undefined, section: AdminSection = "dashboard") {
  if (!role) return false;
  return ADMIN_MATRIX[section].includes(role);
}

export function isInternalRole(role: PlatformRole | null | undefined) {
  return role === "SUPPORT" || role === "ADMIN" || role === "SUPER_ADMIN";
}
