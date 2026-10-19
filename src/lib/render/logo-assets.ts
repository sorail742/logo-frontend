"use client";

import type { LogoSpec } from "@/lib/types";
import { readableOn } from "./color";
import { APP_ICON_SIZES, buildIco, svgToPngBlob } from "./export";
import { getFont } from "./fonts";
import { getIcon } from "./icons";
import { renderLogoSvg } from "./logo";
import type { ZipEntry } from "./zip";

export const SOCIAL_FORMATS = [
  { id: "profile", width: 400, height: 400 },
  { id: "facebook", width: 820, height: 312 },
  { id: "linkedin", width: 1584, height: 396 },
] as const;

export type SocialFormatId = (typeof SOCIAL_FORMATS)[number]["id"];

function iconSpec(spec: LogoSpec): LogoSpec {
  return { ...spec, iconFrame: spec.iconFrame === "none" ? "circle" : spec.iconFrame };
}

/** Logo centré sur un fond aux couleurs de la marque (LOGO-23). */
export function socialSvg(spec: LogoSpec, id: SocialFormatId) {
  const format = SOCIAL_FORMATS.find((f) => f.id === id)!;
  const isProfile = id === "profile";
  const background = isProfile ? spec.colors.background : spec.colors.primary;
  const variant = !isProfile && readableOn(background) === "#ffffff" ? "white" : "color";
  const logo = isProfile
    ? renderLogoSvg(iconSpec(spec), { layout: "icon" })
    : renderLogoSvg(spec, { variant, withBackground: false, layout: spec.layout === "vertical" ? "horizontal" : undefined });
  const maxW = format.width * (isProfile ? 0.86 : 0.6);
  const maxH = format.height * (isProfile ? 0.86 : 0.6);
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  const inner = logo.svg.replace("<svg ", `<svg x="${(format.width - w) / 2}" y="${(format.height - h) / 2}" `).replace(/ width="[\d.]+" height="[\d.]+"/, ` width="${w}" height="${h}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${format.width} ${format.height}" width="${format.width}" height="${format.height}"><rect width="100%" height="100%" fill="${background}"/>${inner}</svg>`;
}

/** Pack d'icônes d'application (LOGO-22). */
export async function iconPackEntries(spec: LogoSpec, prefix = "icones-app/"): Promise<ZipEntry[]> {
  const svg = renderLogoSvg(iconSpec(spec), { layout: "icon" }).svg;
  const entries: ZipEntry[] = [{ path: `${prefix}favicon.ico`, data: await buildIco(svg) }];
  for (const { id, size } of APP_ICON_SIZES) {
    // iOS refuse la transparence : fond plein pour l'icône 1024 px
    const background = id === "ios-1024" ? spec.colors.background : null;
    entries.push({ path: `${prefix}${id}.png`, data: await svgToPngBlob(svg, { size, square: true, padding: 0.08, background }) });
  }
  return entries;
}

/** LICENCES.txt : chaque police et icône avec sa licence (§14.2). */
export function licencesText(spec: LogoSpec) {
  const font = getFont(spec.fontId);
  const lines = [
    "LICENCES DES ÉLÉMENTS UTILISÉS",
    "",
    `Police : ${font.name} — SIL Open Font License 1.1 (https://openfontlicense.org)`,
    "Police : Montserrat — SIL Open Font License 1.1 (signature / slogan)",
  ];
  const icon = spec.iconId ? getIcon(spec.iconId) : null;
  if (icon) lines.push(`Icône : ${icon.id} — Lucide, licence ISC (https://lucide.dev/license)`);
  lines.push(
    "",
    "Les droits d'usage commercial du logo sont cédés au titulaire du compte, dans la limite des licences ci-dessus.",
    "Nous recommandons un dépôt de marque auprès de l'OAPI pour sécuriser le nom et le logo.",
  );
  return lines.join("\n");
}
