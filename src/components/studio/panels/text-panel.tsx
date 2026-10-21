"use client";

import { useTranslations } from "next-intl";
import { mix } from "@/lib/render/color";
import { cssFontFamily, getFont } from "@/lib/render/fonts";
import { FONT_PAIRINGS, type FontChoice } from "@/lib/studio/brand";
import { createText, solid } from "@/lib/studio/doc";
import { ensureFonts, naturalWidth, relayout } from "@/lib/studio/text";
import type { TextElement } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { useStudioContext } from "../context";
import { addCentered, pageUnit, useInkColors } from "../placement";

// Textes : niveaux (titre, sous-titre, corps), styles d'effet prêts à l'emploi et associations
// de polices. Les tailles se rapportent au format de la création.

type Level = "title" | "subtitle" | "body";
const LEVELS: Record<Level, { size: number; weight: "heading" | "body"; role: TextElement["role"] }> = {
  title: { size: 0.1, weight: "heading", role: "title" },
  subtitle: { size: 0.055, weight: "heading", role: "subtitle" },
  body: { size: 0.034, weight: "body", role: "body" },
};

async function makeText(content: string, font: FontChoice, size: number, patch: Partial<TextElement> = {}) {
  await ensureFonts([font]);
  const base = createText({ text: content, fontId: font.fontId, fontWeight: font.fontWeight, fontSize: size, ...patch });
  const width = Math.min(naturalWidth(base), useStudio.getState().doc!.width * 0.8);
  return relayout({ ...base, width, align: patch.align ?? "center" });
}

