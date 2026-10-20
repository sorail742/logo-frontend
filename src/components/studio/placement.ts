"use client";

import { contrastRatio } from "@/lib/render/color";
import type { StudioBrand } from "@/lib/studio/brand";
import { paintColor, readableFrom } from "@/lib/studio/color";
import { mapPage } from "@/lib/studio/doc";
import { fillFrame, isFrame } from "@/lib/studio/smart";
import type { DesignElement } from "@/lib/studio/types";
import type { PreparedImage } from "@/lib/studio/images";
import { createImage } from "@/lib/studio/doc";
import { useStudio } from "@/stores/studio";

// Ajouts depuis les panneaux : au centre de la page (ou à un point donné), sélectionnés.

/** Côté de référence de la page courante (les tailles par défaut s'y rapportent). */
export function pageUnit() {
  const doc = useStudio.getState().doc;
  return doc ? Math.min(doc.width, doc.height) : 1080;
}

export function centered<T extends DesignElement>(el: T, at?: { x: number; y: number }): T {
  const doc = useStudio.getState().doc!;
  const cx = at?.x ?? doc.width / 2;
  const cy = at?.y ?? doc.height / 2;
  return { ...el, x: cx - el.width / 2, y: cy - el.height / 2 };
}

/** Après un ajout depuis un panneau, le clavier revient à la création (Entrée, Suppr, flèches). */
export function releaseFocus() {
  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

export function addCentered(elements: DesignElement[], at?: { x: number; y: number }) {
  releaseFocus();
  const state = useStudio.getState();
  if (!state.doc || !elements.length) return;
  // Le groupe garde sa composition ; il est centré comme un tout.
  const minX = Math.min(...elements.map((el) => el.x));
  const minY = Math.min(...elements.map((el) => el.y));
  const maxX = Math.max(...elements.map((el) => el.x + el.width));
  const maxY = Math.max(...elements.map((el) => el.y + el.height));
  const cx = at?.x ?? state.doc.width / 2;
  const cy = at?.y ?? state.doc.height / 2;
  const dx = cx - (minX + maxX) / 2;
  const dy = cy - (minY + maxY) / 2;
  state.add(elements.map((el) => ({ ...el, x: el.x + dx, y: el.y + dy })));
}

/**
 * Place des photos : la première remplit le cadre visé (ou le cadre / la photo sélectionnés),
 * les suivantes sont posées au centre, à une taille raisonnable.
 */
export function placeImages(images: PreparedImage[], at?: { x: number; y: number }, frameId?: string | null) {
  releaseFocus();
  const state = useStudio.getState();
  const doc = state.doc;
  if (!doc || !images.length) return;
  const page = doc.pages[state.pageIndex]!;
  const targetId = frameId ?? (state.selection.length === 1 ? state.selection[0] : null);
  const target = targetId ? page.elements.find((el) => el.id === targetId) : undefined;
  let rest = images;
  if (target && (isFrame(target) || target.type === "image")) {
    const filled = fillFrame(target, images[0]!);
    state.change((d) => mapPage(d, state.pageIndex, (p) => ({ ...p, elements: p.elements.map((el) => (el.id === target.id ? filled : el)) })));
    state.select([filled.id]);
    rest = images.slice(1);
  }
  if (!rest.length) return;
  const max = Math.min(doc.width, doc.height) * 0.6;
  const added = rest.map((img, i) => {
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const el = createImage(img.src, img.naturalWidth, img.naturalHeight, { width: img.naturalWidth * scale, height: img.naturalHeight * scale });
    const offset = i * Math.min(doc.width, doc.height) * 0.04;
    return centered(el, at ? { x: at.x + offset, y: at.y + offset } : { x: doc.width / 2 + offset, y: doc.height / 2 + offset });
  });
  state.add(added);
}

/**
 * Couleurs par défaut des ajouts, lisibles sur le fond de la page courante : un accent de la
 * marque qui s'en détache, une encre pour le texte (4,5:1) et un second accent.
 */
export function useInkColors(brand: StudioBrand | null) {
  const background = useStudio((s) => s.doc?.pages[s.pageIndex]?.background);
  const bg = (background && paintColor(background)) ?? "#ffffff";
  const palette = brand ? [brand.colors.primary, brand.colors.secondary, brand.colors.text] : ["#0f766e", "#f59e0b", "#111827"];
  const accents = palette.filter((c) => contrastRatio(c, bg) >= 2.2);
  const accent = accents[0] ?? readableFrom(palette, bg, 3);
  const secondary = accents.find((c) => c !== accent) ?? accent;
  const ink = readableFrom(brand ? [brand.colors.text, brand.colors.primary, brand.colors.background] : ["#111827"], bg, 4.5);
  return { accent, secondary, ink, background: bg };
}
