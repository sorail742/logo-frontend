"use client";

import type { LogoSpec } from "@/lib/types";
import { APP_ICON_SIZES, buildIco, svgToPngBlob } from "./export";
import { getFont } from "./fonts";
import { getIcon } from "./icons";
import { renderLogoSvg } from "./logo";
import { socialKitSvg, type SocialFormat, type SocialKitInput } from "./social-kit";
import type { ZipEntry } from "./zip";

export { SOCIAL_KIT, type SocialFormat } from "./social-kit";

function iconSpec(spec: LogoSpec): LogoSpec {
  return { ...spec, iconFrame: spec.iconFrame === "none" ? "circle" : spec.iconFrame };
}

/** Kit réseaux sociaux (LOGO-23) : profils et bannières aux couleurs de la marque, logo en zone sûre. */
export function socialSvg(spec: LogoSpec, format: SocialFormat) {
  const layout = spec.layout === "vertical" ? "horizontal" : undefined;
  const icon = iconSpec(spec);
  const input: SocialKitInput = {
    logo: {
      color: renderLogoSvg(spec, { variant: "color", withBackground: false, layout }),
      white: renderLogoSvg(spec, { variant: "white", withBackground: false, layout }),
    },
    mark: {
      color: renderLogoSvg(icon, { layout: "icon" }),
      white: renderLogoSvg(icon, { layout: "icon", variant: "white", withBackground: false }),
      black: renderLogoSvg(icon, { layout: "icon", variant: "black" }),
    },
    colors: spec.colors,
    name: spec.text,
  };
  return socialKitSvg(input, format);
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
