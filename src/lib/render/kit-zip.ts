"use client";

import type { BrandKit, EmailSignatureData, HandwrittenData, Signature, StampData } from "@/lib/types";
import { renderEmailSignature, type EmailTemplateId, type SignatureBrand } from "./email-signature";
import { svgToPngBlob, svgToStandalone } from "./export";
import { iconPackEntries, licencesText, socialSvg, SOCIAL_KIT } from "./logo-assets";
import { LOGO_VARIANTS, renderLogoSvg } from "./logo";
import { renderHandwrittenSvg, renderStampSvg } from "./stamp";
import { buildZip, type ZipEntry } from "./zip";

/**
 * Archive du kit rangée comme en production (KIT-03). Dans le navigateur, la charte est jointe
 * en HTML imprimable ; le worker produit charte.pdf et les PDF vectoriels du logo.
 */
export async function buildKitZip(kit: BrandKit, options: { projectName: string; signatures: Signature[]; brand: SignatureBrand; charterHtml?: string }) {
  const spec = kit.logoSpec!;
  const entries: ZipEntry[] = [];

  for (const variant of LOGO_VARIANTS) {
    const { svg } = renderLogoSvg(spec, { variant: variant.variant, layout: variant.layout, withBackground: false });
    entries.push({ path: `logo/svg/${variant.id}.svg`, data: await svgToStandalone(svg) });
    const sizes = variant.id === "color" ? [512, 1024, 2048] : [1024];
    for (const size of sizes) {
      entries.push({ path: `logo/png/${variant.id}-${size}.png`, data: await svgToPngBlob(svg, { size, padding: 0.06 }) });
    }
  }

  entries.push(...(await iconPackEntries(spec)));

  for (const format of SOCIAL_KIT) {
    entries.push({
      path: `reseaux-sociaux/${format.file}.png`,
      data: await svgToPngBlob(socialSvg(spec, format), { size: Math.max(format.width, format.height) }),
    });
  }

  for (const signature of options.signatures) {
    if (signature.kind === "EMAIL") {
      const html = renderEmailSignature((signature.templateId as EmailTemplateId) ?? "classic", signature.data as EmailSignatureData, options.brand);
      entries.push({ path: "signatures/signature-email.html", data: `<!doctype html><meta charset="utf-8">${html}` });
    }
    // Les cachets en attente de validation ou refusés ne sont jamais exportés (§6.4)
    if (signature.status !== "ACTIVE") continue;
    if (signature.kind === "STAMP") {
      const svg = renderStampSvg(signature.data as StampData, { idPrefix: `zip-${signature.id}` });
      entries.push({ path: "signatures/cachet.svg", data: await svgToStandalone(svg) });
      entries.push({ path: "signatures/cachet.png", data: await svgToPngBlob(svg, { size: 2400 }) });
    }
    if (signature.kind === "HANDWRITTEN") {
      const svg = renderHandwrittenSvg(signature.data as HandwrittenData);
      entries.push({ path: "signatures/paraphe.svg", data: await svgToStandalone(svg) });
      entries.push({ path: "signatures/paraphe.png", data: await svgToPngBlob(svg, { size: 2400 }) });
    }
  }

  if (options.charterHtml) entries.push({ path: "charte.html", data: options.charterHtml });
  entries.push({ path: "LICENCES.txt", data: licencesText(spec) });

  return buildZip(entries);
}
