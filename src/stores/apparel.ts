"use client";

import { create } from "zustand";
import { newElementId } from "@/lib/apparel/elements";
import type { EditorElement } from "@/lib/apparel/render";
import type { ApparelDesign, GarmentView } from "@/lib/apparel/types";

// État de l'éditeur textile : tenue (réglages et éléments), vue et sélection courantes,
// historique (annuler / rétablir) des éléments.

/** "push" : nouvelle étape d'historique ; "none" : geste en cours ; { merge } : regroupe les retouches successives. */
export type HistoryMode = "push" | "none" | { merge: string };

const HISTORY_LIMIT = 100;
const MERGE_WINDOW_MS = 800;

export type ApparelMeta = Omit<ApparelDesign, "elements">;

interface ApparelState {
  design: ApparelMeta | null;
  elements: EditorElement[];
  view: GarmentView;
  selection: string | null;
  /** Zone visée par les ajouts. */
  targetZone: string | null;
  past: EditorElement[][];
  future: EditorElement[][];
  /** Incrémenté à chaque modification des éléments (sauvegarde automatique). */
  revision: number;
  /** Taille affichée (aperçu) ; null = taille de référence, seule modifiable. */
  previewSize: string | null;
  showZones: boolean;
  /** Photo ouverte dans l'atelier de retouche, sur l'onglet demandé. */
  photoEditing: { id: string; tab: string } | null;

  load(design: ApparelDesign, view: GarmentView): void;
  setDesign(design: Partial<ApparelMeta>): void;
  change(fn: (elements: EditorElement[]) => EditorElement[], history?: HistoryMode): void;
  begin(): void;
  update(
    id: string,
    patch: Partial<EditorElement> | ((el: EditorElement) => EditorElement),
    history?: HistoryMode,
  ): void;
  add(element: EditorElement): void;
  remove(id: string): void;
  duplicate(id: string): void;
  arrange(id: string, direction: "forward" | "backward"): void;
  undo(): void;
  redo(): void;
  select(id: string | null): void;
  setView(view: GarmentView): void;
  setTargetZone(key: string | null): void;
  setPreviewSize(label: string | null): void;
  toggleZones(): void;
  editPhoto(editing: { id: string; tab: string } | null): void;
}

let lastMerge: { key: string; at: number } | null = null;
/** Éléments au début d'un geste (déplacement, redimensionnement). */
let gestureStart: EditorElement[] | null = null;

/** Ordre d'empilement explicite : celui de la liste. */
const reindex = (elements: EditorElement[]) =>
  elements.map((el, i) => (el.zIndex === i ? el : { ...el, zIndex: i }));

export const useApparel = create<ApparelState>((set, get) => ({
  design: null,
  elements: [],
  view: "FRONT",
  selection: null,
  targetZone: null,
  past: [],
  future: [],
  revision: 0,
  previewSize: null,
  showZones: true,
  photoEditing: null,

  load(design, view) {
    const { elements, ...meta } = design;
    const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    set({
      design: meta,
      // Champs de l'éditeur seulement (l'API renvoie aussi designId, createdAt…).
      elements: reindex(
        sorted.map((el) => ({
          id: el.id ?? newElementId(),
          zoneKey: el.zoneKey,
          kind: el.kind,
          content: el.content,
          widthMm: el.widthMm,
          heightMm: el.heightMm,
          offsetXMm: el.offsetXMm,
          offsetYMm: el.offsetYMm,
          rotationDeg: el.rotationDeg ?? 0,
          zIndex: el.zIndex,
        })),
      ),
      view,
      selection: null,
      targetZone: null,
      past: [],
      future: [],
      revision: 0,
      previewSize: null,
    });
    lastMerge = null;
    gestureStart = null;
  },

  setDesign(patch) {
    const design = get().design;
    if (design) set({ design: { ...design, ...patch } });
  },

  change(fn, history = "push") {
    const { elements, past } = get();
    const next = reindex(fn(elements));
    if (history === "none") {
      set({ elements: next, revision: get().revision + 1 });
      return;
    }
    const now = Date.now();
    const merging =
      typeof history === "object" && lastMerge?.key === history.merge && now - lastMerge.at < MERGE_WINDOW_MS;
    lastMerge = typeof history === "object" ? { key: history.merge, at: now } : null;
    const base = gestureStart ?? elements;
    gestureStart = null;
    set({
      elements: next,
      past: merging ? past : [...past, base].slice(-HISTORY_LIMIT),
      future: [],
      revision: get().revision + 1,
    });
  },

  begin() {
    gestureStart = get().elements;
  },

  update(id, patch, history = "push") {
    const apply = typeof patch === "function" ? patch : (el: EditorElement) => ({ ...el, ...patch });
    get().change((elements) => elements.map((el) => (el.id === id ? apply(el) : el)), history);
  },

  add(element) {
    get().change((elements) => [...elements, element]);
    set({ selection: element.id });
  },

  remove(id) {
    get().change((elements) => elements.filter((el) => el.id !== id));
    if (get().selection === id) set({ selection: null });
  },

  duplicate(id) {
    const source = get().elements.find((el) => el.id === id);
    if (!source) return;
    const copy: EditorElement = {
      ...structuredClone(source),
      id: newElementId(),
      offsetXMm: source.offsetXMm + 5,
      offsetYMm: source.offsetYMm + 5,
    };
    get().add(copy);
  },

  arrange(id, direction) {
    get().change((elements) => {
      const index = elements.findIndex((el) => el.id === id);
      const target = direction === "forward" ? index + 1 : index - 1;
      if (index < 0 || target < 0 || target >= elements.length) return elements;
      const next = [...elements];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  },

  undo() {
    const { past, elements, future, selection } = get();
    const previous = past.at(-1);
    if (!previous) return;
    lastMerge = null;
    set({
      elements: previous,
      past: past.slice(0, -1),
      future: [elements, ...future],
      revision: get().revision + 1,
      selection: previous.some((el) => el.id === selection) ? selection : null,
    });
  },

  redo() {
    const { past, elements, future, selection } = get();
    const next = future[0];
    if (!next) return;
    lastMerge = null;
    set({
      elements: next,
      past: [...past, elements],
      future: future.slice(1),
      revision: get().revision + 1,
      selection: next.some((el) => el.id === selection) ? selection : null,
    });
  },

  select(id) {
    set({ selection: id });
  },

  setView(view) {
    set({ view, selection: null, targetZone: null });
  },

  setTargetZone(key) {
    set({ targetZone: key });
  },

  setPreviewSize(label) {
    set({ previewSize: label, selection: null });
  },

  toggleZones() {
    set({ showZones: !get().showZones });
  },

  editPhoto(editing) {
    set({ photoEditing: editing });
  },
}));
