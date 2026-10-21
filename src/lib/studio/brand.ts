import { getFont } from "@/lib/render/fonts";
import { DEFAULT_SPEC } from "@/lib/render/logo";
import { getIcon, type IconNode } from "@/lib/render/icons";
import type { LogoColors, LogoSpec } from "@/lib/types";

// Identité du projet telle que le Studio l'utilise : nom, slogan, couleurs, polices et logos.
// Les modèles, les variations et le contrôle des couleurs hors marque partent de là.

export interface FontChoice {
  fontId: string;
  fontWeight: number;
}

/** Déclinaisons du logo (SVG prêts à poser). */
export interface BrandLogos {
  color?: string;
  white?: string;
  black?: string;
  icon?: string;
  horizontal?: string;
  vertical?: string;
}

export interface StudioBrand {
  name: string;
  slogan: string | null;
  sector: string | null;
  colors: LogoColors;
  /** Couleurs distinctes de la marque (primaire, secondaire, texte, fond). */
  palette: string[];
  heading: FontChoice;
  body: FontChoice;
  logos: BrandLogos;
  icon: { id: string; node: IconNode } | null;
}

/** Associations de polices éprouvées : titre, texte courant. */
export const FONT_PAIRINGS: [heading: FontChoice, body: FontChoice][] = [
  [{ fontId: "anton", fontWeight: 400 }, { fontId: "inter", fontWeight: 400 }],
  [{ fontId: "playfair", fontWeight: 700 }, { fontId: "dm-sans", fontWeight: 400 }],
  [{ fontId: "montserrat", fontWeight: 800 }, { fontId: "merriweather", fontWeight: 400 }],
  [{ fontId: "bebas-neue", fontWeight: 400 }, { fontId: "montserrat", fontWeight: 400 }],
  [{ fontId: "dm-serif-display", fontWeight: 400 }, { fontId: "inter", fontWeight: 400 }],
  [{ fontId: "fraunces", fontWeight: 700 }, { fontId: "work-sans", fontWeight: 400 }],
  [{ fontId: "syne", fontWeight: 800 }, { fontId: "manrope", fontWeight: 400 }],
  [{ fontId: "unbounded", fontWeight: 700 }, { fontId: "outfit", fontWeight: 400 }],
  [{ fontId: "abril-fatface", fontWeight: 400 }, { fontId: "poppins", fontWeight: 400 }],
  [{ fontId: "cormorant-garamond", fontWeight: 700 }, { fontId: "montserrat", fontWeight: 400 }],
  [{ fontId: "archivo-black", fontWeight: 400 }, { fontId: "archivo", fontWeight: 400 }],
  [{ fontId: "bricolage-grotesque", fontWeight: 800 }, { fontId: "dm-sans", fontWeight: 400 }],
  [{ fontId: "oswald", fontWeight: 700 }, { fontId: "lora", fontWeight: 400 }],
  [{ fontId: "righteous", fontWeight: 400 }, { fontId: "nunito", fontWeight: 400 }],
  [{ fontId: "alfa-slab-one", fontWeight: 400 }, { fontId: "rubik", fontWeight: 400 }],
  [{ fontId: "space-grotesk", fontWeight: 700 }, { fontId: "space-grotesk", fontWeight: 400 }],
];

/** Police de texte courant assortie à une police de titre. */
export function pairedBody(heading: FontChoice): FontChoice {
  const pair = FONT_PAIRINGS.find(([h]) => h.fontId === heading.fontId);
  if (pair) return pair[1];
  const category = getFont(heading.fontId).category;
  if (category === "serif") return { fontId: "dm-sans", fontWeight: 400 };
  if (category === "sans") return { fontId: heading.fontId, fontWeight: 400 };
  return { fontId: "inter", fontWeight: 400 };
}

export interface BrandSource {
  name: string;
  slogan?: string | null;
  sector?: string | null;
  spec?: LogoSpec | null;
  logos?: BrandLogos;
}

export function buildBrand(source: BrandSource): StudioBrand {
  const spec = source.spec ?? null;
  const colors = spec?.colors ?? DEFAULT_SPEC.colors;
  const font = getFont(spec?.fontId ?? DEFAULT_SPEC.fontId);
  // Une police manuscrite reste un accent : les titres prennent une police lisible.
  const heading: FontChoice =
    font.category === "script" ? { fontId: "playfair", fontWeight: 700 } : { fontId: font.id, fontWeight: Math.max(spec?.fontWeight ?? 700, 600) };
  const iconId = spec?.iconId ?? null;
  const icon = iconId ? getIcon(iconId) : undefined;
  return {
    name: source.name,
    slogan: source.slogan || spec?.tagline || null,
    sector: source.sector ?? null,
    colors,
    palette: [...new Set([colors.primary, colors.secondary, colors.text, colors.background].map((c) => c.toLowerCase()))],
    heading,
    body: pairedBody(heading),
    logos: source.logos ?? {},
    icon: icon ? { id: icon.id, node: icon.node } : null,
  };
}
