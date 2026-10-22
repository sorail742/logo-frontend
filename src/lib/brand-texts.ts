import type { Brief } from "@/lib/types";

// Textes de marque prêts à publier : bios des réseaux, description WhatsApp Business, pitch et
// hashtags, composés à partir du brief et du kit (sans crédit, sans appel externe). Chaque texte
// respecte la limite de caractères de sa plateforme.

export interface BrandTextInput {
  name: string;
  slogan?: string | null;
  mission?: string | null;
  devise?: string | null;
  brief?: Pick<Brief, "sector" | "values" | "audience" | "mission"> | null;
  locale: string;
}

export interface BrandText {
  id: "instagram" | "whatsapp" | "facebook" | "linkedin" | "google" | "pitch" | "hashtags";
  text: string;
  /** Limite de la plateforme, en caractères. */
  limit: number;
}

const LIMITS: Record<BrandText["id"], number> = {
  instagram: 150,
  whatsapp: 512,
  facebook: 255,
  linkedin: 120,
  google: 750,
  pitch: 600,
  hashtags: 300,
};

const sentence = (value: string) => {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return "";
  const capital = clean[0]!.toUpperCase() + clean.slice(1);
  return /[.!?…]$/.test(capital) ? capital : `${capital}.`;
};

const lower = (value: string) => (value ? value[0]!.toLowerCase() + value.slice(1) : value);

/** Coupe au dernier mot entier sous la limite. */
function fit(text: string, limit: number) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 0)).replace(/[\s,;:·—-]+$/, "")}…`;
}

function list(items: string[], and: string) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
}

/** Mot-dièse lisible : majuscule à chaque mot, sans espace ni ponctuation. */
export function hashtag(value: string) {
  const words = value
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  if (!words.length) return null;
  return `#${words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join("")}`;
}

const COPY = {
  fr: {
    and: "et",
    values: (v: string) => `Nos valeurs : ${v}.`,
    contact: "Écrivez-nous ici pour toute demande : nous répondons rapidement.",
    linkInBio: "Infos et commandes : lien ci-dessous",
    pitch: (name: string, mission: string, values: string, slogan: string) =>
      [mission ? `${name} : ${lower(sentence(mission))}` : `${name}, une marque qui tient ses promesses.`, values && `Nous avançons avec ${values}.`, slogan && `${sentence(slogan)}`]
        .filter(Boolean)
        .join(" "),
    googleTail: "Contactez-nous pour en savoir plus ou passer commande.",
    sectorLine: (sector: string) => `${sentence(sector).slice(0, -1)}`,
  },
  en: {
    and: "and",
    values: (v: string) => `Our values: ${v}.`,
    contact: "Message us here for any request: we reply quickly.",
    linkInBio: "Info and orders: link below",
    pitch: (name: string, mission: string, values: string, slogan: string) =>
      [mission ? `${name}: ${lower(sentence(mission))}` : `${name}, a brand that keeps its promises.`, values && `We are driven by ${values}.`, slogan && `${sentence(slogan)}`]
        .filter(Boolean)
        .join(" "),
    googleTail: "Contact us to learn more or place an order.",
    sectorLine: (sector: string) => `${sentence(sector).slice(0, -1)}`,
  },
};

export function brandTexts(input: BrandTextInput): BrandText[] {
  const copy = input.locale === "en" ? COPY.en : COPY.fr;
  const name = input.name.trim();
  const slogan = input.slogan?.trim() ?? "";
  const mission = (input.mission ?? input.brief?.mission ?? "").trim();
  const sector = input.brief?.sector?.trim() ?? "";
  const values = (input.brief?.values ?? []).map((v) => v.trim()).filter(Boolean).slice(0, 4);
  const valuesText = list(values, copy.and);
  const missionSentence = sentence(mission);

  const instagram = [sector ? `${name} · ${copy.sectorLine(sector)}` : name, slogan, values.length ? values.map((v) => `✓ ${v}`).join("  ") : "", `↓ ${copy.linkInBio}`]
    .filter(Boolean)
    .join("\n");
  const whatsapp = [missionSentence || sentence(slogan), slogan && missionSentence ? sentence(slogan) : "", values.length ? copy.values(valuesText) : "", copy.contact].filter(Boolean).join(" ");
  const facebook = [missionSentence ? `${name} : ${lower(missionSentence)}` : name, slogan && sentence(slogan)].filter(Boolean).join(" ");
  const linkedin = [sector && copy.sectorLine(sector), values.length ? values.map((v) => v[0]!.toUpperCase() + v.slice(1)).join(" · ") : slogan].filter(Boolean).join(" | ") || name;
  const google = [copy.pitch(name, mission, valuesText, slogan), copy.googleTail].join(" ");
  const pitch = copy.pitch(name, mission, valuesText, slogan);
  // Une devise en trois termes (« Travail – Justice – Solidarité ») donne trois mots-dièses.
  const devise = (input.devise ?? "").split(/[–—·,/]|\s-\s/).map((term) => term.trim());
  const tags = [name, sector, ...values, ...devise]
    .map((value) => hashtag(value))
    .filter((tag): tag is string => !!tag);
  const hashtags = [...new Set(tags)].slice(0, 10).join(" ");

  const texts: [BrandText["id"], string][] = [
    ["instagram", instagram],
    ["whatsapp", whatsapp],
    ["facebook", facebook],
    ["linkedin", linkedin],
    ["google", google],
    ["pitch", pitch],
    ["hashtags", hashtags],
  ];
  return texts.map(([id, text]) => ({ id, text: fit(text, LIMITS[id]), limit: LIMITS[id] }));
}
