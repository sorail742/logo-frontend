import type { EmailSignatureData } from "@/lib/types";
import { ensureContrast } from "./color";
import { escapeXml as esc } from "./svg";

// Signatures e-mail compatibles Gmail, Outlook, Apple Mail, Thunderbird (SIG-13) :
// tableaux, styles en ligne, polices système, images en URL HTTPS absolue.

export interface SignatureBrand {
  name: string;
  slogan?: string;
  logoUrl?: string | null; // PNG hébergé (fourni par l'API)
  primary: string;
  secondary: string;
  /** Mention de la plateforme imposée par l'offre gratuite (§8.2). */
  poweredBy?: string | null;
}

export const EMAIL_TEMPLATES = [
  { id: "classic", name: "Classique" },
  { id: "sidebar", name: "Barre latérale" },
  { id: "compact", name: "Compacte" },
  { id: "centered", name: "Centrée" },
  { id: "banner", name: "Bandeau" },
  { id: "minimal", name: "Minimale" },
] as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATES)[number]["id"];

const FONT = "Arial, Helvetica, sans-serif";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function safeUrl(url: string) {
  const value = url.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

function contactLines(data: EmailSignatureData, color: string) {
  const link = `color:${color};text-decoration:none;`;
  const lines: string[] = [];
  for (const phone of data.phones.filter(Boolean)) {
    lines.push(`<a href="${esc(telHref(phone))}" style="${link}">${esc(phone)}</a>`);
  }
  if (data.email) lines.push(`<a href="mailto:${esc(data.email)}" style="${link}">${esc(data.email)}</a>`);
  if (data.website) {
    const url = safeUrl(data.website);
    lines.push(`<a href="${esc(url)}" style="${link}">${esc(data.website.replace(/^https?:\/\//, ""))}</a>`);
  }
  if (data.address) lines.push(`<span style="color:#555555;">${esc(data.address)}</span>`);
  return lines;
}

function socials(data: EmailSignatureData, color: string) {
  const items = data.socials.filter((s) => s.url.trim());
  if (!items.length) return "";
  return items
    .map(
      (s) =>
        `<a href="${esc(safeUrl(s.url))}" style="color:${color};text-decoration:none;font-weight:bold;font-size:12px;margin-right:10px;">${esc(s.network)}</a>`,
    )
    .join("");
}

function logoImg(brand: SignatureBrand, width: number) {
  if (!brand.logoUrl) return "";
  return `<img src="${esc(brand.logoUrl)}" alt="${esc(brand.name)}" width="${width}" style="display:block;border:0;outline:none;width:${width}px;max-width:${width}px;height:auto;">`;
}

function photoImg(data: EmailSignatureData, size: number) {
  if (!data.photoUrl) return "";
  return `<img src="${esc(safeUrl(data.photoUrl))}" alt="${esc(data.fullName)}" width="${size}" height="${size}" style="display:block;border:0;border-radius:${size / 2}px;width:${size}px;height:${size}px;">`;
}

function footer(data: EmailSignatureData, brand: SignatureBrand) {
  const parts: string[] = [];
  if (data.bannerUrl) {
    const img = `<img src="${esc(safeUrl(data.bannerUrl))}" alt="" width="480" style="display:block;border:0;width:480px;max-width:100%;height:auto;">`;
    parts.push(`<tr><td style="padding-top:12px;">${data.bannerLink ? `<a href="${esc(safeUrl(data.bannerLink))}">${img}</a>` : img}</td></tr>`);
  }
  if (data.legal) {
    parts.push(`<tr><td style="padding-top:10px;font-family:${FONT};font-size:10px;line-height:14px;color:#888888;">${esc(data.legal)}</td></tr>`);
  }
  if (brand.poweredBy) {
    parts.push(`<tr><td style="padding-top:6px;font-family:${FONT};font-size:10px;color:#aaaaaa;">${esc(brand.poweredBy)}</td></tr>`);
  }
  return parts.join("");
}

function wrap(inner: string, data: EmailSignatureData, brand: SignatureBrand) {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:${FONT};font-size:13px;line-height:18px;color:#333333;"><tr><td>${inner}</td></tr>${footer(data, brand)}</table>`;
}

export function renderEmailSignature(templateId: EmailTemplateId, data: EmailSignatureData, brand: SignatureBrand): string {
  const primary = ensureContrast(brand.primary, "#ffffff");
  const accent = ensureContrast(brand.secondary, "#ffffff", 3);
  const name = `<span style="font-size:16px;font-weight:bold;color:#111111;">${esc(data.fullName)}</span>`;
  const title = data.jobTitle ? `<span style="color:${primary};font-weight:bold;">${esc(data.jobTitle)}</span>` : "";
  const org = `<span style="color:#555555;">${esc(brand.name)}</span>`;
  const contacts = contactLines(data, primary);
  const social = socials(data, primary);

  switch (templateId) {
    case "sidebar":
      return wrap(
        `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;"><tr>
<td valign="top" style="padding-right:14px;">${photoImg(data, 72) || logoImg(brand, 72)}</td>
<td valign="top" style="border-left:3px solid ${primary};padding-left:14px;">${name}<br>${title}${title ? " · " : ""}${org}<br>${contacts.join("<br>")}${social ? `<br>${social}` : ""}</td>
</tr></table>`,
        data,
        brand,
      );
    case "compact":
      return wrap(
        `${name} <span style="color:#999999;">|</span> ${title}${title ? " · " : ""}${org}<br><span style="font-size:12px;">${contacts.join(' <span style="color:#cccccc;">·</span> ')}</span>`,
        data,
        brand,
      );
    case "centered":
      return wrap(
        `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;"><tr><td align="center" style="text-align:center;">
${brand.logoUrl ? `<div style="padding-bottom:8px;">${logoImg(brand, 120)}</div>` : ""}${name}<br>${title}<br>${org}<br><span style="font-size:12px;">${contacts.join(" · ")}</span>${social ? `<br>${social}` : ""}
</td></tr></table>`,
        data,
        brand,
      );
    case "banner":
      return wrap(
        `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;width:480px;"><tr>
<td style="background-color:${primary};padding:10px 14px;color:#ffffff;font-weight:bold;font-size:14px;">${esc(brand.name)}${brand.slogan ? `<span style="font-weight:normal;font-size:12px;color:#ffffff;"> — ${esc(brand.slogan)}</span>` : ""}</td></tr>
<tr><td style="padding:12px 14px;border:1px solid #e5e5e5;border-top:0;">${name}<br>${title}<br>${contacts.join("<br>")}${social ? `<br>${social}` : ""}</td></tr></table>`,
        data,
        brand,
      );
    case "minimal":
      return wrap(
        `<span style="font-weight:bold;color:#111111;">${esc(data.fullName)}</span><br><span style="color:#666666;">${esc([data.jobTitle, brand.name].filter(Boolean).join(", "))}</span><br><span style="font-size:12px;">${contacts.join("<br>")}</span>`,
        data,
        brand,
      );
    case "classic":
    default:
      return wrap(
        `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;"><tr>
${brand.logoUrl ? `<td valign="middle" style="padding-right:16px;">${logoImg(brand, 96)}</td>` : ""}
<td valign="middle">${name}<br>${title}<br>${org}
<div style="height:2px;width:40px;background-color:${accent};margin:6px 0;line-height:2px;font-size:2px;">&nbsp;</div>
${contacts.join("<br>")}${social ? `<br>${social}` : ""}</td>
</tr></table>`,
        data,
        brand,
      );
  }
}

/** Version texte brut (SIG-15). */
export function renderEmailSignatureText(data: EmailSignatureData, brand: SignatureBrand) {
  return [
    "-- ",
    data.fullName,
    [data.jobTitle, brand.name].filter(Boolean).join(" · "),
    ...data.phones.filter(Boolean),
    data.email,
    data.website,
    data.address,
    ...data.socials.filter((s) => s.url).map((s) => `${s.network} : ${safeUrl(s.url)}`),
    data.legal,
    brand.poweredBy ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const EMPTY_EMAIL_SIGNATURE: EmailSignatureData = {
  fullName: "",
  jobTitle: "",
  phones: ["+224 "],
  email: "",
  website: "",
  address: "Conakry, Guinée",
  socials: [
    { network: "Facebook", url: "" },
    { network: "LinkedIn", url: "" },
  ],
  photoUrl: "",
  legal: "",
};
