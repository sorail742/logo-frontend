"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { can, type Action } from "@/lib/permissions";
import { qk } from "@/lib/query-keys";
import { useSessionStore } from "@/stores/session";

/** Espace de travail courant et droits de l'utilisateur dans cet espace. */
export function useWorkspace() {
  const status = useSessionStore((s) => s.status);
  const selectedId = useSessionStore((s) => s.workspaceId);
  const query = useQuery({ queryKey: qk.workspaces, queryFn: api.workspaces.list, enabled: status === "authenticated" });
  const workspaces = query.data ?? [];
  const workspace = workspaces.find((w) => w.id === selectedId) ?? workspaces[0] ?? null;
  return {
    ...query,
    workspaces,
    workspace,
    can: (action: Action) => can(action, workspace?.role, { viewerDownloads: workspace?.viewerDownloads }),
  };
}

export function useCredits() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: qk.credits(workspace?.id ?? "none"),
    queryFn: () => api.billing.credits(workspace!.id),
    enabled: Boolean(workspace),
  });
}
