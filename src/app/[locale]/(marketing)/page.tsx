import { BadgeCheck, FileArchive, PenTool, Smartphone, Sparkles, Stamp, Type } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/common/button-link";
import { SvgView } from "@/components/brand/svg-view";
import { renderLogoSvg } from "@/lib/render/logo";
import { renderStampSvg } from "@/lib/render/stamp";
import type { LogoSpec } from "@/lib/types";

const SHOWCASE: LogoSpec[] = [
  { type: "ICON_TEXT", text: "Baobab Vert", tagline: "Jeunesse et nature", fontId: "montserrat", fontWeight: 800, letterSpacing: 0, uppercase: false, iconId: "sprout", iconScale: 1, iconFrame: "circle", layout: "horizontal", colors: { primary: "#15803d", secondary: "#ca8a04", text: "#14532d", background: "#ffffff" } },
  { type: "MONOGRAM", text: "Kora Pay", tagline: "", fontId: "poppins", fontWeight: 700, letterSpacing: 0, uppercase: false, iconId: null, iconScale: 1, iconFrame: "rounded", layout: "vertical", colors: { primary: "#4f46e5", secondary: "#06b6d4", text: "#0f172a", background: "#ffffff" } },
  { type: "ICON_TEXT", text: "Djoliba", tagline: "Festival des arts", fontId: "playfair", fontWeight: 700, letterSpacing: 0.02, uppercase: false, iconId: "music", iconScale: 1, iconFrame: "hexagon", layout: "horizontal", colors: { primary: "#ce1126", secondary: "#e9a400", text: "#3b1d0a", background: "#ffffff" } },
  { type: "WORDMARK", text: "SAHEL LAB", tagline: "Innovation agricole", fontId: "bebas-neue", fontWeight: 400, letterSpacing: 0.06, uppercase: true, iconId: null, iconScale: 1, iconFrame: "none", layout: "text", colors: { primary: "#b45309", secondary: "#15803d", text: "#1c1917", background: "#ffffff" } },
];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing");

  const logos = SHOWCASE.map((spec) => renderLogoSvg(spec).svg);
  const stamp = renderStampSvg(
    { shape: "round", ringText: "Association Baobab Vert", bottomText: "Conakry · Guinée", centerText: "ABV", centerMode: "acronym", ink: "blue", inkEffect: false },
    { idPrefix: "home-stamp" },
  );

  const modules = [
    { icon: Type, key: "names" },
    { icon: PenTool, key: "logos" },
    { icon: Stamp, key: "signatures" },
    { icon: FileArchive, key: "kit" },
  ] as const;

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--accent),transparent_60%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">{t("hero.title")}</h1>
            <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">{t("hero.subtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/inscription" size="lg" className="h-11 px-5 text-base">
                {t("hero.cta")}
              </ButtonLink>
              <ButtonLink href="/outils/generateur-de-noms" variant="outline" size="lg" className="h-11 px-5 text-base">
                {t("hero.secondary")}
              </ButtonLink>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("hero.proof")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            {logos.map((svg, i) => (
              <div key={i} className="flex aspect-[4/3] items-center rounded-xl border bg-card p-4 shadow-sm">
                <SvgView svg={svg} className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">{t("problem.title")}</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {(["cost", "skills", "tools", "taken"] as const).map((key) => (
            <li key={key} className="flex gap-3 rounded-xl border p-4">
              <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm">{t(`problem.items.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="fonctionnalites" className="scroll-mt-16 border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">{t("modules.title")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {modules.map(({ icon: Icon, key }) => (
              <article key={key} className="rounded-xl border bg-card p-5">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{t(`modules.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`modules.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("journey.title")}</h2>
          <ol className="mt-6 grid gap-3">
            {(["1", "2", "3", "4", "5", "6"] as const).map((step) => (
              <li key={step} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{step}</span>
                <span>{t(`journey.steps.${step}`)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">{t("journey.shortcuts")}</p>
        </div>
        <div className="flex items-center justify-center rounded-xl border bg-card p-6" aria-hidden="true">
          <SvgView svg={stamp} className="w-56" />
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">{t("personas.title")}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(["association", "app", "startup", "agency", "student"] as const).map((key) => (
              <li key={key} className="rounded-xl border bg-card p-4 text-sm">
                {t(`personas.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-14 md:grid-cols-[auto_1fr_auto]">
        <Smartphone className="size-10 text-brand-accent" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold">{t("payment.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("payment.body")}</p>
        </div>
        <ButtonLink href="/tarifs" variant="outline" size="lg">
          {t("payment.cta")}
        </ButtonLink>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t("cta.title")}</h2>
            <p className="mt-1 opacity-90">{t("cta.body")}</p>
          </div>
          <ButtonLink href="/outils/generateur-de-noms" variant="secondary" size="lg" className="h-11 px-5 text-base">
            {t("cta.button")}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
