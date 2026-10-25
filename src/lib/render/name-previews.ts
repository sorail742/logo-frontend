import type { Brief, LogoSpec } from "@/lib/types";
import { hashSeed } from "./artwork";
import { STYLE_PALETTES } from "./color";
import { LOGO_FONTS, type LibraryFontDef } from "./fonts";
import { ICONS, searchIcons } from "./icons";
import { DEFAULT_SPEC } from "./logo";

const PALETTES = Object.values(STYLE_PALETTES).flat();

function pick<T>(items: readonly T[], seed: number, salt: number): T {
  return items[(seed + salt * 2654435761) % items.length]!;
}

function boldest(font: LibraryFontDef) {
  return font.weights.includes(700) ? 700 : font.weights[font.weights.length - 1]!;
}

/** Icônes évoquant le secteur et les valeurs du brief, à défaut toute la bibliothèque. */
function iconsFor(brief?: Pick<Brief, "sector" | "values"> | null) {
  const words = [brief?.sector ?? "", ...(brief?.values ?? [])]
    .join(" ")
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((word) => word.length >= 4);
  const found = [...new Set(words.flatMap((word) => searchIcons(word)))];
  return found.length >= 3 ? found : ICONS;
}

/**
 * Trois pistes de logo pour un nom proposé : symbole et nom, logotype seul, symbole au-dessus.
 * Déterministe (même nom, mêmes pistes) ; le symbole suit le secteur du brief.
 */
export function namePreviewSpecs(name: string, brief?: Pick<Brief, "sector" | "values"> | null): LogoSpec[] {
  const seed = hashSeed(name.toLowerCase());
  const icons = iconsFor(brief);
  const sans = LOGO_FONTS.filter((font) => font.category === "sans");
  const characterful = LOGO_FONTS.filter((font) => font.category !== "sans");
  const base = { ...DEFAULT_SPEC, text: name, tagline: "" };
  const fontA = pick(sans, seed, 1);
  const fontB = pick(characterful, seed, 2);
  const fontC = pick(LOGO_FONTS, seed, 3);
  return [
    {
      ...base,
      type: "ICON_TEXT",
      fontId: fontA.id,
      fontWeight: boldest(fontA),
      iconId: pick(icons, seed, 4).id,
      iconFrame: "circle",
      layout: "horizontal",
      colors: pick(PALETTES, seed, 5),
    },
    {
      ...base,
      type: "WORDMARK",
      fontId: fontB.id,
      fontWeight: boldest(fontB),
      uppercase: true,
      letterSpacing: 0.08,
      iconId: null,
      iconFrame: "none",
      layout: "text",
      colors: pick(PALETTES, seed, 6),
    },
    {
      ...base,
      type: "ICON_TEXT",
      fontId: fontC.id,
      fontWeight: boldest(fontC),
      iconId: pick(icons, seed, 7).id,
      iconFrame: "rounded",
      layout: "vertical",
      colors: pick(PALETTES, seed, 8),
    },
  ];
}
