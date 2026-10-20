"use client";

import { create } from "zustand";
import { cloneElement, clonePage, createPage, mapElements, mapPage } from "@/lib/studio/doc";
import type { Guide } from "@/lib/studio/geometry";
import type { DesignDoc, DesignElement, DesignPage } from "@/lib/studio/types";

// État de l'éditeur du Studio : document, page et sélection courantes, historique
// (annuler / rétablir), vue (zoom, déplacement) et presse-papiers.

/** "push" : nouvelle étape d'historique ; "none" : geste en cours ; { merge } : regroupe les retouches successives. */
export type HistoryMode = "push" | "none" | { merge: string };

const HISTORY_LIMIT = 100;
const MERGE_WINDOW_MS = 800;

export interface StudioMeta {
  id: string;
  projectId: string;
  name: string;
  format: string;
}

interface StudioState {
  meta: StudioMeta | null;
  doc: DesignDoc | null;
  pageIndex: number;
  selection: string[];
  editingId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  past: DesignDoc[];
  future: DesignDoc[];
  /** Incrémenté à chaque modification du document (sauvegarde automatique). */
  revision: number;
  guides: Guide[];
  clipboard: DesignElement[];

  load(meta: StudioMeta, doc: DesignDoc): void;
  rename(name: string): void;
  change(fn: (doc: DesignDoc) => DesignDoc, history?: HistoryMode): void;
  begin(): void;
  end(): void;
  undo(): void;
  redo(): void;
  setPage(index: number): void;
  select(ids: string[]): void;
  toggle(id: string): void;
  updateElements(ids: string[], fn: (el: DesignElement) => DesignElement, history?: HistoryMode): void;
  add(elements: DesignElement[]): void;
  removeSelected(): void;
  duplicateSelected(): void;
  copy(): void;
  paste(): void;
  arrange(direction: "forward" | "backward" | "front" | "back"): void;
  addPage(page?: DesignPage): void;
  duplicatePage(index: number): void;
  removePage(index: number): void;
  movePage(from: number, to: number): void;
  setView(view: Partial<Pick<StudioState, "zoom" | "panX" | "panY">>): void;
  setGuides(guides: Guide[]): void;
  setEditing(id: string | null): void;
}

let gestureBase: DesignDoc | null = null;
let lastMerge: { key: string; at: number } | null = null;

