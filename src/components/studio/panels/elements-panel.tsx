"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { contrastRatio } from "@/lib/render/color";
import { ICONS, type IconNode } from "@/lib/render/icons";
import { createIcon, createShape, solid } from "@/lib/studio/doc";
import { renderElement } from "@/lib/studio/render";
import type { ShapeElement } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { useStudioContext } from "../context";
import { addCentered, centered, pageUnit, releaseFocus, useInkColors } from "../placement";

// Formes, cadres photo et icônes (bibliothèque lucide complète, recherche en français et en anglais).

type ShapePreset = { id: string; shape: ShapeElement["shape"]; patch?: Partial<ShapeElement>; ratio?: number };

const SHAPES: ShapePreset[] = [
  { id: "rect", shape: "rect" },
  { id: "rounded", shape: "rect", patch: { radius: 0.18 } },
  { id: "ellipse", shape: "ellipse" },
  { id: "triangle", shape: "triangle" },
  { id: "hexagon", shape: "polygon", patch: { sides: 6 } },
  { id: "star", shape: "star", patch: { sides: 5, innerRatio: 0.45 } },
  { id: "burst", shape: "star", patch: { sides: 14, innerRatio: 0.78 } },
  { id: "blob", shape: "blob" },
  { id: "arch", shape: "arch", ratio: 0.75 },
  { id: "ring", shape: "ellipse", patch: { fill: { type: "none" } } },
  { id: "line", shape: "line", ratio: 10 },
  { id: "arrow", shape: "arrow", ratio: 5 },
];

const FRAMES: ShapePreset[] = [
  { id: "frameCircle", shape: "ellipse" },
  { id: "frameArch", shape: "arch", ratio: 0.75 },
  { id: "frameRounded", shape: "rect", patch: { radius: 0.12 }, ratio: 0.8 },
  { id: "frameBlob", shape: "blob" },
];

/** Mots français courants → noms d'icônes lucide (anglais). */
const FRENCH: Record<string, string> = {
  maison: "house home",
  accueil: "house home",
  téléphone: "phone",
  telephone: "phone",
  courriel: "mail",
  email: "mail",
  lettre: "mail letter",
  calendrier: "calendar",
  date: "calendar",
  heure: "clock",
  horloge: "clock",
  lieu: "map-pin",
  adresse: "map-pin",
  carte: "map",
  voiture: "car",
  camion: "truck",
  avion: "plane",
  bateau: "ship",
  vélo: "bike",
  école: "school graduation",
  livre: "book",
  santé: "heart-pulse stethoscope hospital",
  hôpital: "hospital",
  argent: "banknote coins wallet",
  banque: "landmark",
  panier: "shopping-cart shopping-basket",
  boutique: "store shopping-bag",
  magasin: "store",
  cadeau: "gift",
  étoile: "star",
  coeur: "heart",
  cœur: "heart",
  personne: "user",
  personnes: "users",
  équipe: "users",
  musique: "music",
  photo: "camera image",
  image: "image",
  vidéo: "video",
  soleil: "sun",
  lune: "moon",
  pluie: "cloud-rain",
  arbre: "tree",
  feuille: "leaf",
  fleur: "flower",
  eau: "droplet waves",
  feu: "flame",
  nourriture: "utensils",
  repas: "utensils",
  café: "coffee",
  boisson: "cup-soda wine beer",
  sport: "trophy dumbbell",
  football: "volleyball trophy",
  outil: "wrench hammer",
  travaux: "hammer construction",
  sécurité: "shield lock",
  cadenas: "lock",
  clé: "key",
  recherche: "search",
  flèche: "arrow",
  validé: "check",
  coche: "check",
  croix: "x",
  alerte: "triangle-alert",
  info: "info",
  question: "circle-help",
  message: "message",
  discussion: "messages-square",
  partage: "share",
  lien: "link",
  téléchargement: "download",
  ordinateur: "laptop monitor",
  mobile: "smartphone",
  wifi: "wifi",
  graphique: "chart",
  croissance: "trending-up",
  idée: "lightbulb",
  fusée: "rocket",
  globe: "globe earth",
  monde: "globe earth",
  drapeau: "flag",
  église: "church",
  mosquée: "landmark",
  justice: "scale gavel",
  agriculture: "tractor wheat sprout",
  bébé: "baby",
  enfant: "baby",
  chien: "dog",
  chat: "cat",
  poisson: "fish",
};

