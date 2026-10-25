import { describe, expect, it } from "vitest";
import { can, canAccessAdmin, isInternalRole } from "./permissions";
import type { PlatformRole, WorkspaceRole } from "./types";

describe("Permissions RBAC Matrix", () => {
  describe("can() - Workspace Actions", () => {
    it("autorise un VIEWER à lire le projet mais pas à éditer", () => {
      const role: WorkspaceRole = "VIEWER";
      expect(can("project.view", role)).toBe(true);
      expect(can("comment.create", role)).toBe(true);
      expect(can("project.create", role)).toBe(false);
      expect(can("content.edit", role)).toBe(false);
      expect(can("generation.run", role)).toBe(false);
      expect(can("project.delete", role)).toBe(false);
    });

    it("autorise un EDITOR à créer et modifier, mais pas à gérer les membres ou la facturation", () => {
      const role: WorkspaceRole = "EDITOR";
      expect(can("project.view", role)).toBe(true);
      expect(can("project.create", role)).toBe(true);
      expect(can("content.edit", role)).toBe(true);
      expect(can("generation.run", role)).toBe(true);
      expect(can("members.manage", role)).toBe(false);
      expect(can("billing.manage", role)).toBe(false);
      expect(can("project.delete", role)).toBe(false);
    });

    it("autorise un OWNER à toutes les actions de l'espace", () => {
      const role: WorkspaceRole = "OWNER";
      expect(can("project.view", role)).toBe(true);
      expect(can("project.create", role)).toBe(true);
      expect(can("content.edit", role)).toBe(true);
      expect(can("members.manage", role)).toBe(true);
      expect(can("billing.manage", role)).toBe(true);
      expect(can("project.delete", role)).toBe(true);
    });

    it("respecte la politique viewerDownloads pour le téléchargement par les lecteurs", () => {
      expect(can("export.download", "VIEWER", { viewerDownloads: false })).toBe(false);
      expect(can("export.download", "VIEWER", { viewerDownloads: true })).toBe(true);
      expect(can("export.download", "EDITOR", { viewerDownloads: false })).toBe(true);
    });

    it("renvoie false si aucun rôle n'est spécifié", () => {
      expect(can("project.view", null)).toBe(false);
      expect(can("project.view", undefined)).toBe(false);
    });
  });

  describe("canAccessAdmin() - Back-Office Sections", () => {
    it("interdit l'accès admin aux utilisateurs simples", () => {
      const role: PlatformRole = "USER";
      expect(canAccessAdmin(role, "dashboard")).toBe(false);
      expect(canAccessAdmin(role, "settings")).toBe(false);
      expect(isInternalRole(role)).toBe(false);
    });

    it("autorise le SUPPORT aux sections courantes mais pas aux settings sensibles ni à l'audit", () => {
      const role: PlatformRole = "SUPPORT";
      expect(canAccessAdmin(role, "dashboard")).toBe(true);
      expect(canAccessAdmin(role, "users")).toBe(true);
      expect(canAccessAdmin(role, "moderation")).toBe(true);
      expect(canAccessAdmin(role, "settings")).toBe(false);
      expect(canAccessAdmin(role, "audit")).toBe(false);
      expect(isInternalRole(role)).toBe(true);
    });

    it("autorise le SUPER_ADMIN à toutes les sections", () => {
      const role: PlatformRole = "SUPER_ADMIN";
      expect(canAccessAdmin(role, "dashboard")).toBe(true);
      expect(canAccessAdmin(role, "users")).toBe(true);
      expect(canAccessAdmin(role, "settings")).toBe(true);
      expect(canAccessAdmin(role, "audit")).toBe(true);
      expect(canAccessAdmin(role, "ai")).toBe(true);
      expect(isInternalRole(role)).toBe(true);
    });
  });
});