export function TextPanel() {
  const t = useTranslations("studio.textPanel");
  const { brand } = useStudioContext();
  const heading = brand?.heading ?? { fontId: "montserrat", fontWeight: 800 };
  const body = brand?.body ?? { fontId: "inter", fontWeight: 400 };
  const { accent: primary, secondary, ink } = useInkColors(brand);

  const addLevel = async (level: Level) => {
    const spec = LEVELS[level];
    const font = spec.weight === "heading" ? heading : body;
    const el = await makeText(t(`samples.${level}`), font, Math.round(pageUnit() * spec.size), { role: spec.role, fill: solid(ink) });
    addCentered([el]);
  };

  const styles: { id: string; make: () => Promise<TextElement> }[] = [
    {
      id: "outline",
      make: () => makeText(t("styles.outline"), { fontId: "anton", fontWeight: 400 }, pageUnit() * 0.11, { fill: { type: "none" }, stroke: { color: primary, width: pageUnit() * 0.004 }, uppercase: true, role: "title" }),
    },
    {
      id: "gradient",
      make: () => makeText(t("styles.gradient"), heading, pageUnit() * 0.1, { fill: { type: "linear", angle: 0, stops: [{ offset: 0, color: primary }, { offset: 1, color: secondary }] }, role: "title" }),
    },
    {
      id: "highlight",
      make: () => makeText(t("styles.highlight"), body, pageUnit() * 0.045, { fontWeight: 700, fill: solid(ink), highlight: { color: secondary, padding: pageUnit() * 0.012, radius: pageUnit() * 0.008 }, role: "subtitle" }),
    },
    {
      id: "retro",
      make: () => makeText(t("styles.retro"), { fontId: "alfa-slab-one", fontWeight: 400 }, pageUnit() * 0.1, { fill: solid(secondary), stroke: { color: ink, width: pageUnit() * 0.003 }, shadow: { x: pageUnit() * 0.008, y: pageUnit() * 0.008, blur: 0, color: ink, opacity: 1 }, role: "title" }),
    },
    {
      id: "neon",
      make: () => makeText(t("styles.neon"), { fontId: "righteous", fontWeight: 400 }, pageUnit() * 0.1, { fill: solid(mix(secondary, "#ffffff", 0.6)), shadow: { x: 0, y: 0, blur: pageUnit() * 0.03, color: secondary, opacity: 1 }, role: "title" }),
    },
    {
      id: "arc",
      make: async () => {
        const el = await makeText(t("styles.arc"), heading, pageUnit() * 0.05, { uppercase: true, letterSpacing: 0.12, fill: solid(primary), role: "subtitle" });
        return relayout({ ...el, width: Math.max(el.width, pageUnit() * 0.5), curve: 45 });
      },
    },
    {
      id: "script",
      make: () => makeText(t("styles.script"), { fontId: "great-vibes", fontWeight: 400 }, pageUnit() * 0.11, { fill: solid(primary), role: "title" }),
    },
    {
      id: "label",
      make: () => makeText(t("styles.label"), body, pageUnit() * 0.026, { fontWeight: 700, uppercase: true, letterSpacing: 0.25, fill: solid(primary), role: "subtitle" }),
    },
  ];

  const addPairing = async ([h, b]: (typeof FONT_PAIRINGS)[number]) => {
    const title = await makeText(t("samples.pairTitle"), h, Math.round(pageUnit() * 0.085), { role: "title", fill: solid(ink) });
    const text = await makeText(t("samples.pairBody"), b, Math.round(pageUnit() * 0.032), { role: "body", fill: solid(mix(ink, "#ffffff", 0.2)) });
    const width = Math.max(title.width, text.width);
    const top = relayout({ ...title, width });
    const bottom = relayout({ ...text, width, y: top.height + pageUnit() * 0.02 });
    addCentered([top, bottom]);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <button type="button" onClick={() => addLevel("title")} className="rounded-lg border px-3 py-2.5 text-left text-2xl font-bold transition hover:border-primary hover:bg-muted" style={{ fontFamily: cssFontFamily(heading.fontId) }}>
          {t("addTitle")}
        </button>
        <button type="button" onClick={() => addLevel("subtitle")} className="rounded-lg border px-3 py-2 text-left text-base font-semibold transition hover:border-primary hover:bg-muted" style={{ fontFamily: cssFontFamily(heading.fontId) }}>
          {t("addSubtitle")}
        </button>
        <button type="button" onClick={() => addLevel("body")} className="rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-muted" style={{ fontFamily: cssFontFamily(body.fontId) }}>
          {t("addBody")}
        </button>
      </div>

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold">{t("effects")}</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {styles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={async () => addCentered([await style.make()])}
              className="flex h-14 items-center justify-center overflow-hidden rounded-lg border bg-background px-2 text-center transition hover:border-primary hover:bg-muted"
              title={t(`styleNames.${style.id}`)}
            >
              <StylePreview id={style.id} primary={primary} secondary={secondary} ink={ink} heading={heading.fontId} label={t(`styleNames.${style.id}`)} />
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <h3 className="text-xs font-semibold">{t("pairings")}</h3>
        <div className="grid gap-1.5">
          {FONT_PAIRINGS.slice(0, 12).map((pair) => (
            <button key={`${pair[0].fontId}-${pair[1].fontId}`} type="button" onClick={() => addPairing(pair)} className="grid gap-0.5 rounded-lg border px-3 py-2 text-left transition hover:border-primary hover:bg-muted">
              <span className="truncate text-lg leading-tight" style={{ fontFamily: cssFontFamily(pair[0].fontId), fontWeight: pair[0].fontWeight }}>
                {getFont(pair[0].fontId).name}
              </span>
              <span className="truncate text-xs text-muted-foreground" style={{ fontFamily: cssFontFamily(pair[1].fontId) }}>
                {t("pairWith", { font: getFont(pair[1].fontId).name })}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StylePreview({ id, primary, secondary, ink, heading, label }: { id: string; primary: string; secondary: string; ink: string; heading: string; label: string }) {
  const base = { fontSize: 18, lineHeight: 1.1 } as const;
  switch (id) {
    case "outline":
      return <span style={{ ...base, fontFamily: cssFontFamily("anton"), color: "transparent", WebkitTextStroke: `1px ${primary}`, textTransform: "uppercase", fontSize: 20 }}>{label}</span>;
    case "gradient":
      return <span style={{ ...base, fontFamily: cssFontFamily(heading), fontWeight: 800, background: `linear-gradient(90deg, ${primary}, ${secondary})`, WebkitBackgroundClip: "text", color: "transparent" }}>{label}</span>;
    case "highlight":
      return <span style={{ ...base, fontSize: 13, fontWeight: 700, background: secondary, color: ink, padding: "2px 6px", borderRadius: 4 }}>{label}</span>;
    case "retro":
      return <span style={{ ...base, fontFamily: cssFontFamily("alfa-slab-one"), color: secondary, textShadow: `2px 2px 0 ${ink}`, WebkitTextStroke: `0.5px ${ink}` }}>{label}</span>;
    case "neon":
      return <span style={{ ...base, fontFamily: cssFontFamily("righteous"), color: mix(secondary, "#ffffff", 0.6), textShadow: `0 0 6px ${secondary}, 0 0 12px ${secondary}`, background: "#111827", padding: "2px 6px", borderRadius: 4 }}>{label}</span>;
    case "arc":
      return (
        <svg viewBox="0 0 120 40" width="110" height="36" aria-hidden="true">
          <path id="arc-preview" d="M10 34 A60 60 0 0 1 110 34" fill="none" />
          <text fontSize="11" fontWeight="700" fill={primary} letterSpacing="1.5" style={{ fontFamily: cssFontFamily(heading) }}>
            <textPath href="#arc-preview" startOffset="50%" textAnchor="middle">
              {label.toUpperCase()}
            </textPath>
          </text>
        </svg>
      );
    case "script":
      return <span style={{ ...base, fontFamily: cssFontFamily("great-vibes"), color: primary, fontSize: 24 }}>{label}</span>;
    default:
      return <span style={{ ...base, fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: primary }}>{label}</span>;
  }
}
