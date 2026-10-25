import { readableOn } from "@/lib/render/color";
import { closestWeight, getFont } from "@/lib/render/fonts";
import { getIcon, searchIcons } from "@/lib/render/icons";
import { SITE_SOCIALS, type SiteContent, type SiteSocial } from "@/lib/render/site";
import type { LogoSpec } from "@/lib/types";

// Valeurs de départ du site tirées du logo et de la signature e-mail (mêmes règles que l'API,
// src/modules/websites/websites.service.ts) : la simulation et le bouton « Reprendre le logo ».

/** Couleurs et polices du logo ; un fond de logo foncé laisse place à un fond de page blanc. */
export function brandStyle(spec: LogoSpec): Pick<SiteContent, "colors" | "fonts"> {
  const darkBackground = readableOn(spec.colors.background) === "#ffffff";
  const heading = { id: spec.fontId, weight: closestWeight(spec.fontId, spec.fontWeight) };
  const body = getFont(spec.fontId).category === "sans" ? { id: spec.fontId, weight: closestWeight(spec.fontId, 400) } : { id: "inter", weight: 400 };
  return {
    colors: {
      primary: spec.colors.primary,
      secondary: spec.colors.secondary,
      text: darkBackground ? "#111827" : spec.colors.text,
      background: darkBackground ? "#ffffff" : spec.colors.background,
    },
    fonts: { heading, body },
  };
}

const NETWORKS: Record<string, SiteSocial> = { twitter: "x" };

/** Réseaux de la signature e-mail reconnus par le site (Twitter devient X). */
export function socialsOf(list: { network: string; url: string }[]) {
  const social: Partial<Record<SiteSocial, string>> = {};
  for (const { network, url } of list) {
    const key = network.trim().toLowerCase();
    const id = NETWORKS[key] ?? key;
    if (url.trim() && (SITE_SOCIALS as readonly string[]).includes(id)) social[id as SiteSocial] = url.trim().slice(0, 300);
  }
  return social;
}

/** Icônes des services : celles du secteur (mot à mot), complétées par des icônes neutres. */
export function sectorIcons(sector: string) {
  const words = sector.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4);
  const found = words.flatMap((w) => searchIcons(w).map((icon) => icon.id));
  return [...new Set([...found, "star", "sparkles", "heart"])].filter((id) => !!getIcon(id)).slice(0, 3);
}
