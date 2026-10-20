import type {
  AvailabilityCheck,
  Brief,
  EntityType,
  LogoColors,
  LogoSpec,
  LogoStyle,
  LogoType,
  NameStyle,
  SloganKind,
  SloganTone,
} from "@/lib/types";
import { STYLE_PALETTES, normalizeHex } from "@/lib/render/color";
import { LOGO_FONTS } from "@/lib/render/fonts";
import { ICONS, searchIcons } from "@/lib/render/icons";
import { initials, slugify } from "@/lib/format";

// Générateurs simulés : ils imitent la sortie des workers IA pour faire vivre l'interface.

export function rng(seed: number) {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

function hash(value: string) {
  let h = 2166136261;
  for (const char of value) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return Math.abs(h);
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const STOPWORDS = new Set(
  "les des une pour avec dans sur par aux que qui est sont nous vous leur leurs plus mais ainsi entre their with from that this and the".split(" "),
);

// Termes injurieux ou à connotation négative (liste noire, NOM-14) : extrait de démonstration.
const BLOCKLIST = ["merde", "con", "pute", "nazi", "mort", "kill", "fuck", "shit"];

const METAPHORS = [
  ["Baobab", "l'arbre robuste qui traverse les générations"],
  ["Horizon", "l'ouverture vers l'avenir"],
  ["Kora", "l'instrument mandingue qui rassemble"],
  ["Fouta", "les hauts plateaux, source des grands fleuves"],
  ["Djoliba", "le fleuve Niger, qui relie les peuples"],
  ["Étoile", "le guide qui oriente"],
  ["Racines", "l'attachement aux origines"],
  ["Source", "le point de départ de toute chose"],
  ["Boussole", "l'orientation et la confiance"],
  ["Aube", "un nouveau commencement"],
  ["Sahel", "la résilience face aux défis"],
  ["Pirogue", "l'élan collectif vers l'avant"],
] as const;

const ENDINGS = ["ia", "o", "ora", "ix", "ly", "era", "ka", "ami", "ya", "ea", "is", "um"];
const DESCRIPTIVE_SUFFIX: Record<EntityType, string[]> = {
  ASSOCIATION: ["Solidaire", "Ensemble", "Action", "Avenir"],
  APPLICATION: ["App", "Go", "Hub", "Pay"],
  PLATFORM: ["Hub", "Connect", "Lab", "Market"],
  COMPANY: ["Conseil", "Services", "Groupe", "Solutions"],
  EVENT: ["Festival", "Forum", "Fest", "Days"],
  OTHER: ["Studio", "Collectif", "Projet", "Maison"],
};
const PROPER_NAMES = ["Fanta", "Sory", "Kadi", "Mariama", "Lansana", "Nènè", "Alpha", "Hawa"];
const ACRONYM_HEADS: Record<EntityType, string> = {
  ASSOCIATION: "Association des Jeunes pour",
  APPLICATION: "Application de",
  PLATFORM: "Plateforme de",
  COMPANY: "Société de",
  EVENT: "Rencontres de",
  OTHER: "Collectif pour",
};

function seedWords(brief: Brief | null, title: string) {
  const raw = [
    ...(brief?.mustInclude ?? []),
    ...(brief?.values ?? []),
    brief?.sector ?? "",
    ...(brief?.mission ?? "").split(/[^\p{L}]+/u),
    ...title.split(/[^\p{L}]+/u),
  ];
  const words = raw
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 12);
}

function pronunciation(value: string) {
  return value
    .toLowerCase()
    .replace(/([aeiouyéèêàâôîû]+)(?=[^aeiouyéèêàâôîû\s])/g, "$1-")
    .replace(/-+$/, "")
    .replace(/\s+/g, " · ");
}

function scoreName(value: string, random: () => number) {
  const length = value.replace(/\s/g, "").length;
  const lengthScore = Math.max(0, 30 - Math.max(0, length - 6) * 3);
  const vowels = (value.match(/[aeiouyéèê]/gi) ?? []).length / Math.max(length, 1);
  const pronounce = Math.round(30 - Math.abs(0.45 - vowels) * 60);
  const originality = Math.round(15 + random() * 15);
  return Math.max(30, Math.min(98, lengthScore + Math.max(5, pronounce) + originality + 10));
}

export interface GeneratedName {
  value: string;
  acronym: string | null;
  meaning: string;
  style: NameStyle;
  pronunciation: string;
  score: number;
}

export function generateNames(options: {
  brief: Brief | null;
  title: string;
  entityType: EntityType;
  exclude: Set<string>;
  feedback?: string;
  reference?: string;
  seed: number;
  count?: number;
}): GeneratedName[] {
  const random = rng(options.seed);
  const brief = options.brief;
  const words = seedWords(brief, options.title);
  if (!words.length) words.push("avenir", "lumière", "ensemble");
  const feedback = (options.feedback ?? "").toLowerCase();
  let maxLength = brief?.maxLength ?? 18;
  if (feedback.includes("court") || feedback.includes("short")) maxLength = Math.min(maxLength, 8);
  let styles: NameStyle[] = brief?.nameStyles?.length ? brief.nameStyles : ["INVENTED", "COMPOUND", "METAPHORICAL", "DESCRIPTIVE"];
  if (feedback.includes("sérieux") || feedback.includes("serieux") || feedback.includes("serious")) {
    styles = ["DESCRIPTIVE", "ACRONYM", "PROPER"];
  }
  if (options.entityType === "ASSOCIATION" && !styles.includes("ACRONYM")) styles = [...styles, "ACRONYM"];
  const avoid = (brief?.mustAvoid ?? []).map((w) => w.toLowerCase());

  const results: GeneratedName[] = [];
  const count = options.count ?? 10;
  let guard = 0;
  while (results.length < count && guard++ < 400) {
    const style = pick(random, styles);
    const word = pick(random, words);
    const other = pick(random, words);
    const stem = slugify(word).slice(0, 3 + Math.floor(random() * 2));
    let value = "";
    let acronym: string | null = null;
    let meaning = "";

    if (options.reference && feedback.includes("proche")) {
      const base = options.reference.replace(/\s.*/, "");
      value = capitalize(base.slice(0, Math.max(3, base.length - 2)) + pick(random, ENDINGS));
      meaning = `Variante proche de « ${options.reference} », qui en garde la sonorité.`;
    } else if (style === "INVENTED") {
      value = capitalize(stem + pick(random, ENDINGS));
      meaning = `Nom inventé à partir de « ${word} », court et facile à déposer.`;
    } else if (style === "COMPOUND") {
      value = capitalize(slugify(word).slice(0, 5)) + capitalize(slugify(other === word ? pick(random, ["lab", "cap", "nova"]) : other).slice(0, 4));
      meaning = `Composé de « ${word} » et « ${other === word ? "un suffixe dynamique" : other} ».`;
    } else if (style === "METAPHORICAL") {
      const [metaphor, sense] = pick(random, METAPHORS);
      value = random() > 0.5 ? metaphor : `${metaphor} ${capitalize(word)}`;
      meaning = `Évoque ${sense}, associé à « ${word} ».`;
    } else if (style === "DESCRIPTIVE") {
      value = `${capitalize(word)} ${pick(random, DESCRIPTIVE_SUFFIX[options.entityType])}`;
      meaning = `Dit clairement l'activité : ${word}.`;
    } else if (style === "ACRONYM") {
      const expansion = `${ACRONYM_HEADS[options.entityType]} ${capitalize(word)}${random() > 0.5 ? ` et ${capitalize(other)}` : ""}`;
      acronym = initials(expansion, 6);
      value = acronym;
      meaning = `Sigle de « ${expansion} ».`;
    } else {
      const person = pick(random, PROPER_NAMES);
      value = random() > 0.5 ? `Maison ${person}` : `${person} & ${capitalize(word)}`;
      meaning = `Nom propre chaleureux, inspiré du prénom ${person}.`;
    }

    const key = value.toLowerCase();
    const compact = value.replace(/\s/g, "");
    if (compact.length < 3 || compact.length > maxLength) continue;
    if (options.exclude.has(key) || results.some((r) => r.value.toLowerCase() === key)) continue;
    if (BLOCKLIST.some((term) => key.includes(term)) || avoid.some((term) => term && key.includes(term))) continue;
    results.push({ value, acronym, meaning, style, pronunciation: pronunciation(value), score: scoreName(value, random) });
  }
  return results;
}

export const DOMAIN_TLDS = [".com", ".org", ".net", ".app", ".africa", ".gn"];
export const SOCIAL_NETWORKS = ["Facebook", "Instagram", "TikTok", "X", "LinkedIn", "GitHub"];

export function availabilityChecks(name: string, otherChosenNames: string[]): AvailabilityCheck[] {
  const slug = slugify(name);
  const checkedAt = new Date().toISOString();
  const h = hash(slug);
  const checks: AvailabilityCheck[] = DOMAIN_TLDS.map((tld, i) => ({
    kind: "DOMAIN",
    target: `${slug}${tld}`,
    status: tld === ".com" && slug.length < 7 ? "TAKEN" : (h >> i) % 3 === 0 ? "TAKEN" : "AVAILABLE",
    url: `https://rdap.org/domain/${slug}${tld}`,
    checkedAt,
  }));
  SOCIAL_NETWORKS.forEach((network, i) => {
    checks.push({
      kind: "SOCIAL",
      target: network,
      status: (h >> (i + 6)) % 4 === 0 ? "TAKEN" : (h >> (i + 6)) % 4 === 1 ? "UNKNOWN" : "AVAILABLE",
      checkedAt,
    });
  });
  checks.push({
    kind: "TRADEMARK",
    target: "OMPI — Global Brand Database",
    status: "UNKNOWN",
    url: `https://branddb.wipo.int/en/similarname?brandName=${encodeURIComponent(name)}`,
    checkedAt,
  });
  checks.push({ kind: "TRADEMARK", target: "OAPI", status: "UNKNOWN", url: "https://www.oapi.int/", checkedAt });
  const similar = otherChosenNames.find((other) => phoneticKey(other) === phoneticKey(name));
  checks.push({ kind: "PHONETIC", target: similar ?? "Plateforme", status: similar ? "TAKEN" : "AVAILABLE", checkedAt });
  return checks;
}

/** Clé phonétique simplifiée adaptée au français (NOM-23). */
export function phoneticKey(value: string) {
  return slugify(value)
    .replace(/ph/g, "f")
    .replace(/qu|k|ck/g, "c")
    .replace(/y/g, "i")
    .replace(/(eau|au|o)/g, "o")
    .replace(/[hw]/g, "")
    .replace(/(.)\1+/g, "$1")
    .replace(/[aeiou]+$/g, "")
    .slice(0, 6);
}

function iconsFor(brief: Brief | null, random: () => number) {
  const terms = [...(brief?.values ?? []), brief?.sector ?? "", ...(brief?.mustInclude ?? [])].map((t) => t.toLowerCase());
  const matches = new Set<string>();
  for (const term of terms) {
    for (const icon of searchIcons(term.slice(0, 6))) matches.add(icon.id);
  }
  const pool = [...matches];
  while (pool.length < 8) {
    const icon = pick(random, ICONS).id;
    if (!pool.includes(icon)) pool.push(icon);
  }
  return pool;
}

function paletteFromInput(palette: string[] | undefined, style: LogoStyle, random: () => number): LogoColors {
  if (palette && palette.length >= 2) {
    return {
      primary: normalizeHex(palette[0]!),
      secondary: normalizeHex(palette[1]!),
      text: normalizeHex(palette[2] ?? "#111827"),
      background: normalizeHex(palette[3] ?? "#ffffff"),
    };
  }
  return { ...pick(random, STYLE_PALETTES[style]) };
}

const STYLE_FONTS: Record<LogoStyle, string[]> = {
  MINIMAL: ["space-grotesk", "inter", "manrope", "dm-sans", "outfit", "raleway", "work-sans"],
  MODERN: ["poppins", "plus-jakarta-sans", "outfit", "syne", "unbounded", "bricolage-grotesque", "montserrat", "rubik"],
  CLASSIC: ["playfair", "fraunces", "dm-serif-display", "cormorant-garamond", "libre-baskerville", "lora", "merriweather"],
  INSTITUTIONAL: ["merriweather", "roboto-slab", "libre-baskerville", "montserrat", "archivo", "work-sans", "lora"],
  PLAYFUL: ["nunito", "righteous", "comfortaa", "quicksand", "lobster", "rubik", "bebas-neue"],
  AFRICAN: ["oswald", "anton", "bebas-neue", "alfa-slab-one", "abril-fatface", "teko", "barlow-condensed", "archivo-black"],
};

export function generateLogoSpecs(options: {
  text: string;
  tagline: string;
  type: LogoType;
  style: LogoStyle;
  palette?: string[];
  brief: Brief | null;
  feedback?: string;
  reference?: LogoSpec;
  seed: number;
  count?: number;
}): LogoSpec[] {
  const random = rng(options.seed);
  const icons = iconsFor(options.brief, random);
  const feedback = (options.feedback ?? "").toLowerCase();
  const specs: LogoSpec[] = [];
  const fonts = STYLE_FONTS[options.style].filter((id) => LOGO_FONTS.some((f) => f.id === id));
  const frames: LogoSpec["iconFrame"][] = feedback.includes("simple") ? ["none"] : ["circle", "rounded", "none", "hexagon"];

  for (let i = 0; i < (options.count ?? 8); i++) {
    const base = options.reference;
    const colors = feedback.includes("même") || feedback.includes("same") ? base?.colors ?? paletteFromInput(options.palette, options.style, random) : paletteFromInput(options.palette, options.style, random);
    const iconId = feedback.includes("autre icône") || !base ? icons[i % icons.length]! : base.iconId;
    specs.push({
      type: options.type,
      text: options.text,
      tagline: random() > 0.5 ? options.tagline : "",
      fontId: pick(random, fonts.length ? fonts : ["montserrat"]),
      fontWeight: pick(random, [600, 700, 800]),
      letterSpacing: options.style === "MINIMAL" || options.style === "INSTITUTIONAL" ? 0.04 : pick(random, [0, 0, 0.02, 0.08]),
      uppercase: options.style === "INSTITUTIONAL" || options.style === "AFRICAN" ? true : random() > 0.7,
      iconId: options.type === "MONOGRAM" ? null : iconId,
      iconScale: 1,
      iconFrame: options.type === "MONOGRAM" ? pick(random, ["circle", "rounded", "hexagon"] as const) : pick(random, frames),
      layout: options.type === "WORDMARK" ? "text" : i % 3 === 2 ? "vertical" : "horizontal",
      colors,
    });
  }
  return specs;
}

const SLOGAN_TEMPLATES: Record<"fr" | "en", Record<SloganTone, string[]>> = {
  fr: {
    INSPIRING: ["Ensemble, faisons grandir {value}", "{Value}, aujourd'hui pour demain", "Semer {value}, récolter l'avenir", "Chaque geste compte", "Plus loin, ensemble"],
    INSTITUTIONAL: ["Au service de {value}", "L'engagement au cœur de {sector}", "La référence en {sector}", "Agir avec rigueur et {value}", "Votre partenaire de confiance"],
    CATCHY: ["{Name}, et ça change tout", "Simple. Rapide. {Name}.", "Le {sector} autrement", "Osez {value}", "{Name}, c'est maintenant"],
    ENGAGED: ["Agir pour {value}, maintenant", "Notre force : {value}", "Pour une Guinée plus {value}", "Debout pour {value}", "Changer les choses, ensemble"],
  },
  en: {
    INSPIRING: ["Growing {value} together", "{Value} today, for tomorrow", "Every step counts", "Further, together"],
    INSTITUTIONAL: ["Serving {value}", "Trusted in {sector}", "Commitment at the heart of {sector}"],
    CATCHY: ["{Name}. That changes everything.", "Simple. Fast. {Name}.", "{sector}, reinvented"],
    ENGAGED: ["Acting for {value}, now", "Standing up for {value}", "Change starts with us"],
  },
};

export function generateSlogans(options: {
  name: string;
  brief: Brief | null;
  tone: SloganTone;
  maxWords: number;
  language: "fr" | "en";
  kind: SloganKind;
  exclude: Set<string>;
  seed: number;
}): string[] {
  const random = rng(options.seed);
  const values = options.brief?.values?.length ? options.brief.values : ["progrès", "unité", "travail"];
  if (options.kind === "DEVISE") {
    const pool = [...values, "Unité", "Travail", "Progrès", "Solidarité", "Justice", "Engagement", "Excellence"];
    const results = new Set<string>();
    let guard = 0;
    while (results.size < 5 && guard++ < 100) {
      const terms = new Set<string>();
      while (terms.size < 3) terms.add(capitalize(pick(random, pool)));
      results.add([...terms].join(" – "));
    }
    return [...results];
  }
  if (options.kind === "MISSION") {
    const mission = options.brief?.mission || `accompagner ${options.brief?.audience || "notre communauté"}`;
    return [
      `${options.name} a pour mission de ${mission.charAt(0).toLowerCase()}${mission.slice(1).replace(/\.$/, "")}.`,
      `Nous rassemblons ${options.brief?.audience || "celles et ceux"} qui partagent nos valeurs : ${values.join(", ")}.`,
      `${options.name} agit au quotidien pour ${values[0]} et ${values[1] ?? "le progrès"}.`,
    ];
  }
  const templates = SLOGAN_TEMPLATES[options.language][options.tone];
  const results: string[] = [];
  let guard = 0;
  while (results.length < 10 && guard++ < 200) {
    const value = pick(random, values);
    const text = pick(random, [...templates, ...SLOGAN_TEMPLATES[options.language][pick(random, ["INSPIRING", "CATCHY", "ENGAGED", "INSTITUTIONAL"] as const)]])
      .replace("{value}", value.toLowerCase())
      .replace("{Value}", capitalize(value))
      .replace("{Name}", options.name)
      .replace("{sector}", (options.brief?.sector || "service").toLowerCase());
    if (text.split(/\s+/).length > options.maxWords) continue;
    if (results.includes(text) || options.exclude.has(text.toLowerCase())) continue;
    results.push(text);
  }
  return results;
}
