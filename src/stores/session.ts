"use client";

import { create } from "zustand";
import type { User } from "@/lib/types";

type Status = "loading" | "authenticated" | "anonymous";

const WORKSPACE_KEY = "identite:workspace";

function readWorkspace() {
  try {
    return localStorage.getItem(WORKSPACE_KEY);
  } catch {
    return null;
  }
}

interface SessionState {
  status: Status;
  user: User | null;
  workspaceId: string | null;
  setUser(user: User | null): void;
  setWorkspace(workspaceId: string): void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  user: null,
  workspaceId: null,
  setUser: (user) =>
    set({ user, status: user ? "authenticated" : "anonymous", workspaceId: user ? readWorkspace() : null }),
  setWorkspace: (workspaceId) => {
    try {
      localStorage.setItem(WORKSPACE_KEY, workspaceId);
    } catch {
      // Préférence non mémorisée
    }
    set({ workspaceId });
  },
}));
