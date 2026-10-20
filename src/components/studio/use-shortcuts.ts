"use client";

import { useEffect } from "react";
import { mapPage } from "@/lib/studio/doc";
import { useStudio } from "@/stores/studio";

// Raccourcis clavier de l'éditeur (ignorés pendant la saisie dans un champ).

function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function useStudioShortcuts(handlers: { onExport(): void; onHelp(): void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (typing(event.target) || document.querySelector("[role=dialog]")) return;
      const state = useStudio.getState();
      if (!state.doc) return;
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const page = state.doc.pages[state.pageIndex]!;
      const handled = () => event.preventDefault();
      const run = (fn: () => void) => {
        event.preventDefault();
        fn();
      };

      if (mod && key === "z") {
        handled();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (mod && key === "y") return run(() => state.redo());
      if (mod && key === "a") return run(() => state.select(page.elements.filter((el) => !el.locked && !el.hidden).map((el) => el.id)));
      if (mod && key === "d") return run(() => state.duplicateSelected());
      if (mod && key === "c" && state.selection.length) return run(() => state.copy());
      if (mod && key === "x" && state.selection.length) return run(() => {
        state.copy();
        state.removeSelected();
      });
      if (mod && key === "v" && state.clipboard.length) return run(() => state.paste());
      if (mod && key === "e") return run(() => handlers.onExport());
      if (mod && (key === "=" || key === "+")) return run(() => state.zoomAt(state.zoom * 1.25));
      if (mod && key === "-") return run(() => state.zoomAt(state.zoom / 1.25));
      if (mod && key === "0") return run(() => state.fit());
      if (mod && key === "1") return run(() => state.zoomAt(1));
      if (mod && key === "l" && state.selection.length) {
        handled();
        const locked = page.elements.filter((el) => state.selection.includes(el.id)).every((el) => el.locked);
        return state.updateElements(state.selection, (el) => ({ ...el, locked: !locked }));
      }
      if (mod && event.shiftKey && key === "h" && state.selection.length) {
        handled();
        return state.updateElements(state.selection, (el) => ({ ...el, hidden: !el.hidden }));
      }
      if (mod && (event.code === "BracketRight" || event.code === "BracketLeft")) {
        handled();
        const up = event.code === "BracketRight";
        return state.arrange(event.shiftKey ? (up ? "front" : "back") : up ? "forward" : "backward");
      }
      if (key === "?" || (event.shiftKey && event.code === "Slash")) return run(() => handlers.onHelp());
      if (key === "escape") {
        if (state.cropId) return state.setCrop(null);
        return state.select([]);
      }
      if ((key === "delete" || key === "backspace") && state.selection.length) return run(() => state.removeSelected());
      if (key === "enter" && state.selection.length === 1) {
        const el = page.elements.find((e) => e.id === state.selection[0]);
        if (el?.type === "text" && !el.locked) return run(() => state.setEditing(el.id));
        if (el?.type === "image" && !el.locked) return run(() => state.setCrop(state.cropId ? null : el.id));
      }
      if (key === "pagedown" || key === "pageup") {
        handled();
        const next = state.pageIndex + (key === "pagedown" ? 1 : -1);
        if (next >= 0 && next < state.doc.pages.length) state.setPage(next);
        return;
      }
      if (key.startsWith("arrow") && state.selection.length) {
        handled();
        const step = event.shiftKey ? 10 : 1;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        const ids = new Set(state.selection);
        state.change(
          (d) => mapPage(d, state.pageIndex, (p) => ({ ...p, elements: p.elements.map((el) => (ids.has(el.id) && !el.locked ? { ...el, x: el.x + dx, y: el.y + dy } : el)) })),
          { merge: "nudge" },
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}
