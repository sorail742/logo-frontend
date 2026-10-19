"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { can, type Action } from "@/lib/permissions";
import { useWorkspace } from "./use-workspace";

export function useProjectId() {
  const params = useParams<{ pid: string }>();
  return params.pid;
}

/** Projet courant (segment [pid]) et droits associés. */
export function useProject() {
  const pid = useProjectId();
  const { workspaces } = useWorkspace();
  const query = useQuery({ queryKey: qk.project(pid), queryFn: () => api.projects.get(pid), enabled: Boolean(pid) });
  const role = workspaces.find((w) => w.id === query.data?.workspaceId)?.role;
  return { ...query, pid, project: query.data, role, can: (action: Action) => can(action, role) };
}