export const useStudio = create<StudioState>((set, get) => {
  /** Applique un nouveau document en tenant l'historique. */
  const commit = (next: DesignDoc, history: HistoryMode = "push") => {
    const { doc, past } = get();
    if (!doc || next === doc) return;
    if (history === "none") {
      set((s) => ({ doc: next, revision: s.revision + 1 }));
      return;
    }
    const now = Date.now();
    const merging = typeof history === "object" && lastMerge?.key === history.merge && now - lastMerge.at < MERGE_WINDOW_MS;
    lastMerge = typeof history === "object" ? { key: history.merge, at: now } : null;
    set((s) => ({
      doc: next,
      past: merging ? past : [...past, doc].slice(-HISTORY_LIMIT),
      future: [],
      revision: s.revision + 1,
    }));
  };

  /** Sélection restreinte aux éléments de la page courante. */
  const pageOf = () => {
    const { doc, pageIndex } = get();
    return doc?.pages[pageIndex] ?? null;
  };

  return {
    meta: null,
    doc: null,
    pageIndex: 0,
    selection: [],
    editingId: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    past: [],
    future: [],
    revision: 0,
    guides: [],
    clipboard: [],

    load: (meta, doc) => {
      gestureBase = null;
      lastMerge = null;
      set({ meta, doc, pageIndex: 0, selection: [], editingId: null, past: [], future: [], revision: 0, guides: [] });
    },
    rename: (name) => set((s) => (s.meta ? { meta: { ...s.meta, name }, revision: s.revision + 1 } : s)),
    change: (fn, history = "push") => {
      const { doc } = get();
      if (doc) commit(fn(doc), history);
    },
    begin: () => {
      gestureBase = get().doc;
    },
    end: () => {
      const { doc, past } = get();
      if (gestureBase && doc && gestureBase !== doc) {
        set({ past: [...past, gestureBase].slice(-HISTORY_LIMIT), future: [] });
      }
      gestureBase = null;
      lastMerge = null;
      set({ guides: [] });
    },
    undo: () => {
      const { doc, past, future } = get();
      const previous = past.at(-1);
      if (!doc || !previous) return;
      lastMerge = null;
      set((s) => ({
        doc: previous,
        past: past.slice(0, -1),
        future: [doc, ...future],
        revision: s.revision + 1,
        pageIndex: Math.min(s.pageIndex, previous.pages.length - 1),
        editingId: null,
      }));
    },
    redo: () => {
      const { doc, past, future } = get();
      const next = future[0];
      if (!doc || !next) return;
      lastMerge = null;
      set((s) => ({ doc: next, past: [...past, doc], future: future.slice(1), revision: s.revision + 1, pageIndex: Math.min(s.pageIndex, next.pages.length - 1) }));
    },
    setPage: (index) => set({ pageIndex: index, selection: [], editingId: null }),
    select: (ids) => set({ selection: ids, editingId: null }),
    toggle: (id) => set((s) => ({ selection: s.selection.includes(id) ? s.selection.filter((x) => x !== id) : [...s.selection, id] })),
    updateElements: (ids, fn, history = "push") => {
      const { doc, pageIndex } = get();
      if (!doc || !ids.length) return;
      commit(mapElements(doc, pageIndex, new Set(ids), fn), history);
    },
    add: (elements) => {
      const { doc, pageIndex } = get();
      if (!doc || !elements.length) return;
      commit(mapPage(doc, pageIndex, (page) => ({ ...page, elements: [...page.elements, ...elements] })));
      set({ selection: elements.map((el) => el.id), editingId: null });
    },
    removeSelected: () => {
      const { doc, pageIndex, selection } = get();
      if (!doc || !selection.length) return;
      const ids = new Set(selection);
      const page = pageOf();
      const removable = new Set(page?.elements.filter((el) => ids.has(el.id) && !el.locked).map((el) => el.id));
      if (!removable.size) return;
      commit(mapPage(doc, pageIndex, (p) => ({ ...p, elements: p.elements.filter((el) => !removable.has(el.id)) })));
      set({ selection: selection.filter((id) => !removable.has(id)), editingId: null });
    },
    duplicateSelected: () => {
      const page = pageOf();
      const ids = new Set(get().selection);
      const copies = page?.elements.filter((el) => ids.has(el.id)).map((el) => cloneElement(el, 24)) ?? [];
      get().add(copies);
    },
    copy: () => {
      const page = pageOf();
      const ids = new Set(get().selection);
      set({ clipboard: page?.elements.filter((el) => ids.has(el.id)).map((el) => structuredClone(el)) ?? [] });
    },
    paste: () => {
      const { clipboard } = get();
      if (!clipboard.length) return;
      const copies = clipboard.map((el) => cloneElement(el, 24));
      set({ clipboard: copies.map((el) => structuredClone(el)) });
      get().add(copies);
    },
    arrange: (direction) => {
      const { doc, pageIndex, selection } = get();
      if (!doc || !selection.length) return;
      const ids = new Set(selection);
      commit(
        mapPage(doc, pageIndex, (page) => {
          const els = [...page.elements];
          const picked = els.filter((el) => ids.has(el.id));
          const rest = els.filter((el) => !ids.has(el.id));
          if (direction === "front") return { ...page, elements: [...rest, ...picked] };
          if (direction === "back") return { ...page, elements: [...picked, ...rest] };
          // Un cran : chaque élément sélectionné passe devant (ou derrière) son voisin.
          const order = direction === "forward" ? [...els.keys()].reverse() : [...els.keys()];
          for (const i of order) {
            const j = direction === "forward" ? i + 1 : i - 1;
            if (j < 0 || j >= els.length) continue;
            if (ids.has(els[i]!.id) && !ids.has(els[j]!.id)) [els[i], els[j]] = [els[j]!, els[i]!];
          }
          return { ...page, elements: els };
        }),
      );
    },
    addPage: (page) => {
      const { doc } = get();
      if (!doc) return;
      const next = page ?? createPage(doc.pages[get().pageIndex]?.background);
      const index = get().pageIndex + 1;
      commit({ ...doc, pages: [...doc.pages.slice(0, index), next, ...doc.pages.slice(index)] });
      set({ pageIndex: index, selection: [] });
    },
    duplicatePage: (index) => {
      const { doc } = get();
      const page = doc?.pages[index];
      if (!doc || !page) return;
      commit({ ...doc, pages: [...doc.pages.slice(0, index + 1), clonePage(page), ...doc.pages.slice(index + 1)] });
      set({ pageIndex: index + 1, selection: [] });
    },
    removePage: (index) => {
      const { doc } = get();
      if (!doc || doc.pages.length <= 1) return;
      commit({ ...doc, pages: doc.pages.filter((_, i) => i !== index) });
      set((s) => ({ pageIndex: Math.min(s.pageIndex, doc.pages.length - 2), selection: [] }));
    },
    movePage: (from, to) => {
      const { doc } = get();
      if (!doc || to < 0 || to >= doc.pages.length) return;
      const pages = [...doc.pages];
      const [moved] = pages.splice(from, 1);
      pages.splice(to, 0, moved!);
      commit({ ...doc, pages });
      set({ pageIndex: to });
    },
    setView: (view) => set(view),
    setGuides: (guides) => set({ guides }),
    setEditing: (id) => set({ editingId: id, selection: id ? [id] : get().selection }),
  };
});

/** Page courante. */
export function useCurrentPage() {
  return useStudio((s) => s.doc?.pages[s.pageIndex] ?? null);
}

/** Éléments sélectionnés de la page courante, dans l'ordre d'empilement. */
export function selectedElements(state: Pick<StudioState, "doc" | "pageIndex" | "selection">) {
  const page = state.doc?.pages[state.pageIndex];
  if (!page) return [];
  const ids = new Set(state.selection);
  return page.elements.filter((el) => ids.has(el.id));
}
