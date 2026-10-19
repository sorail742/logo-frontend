"use client";

import { create } from "zustand";
import type { LogoSpec } from "@/lib/types";

const HISTORY_LIMIT = 50;

interface EditorState {
  logoId: string | null;
  present: LogoSpec | null;
  past: LogoSpec[];
  future: LogoSpec[];
  /** Spec de la dernière version enregistrée, pour détecter les modifications. */
  saved: LogoSpec | null;
  load(logoId: string, spec: LogoSpec): void;
  /** Modification ; `coalesce` fusionne les changements continus (curseurs, couleurs) en une seule étape. */
  update(patch: Partial<LogoSpec>, coalesce?: boolean): void;
  updateColors(patch: Partial<LogoSpec["colors"]>, coalesce?: boolean): void;
  undo(): void;
  redo(): void;
  markSaved(): void;
}

let lastCoalesceAt = 0;

export const useLogoEditor = create<EditorState>((set, get) => ({
  logoId: null,
  present: null,
  past: [],
  future: [],
  saved: null,
  load: (logoId, spec) => set({ logoId, present: spec, saved: spec, past: [], future: [] }),
  update: (patch, coalesce = false) => {
    const { present, past } = get();
    if (!present) return;
    const now = Date.now();
    const merge = coalesce && now - lastCoalesceAt < 600 && past.length > 0;
    lastCoalesceAt = coalesce ? now : 0;
    set({
      present: { ...present, ...patch },
      past: merge ? past : [...past, present].slice(-HISTORY_LIMIT),
      future: [],
    });
  },
  updateColors: (patch, coalesce) => {
    const { present } = get();
    if (present) get().update({ colors: { ...present.colors, ...patch } }, coalesce);
  },
  undo: () => {
    const { past, present, future } = get();
    if (!past.length || !present) return;
    set({ present: past[past.length - 1]!, past: past.slice(0, -1), future: [present, ...future] });
  },
  redo: () => {
    const { past, present, future } = get();
    if (!future.length || !present) return;
    set({ present: future[0]!, past: [...past, present], future: future.slice(1) });
  },
  markSaved: () => set({ saved: get().present }),
}));