function IconGlyph({ node, size = 22 }: { node: IconNode; size?: number }) {
  const html = node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("");
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function shapeElement(preset: ShapePreset, color: string, role?: "photo") {
  const unit = pageUnit();
  const base = unit * 0.32;
  const ratio = preset.ratio ?? 1;
  const width = ratio >= 1 ? base * Math.min(ratio, 2.2) : base;
  const height = ratio >= 1 ? (preset.shape === "line" || preset.shape === "arrow" ? Math.max(12, unit * 0.03) : base / ratio) : base / ratio;
  const patch = { ...preset.patch };
  if (patch.radius !== undefined) patch.radius = patch.radius * Math.min(width, height);
  const stroke = preset.id === "ring" ? { color, width: unit * 0.012, dash: "solid" as const } : preset.shape === "line" || preset.shape === "arrow" ? { color, width: Math.max(3, unit * 0.008), dash: "solid" as const } : null;
  return createShape(preset.shape, { width, height, fill: solid(color), ...patch, stroke, role });
}

function ShapePreview({ preset, color, frame }: { preset: ShapePreset; color: string; frame?: boolean }) {
  const svg = useMemo(() => {
    const el = { ...shapeElement(preset, color, frame ? "photo" : undefined), seed: 7 };
    const scale = 40 / Math.max(el.width, el.height);
    const scaled = { ...el, x: 0, y: 0, width: el.width * scale, height: el.height * scale, radius: el.radius ? el.radius * scale : el.radius, stroke: el.stroke ? { ...el.stroke, width: Math.max(1.5, el.stroke.width * scale) } : null };
    const markup = renderElement({ ...scaled, x: (48 - scaled.width) / 2, y: (48 - scaled.height) / 2 });
    return `<svg viewBox="0 0 48 48" width="48" height="48">${markup}</svg>`;
  }, [preset, color, frame]);
  return <span className="block" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function ElementsPanel() {
  const t = useTranslations("studio.elements");
  const { brand, icons } = useStudioContext();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(96);
  const { accent: color, background } = useInkColors(brand);
  const frameColor = contrastRatio("#cbd5e1", background) >= 1.4 ? "#cbd5e1" : "#94a3b8";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const curated = ICONS.map((icon) => ({ id: icon.id, node: icon.node, tags: icon.tags }));
    if (!icons) return q ? curated.filter((i) => i.id.includes(q) || i.tags.some((tag) => tag.includes(q))) : curated;
    if (!q) return [...curated, ...Object.entries(icons).filter(([id]) => !ICONS.some((i) => i.id === id)).map(([id, node]) => ({ id, node, tags: [] as string[] }))];
    const words = [q, ...(FRENCH[q]?.split(" ") ?? []), ...Object.entries(FRENCH).filter(([fr]) => fr.startsWith(q) && q.length >= 3).flatMap(([, en]) => en.split(" "))];
    const tagged = new Set(ICONS.filter((i) => i.tags.some((tag) => tag.includes(q))).map((i) => i.id));
    return Object.entries(icons)
      .filter(([id]) => tagged.has(id) || words.some((w) => id.includes(w)))
      .sort(([a], [b]) => Number(b.startsWith(q)) - Number(a.startsWith(q)) || a.length - b.length)
      .map(([id, node]) => ({ id, node, tags: [] as string[] }));
  }, [icons, query]);

  const addIcon = (id: string, node: IconNode) => {
    releaseFocus();
    const state = useStudio.getState();
    const page = state.doc!.pages[state.pageIndex]!;
    const selected = page.elements.filter((el) => state.selection.includes(el.id));
    // Une icône sélectionnée est remplacée (même place, même couleur).
    if (selected.length === 1 && selected[0]!.type === "icon") {
      state.updateElements([selected[0]!.id], (el) => (el.type === "icon" ? { ...el, iconId: id, node } : el));
      return;
    }
    const size = pageUnit() * 0.18;
    state.add([centered(createIcon(id, node, { width: size, height: size, color, strokeWidth: 2 }))]);
  };

  return (
    <div className="grid gap-4">
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold">{t("shapes")}</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((preset) => (
            <button key={preset.id} type="button" onClick={() => addCentered([shapeElement(preset, color)])} className="flex aspect-square items-center justify-center rounded-lg border bg-background transition hover:border-primary hover:bg-muted" title={t(`shape.${preset.id}`)} aria-label={t(`shape.${preset.id}`)}>
              <ShapePreview preset={preset} color={color} />
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold">{t("frames")}</h3>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t("framesHelp")}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {FRAMES.map((preset) => (
            <button key={preset.id} type="button" onClick={() => addCentered([shapeElement(preset, frameColor, "photo")])} className="flex aspect-square items-center justify-center rounded-lg border bg-background transition hover:border-primary hover:bg-muted" title={t(`shape.${preset.id}`)} aria-label={t(`shape.${preset.id}`)}>
              <ShapePreview preset={preset} color={frameColor} frame />
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs font-semibold">{t("icons")}</h3>
          <span className="text-[11px] text-muted-foreground">{t("iconCount", { count: icons ? Object.keys(icons).length : ICONS.length })}</span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(96);
            }}
            placeholder={t("searchIcons")}
            className="h-8 pl-8 text-xs"
            aria-label={t("searchIcons")}
          />
        </div>
        {results.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t("noIcon")}</p>
        ) : (
          <div className="grid grid-cols-6 gap-1">
            {results.slice(0, limit).map((icon) => (
              <button
                key={icon.id}
                type="button"
                onClick={() => addIcon(icon.id, icon.node)}
                className="flex aspect-square items-center justify-center rounded-md text-foreground/80 transition hover:bg-muted hover:text-foreground"
                title={icon.id}
                aria-label={icon.id}
              >
                <IconGlyph node={icon.node} />
              </button>
            ))}
          </div>
        )}
        {results.length > limit && (
          <button type="button" onClick={() => setLimit(limit + 120)} className="rounded-md py-1.5 text-xs text-primary hover:bg-muted">
            {t("more", { count: results.length - limit })}
          </button>
        )}
      </section>
    </div>
  );
}
