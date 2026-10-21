import {
  ArrowRight,
  Check,
  CircleCheck,
  FileArchive,
  GraduationCap,
  HandHeart,
  LayoutTemplate,
  Library,
  PenTool,
  Printer,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stamp,
  Store,
  Type,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/common/button-link";
import { SvgView } from "@/components/brand/svg-view";
import { StudioShowcase } from "@/components/marketing/studio-showcase";
import { renderLogoSvg } from "@/lib/render/logo";
import { renderStampSvg } from "@/lib/render/stamp";
import type { LogoSpec } from "@/lib/types";
import { cn } from "@/lib/utils";

const SHOWCASE: LogoSpec[] = [
  { type: "ICON_TEXT", text: "Baobab Vert", tagline: "Jeunesse et nature", fontId: "montserrat", fontWeight: 800, letterSpacing: 0, uppercase: false, iconId: "sprout", iconScale: 1, iconFrame: "circle", layout: "horizontal", colors: { primary: "#15803d", secondary: "#ca8a04", text: "#14532d", background: "#ffffff" } },
  { type: "MONOGRAM", text: "Kora Pay", tagline: "", fontId: "poppins", fontWeight: 700, letterSpacing: 0, uppercase: false, iconId: null, iconScale: 1, iconFrame: "rounded", layout: "vertical", colors: { primary: "#4f46e5", secondary: "#06b6d4", text: "#0f172a", background: "#ffffff" } },
  { type: "ICON_TEXT", text: "Djoliba", tagline: "Festival des arts", fontId: "playfair", fontWeight: 700, letterSpacing: 0.02, uppercase: false, iconId: "music", iconScale: 1, iconFrame: "hexagon", layout: "horizontal", colors: { primary: "#ce1126", secondary: "#e9a400", text: "#3b1d0a", background: "#ffffff" } },
  { type: "WORDMARK", text: "SAHEL LAB", tagline: "Innovation agricole", fontId: "bebas-neue", fontWeight: 400, letterSpacing: 0.06, uppercase: true, iconId: null, iconScale: 1, iconFrame: "none", layout: "text", colors: { primary: "#b45309", secondary: "#15803d", text: "#1c1917", background: "#ffffff" } },
];

const SAMPLE_NAMES = [
  { name: "Kalossa", domain: "kalossa.gn" },
  { name: "Wouri Lab", domain: "wourilab.africa" },
  { name: "Nafa", domain: "nafa.org" },
];

const PALETTE = ["#0f6b5c", "#e9a400", "#14281d", "#f6fbf4"];

function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs font-semibold tracking-[0.18em] text-primary uppercase", className)}>{children}</p>;
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing");

  const logos = SHOWCASE.map((spec) => renderLogoSvg(spec).svg);
  const stamp = renderStampSvg(
    { shape: "round", ringText: "Association Baobab Vert", bottomText: "Conakry · Guinée", centerText: "ABV", centerMode: "acronym", ink: "blue", inkEffect: false },
    { idPrefix: "home-stamp" },
  );

  const studioFeatures: { key: string; icon: LucideIcon; tone: string }[] = [
    { key: "templates", icon: LayoutTemplate, tone: "from-emerald-400/20 text-emerald-300" },
    { key: "resize", icon: Wand2, tone: "from-violet-400/20 text-violet-300" },
    { key: "check", icon: ShieldCheck, tone: "from-sky-400/20 text-sky-300" },
    { key: "print", icon: Printer, tone: "from-amber-400/20 text-amber-300" },
    { key: "variations", icon: Sparkles, tone: "from-pink-400/20 text-pink-300" },
    { key: "library", icon: Library, tone: "from-teal-400/20 text-teal-300" },
  ];
  const personas: { key: "association" | "app" | "startup" | "agency" | "student"; icon: LucideIcon }[] = [
    { key: "association", icon: HandHeart },
    { key: "app", icon: Smartphone },
    { key: "startup", icon: Rocket },
    { key: "agency", icon: Store },
    { key: "student", icon: GraduationCap },
  ];
  const steps = ["1", "2", "3", "4", "5", "6", "7"] as const;

  return (
    <>
      {/* ─── Accroche ─── */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent),radial-gradient(40%_40%_at_10%_90%,color-mix(in_oklch,var(--brand-accent)_22%,transparent),transparent)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] bg-[size:56px_56px] opacity-40" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 md:pt-20 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-2.5" aria-hidden="true" />
              </span>
              {t("hero.eyebrow")}
            </p>
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t("hero.title")}{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-amber-500 bg-clip-text text-transparent">{t("hero.titleAccent")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/inscription" size="lg" className="h-12 rounded-xl px-6 text-base shadow-lg shadow-primary/25">
                {t("hero.cta")}
                <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/outils/generateur-de-noms" variant="outline" size="lg" className="h-12 rounded-xl bg-background/70 px-6 text-base">
                {t("hero.secondary")}
              </ButtonLink>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {(t.raw("hero.proofItems") as string[]).map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <StudioShowcase />
        </div>
      </section>

      {/* ─── Publics ─── */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 md:flex-row md:justify-between">
          <p className="shrink-0 text-sm font-medium text-muted-foreground">{t("audience.title")}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {(t.raw("audience.items") as string[]).map((item) => (
              <li key={item} className="rounded-full border bg-background px-3 py-1 text-xs font-medium">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Constat ─── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Kicker>{t("problem.kicker")}</Kicker>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{t("problem.title")}</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(["cost", "skills", "tools", "taken"] as const).map((key, i) => (
              <li key={key} className="rounded-2xl border bg-card p-5 shadow-xs">
                <span className="text-sm font-semibold text-primary tabular-nums">0{i + 1}</span>
                <p className="mt-2 text-sm leading-relaxed">{t(`problem.items.${key}`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Modules ─── */}
      <section id="fonctionnalites" className="scroll-mt-16 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker>{t("bento.kicker")}</Kicker>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{t("bento.title")}</h2>
            <p className="mt-4 text-pretty text-muted-foreground">{t("bento.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <article className="flex flex-col rounded-3xl border bg-card p-6 shadow-xs md:col-span-3">
              <Type className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{t("bento.names.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("bento.names.body")}</p>
              <ul className="mt-6 grid gap-2" aria-hidden="true">
                {SAMPLE_NAMES.map((n) => (
                  <li key={n.name} className="flex items-center justify-between rounded-xl border bg-background px-4 py-2.5">
                    <span className="font-semibold">{n.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <CircleCheck className="size-3.5" />
                      {n.domain} · {t("bento.names.free")}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="flex flex-col rounded-3xl border bg-card p-6 shadow-xs md:col-span-3">
              <PenTool className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{t("bento.logos.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("bento.logos.body")}</p>
              <div className="mt-6 grid grid-cols-2 gap-2" aria-hidden="true">
                {logos.map((svg, i) => (
                  <div key={i} className="flex aspect-[2/1] items-center rounded-xl border bg-white p-3">
                    <SvgView svg={svg} className="h-full w-full" />
                  </div>
                ))}
              </div>
            </article>
            <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-emerald-800 p-6 text-primary-foreground shadow-lg md:col-span-4">
              <div className="absolute -top-16 -right-16 size-56 rounded-full bg-amber-400/30 blur-2xl" aria-hidden="true" />
              <LayoutTemplate className="size-6" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{t("bento.studio.title")}</h3>
              <p className="mt-1 max-w-lg text-sm opacity-90">{t("bento.studio.body")}</p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {(t.raw("bento.studio.points") as string[]).map((point) => (
                  <li key={point} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm backdrop-blur">
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
            <article className="flex flex-col items-center rounded-3xl border bg-card p-6 text-center shadow-xs md:col-span-2">
              <Stamp className="size-6 self-start text-primary" aria-hidden="true" />
              <div className="my-3 w-32" aria-hidden="true">
                <SvgView svg={stamp} className="w-full" />
              </div>
              <h3 className="text-lg font-semibold">{t("bento.signatures.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("bento.signatures.body")}</p>
            </article>
            <article className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-xs md:col-span-6 md:flex-row md:items-center">
              <FileArchive className="size-6 shrink-0 text-primary" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{t("bento.kit.title")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("bento.kit.body")}</p>
              </div>
              <div className="flex gap-2" aria-hidden="true">
                {PALETTE.map((color) => (
                  <span key={color} className="grid gap-1 text-center">
                    <span className="size-12 rounded-xl border border-black/5 shadow-sm" style={{ background: color }} />
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">{color.slice(1)}</span>
                  </span>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ─── Studio ─── */}
      <section id="studio" className="relative isolate scroll-mt-16 overflow-hidden bg-slate-950 text-white">
        <div className="absolute top-0 left-1/2 -z-10 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <Kicker className="text-emerald-300">{t("studio.kicker")}</Kicker>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{t("studio.title")}</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-pretty text-slate-300">{t("studio.body")}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {studioFeatures.map(({ key, icon: Icon, tone }) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <span className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br to-transparent", tone)}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">{t(`studio.features.${key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{t(`studio.features.${key}.body`)}</p>
                </div>
              ))}
            </div>
            <ButtonLink href="/inscription" size="lg" className="mt-10 h-12 rounded-xl bg-white px-6 text-base text-slate-950 hover:bg-slate-100">
              {t("studio.cta")}
              <ArrowRight />
            </ButtonLink>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur" aria-hidden="true">
            <div className="flex items-center gap-4">
              <div className="relative size-20">
                <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
                  <circle cx="40" cy="40" r="34" className="fill-none stroke-white/10" strokeWidth="8" />
                  <circle cx="40" cy="40" r="34" className="fill-none stroke-emerald-400" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${0.96 * 213.6} 213.6`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">96</span>
              </div>
              <p className="text-sm font-semibold">{t("studio.score")}</p>
            </div>
            <ul className="mt-6 grid gap-3">
              {(t.raw("studio.scoreItems") as string[]).map((item) => (
                <li key={item} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-sm">
                  {item}
                  <CircleCheck className="size-4 text-emerald-400" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Parcours ─── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <Kicker>{t("journey.kicker")}</Kicker>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{t("journey.title")}</h2>
            <ol className="relative mt-10 grid gap-5 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-border">
              {steps.map((step) => (
                <li key={step} className="relative flex items-center gap-4">
                  <span className={cn("relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-background", step === "7" ? "bg-gradient-to-br from-primary to-amber-500 text-white" : "bg-primary text-primary-foreground")}>
                    {step}
                  </span>
                  <span className={cn("text-base", step === "7" && "font-semibold")}>{t(`journey.steps.${step}`)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted-foreground">{t("journey.shortcuts")}</p>
          </div>
          <div className="grid gap-5 rounded-3xl border bg-card p-6 shadow-sm" aria-hidden="true">
            <div className="flex aspect-[2/1] items-center rounded-2xl bg-[#fff8ec] p-5">
              <SvgView svg={logos[2]!} className="h-full w-full" />
            </div>
            <div className="flex gap-2">
              {["#ce1126", "#e9a400", "#3b1d0a", "#fff8ec"].map((color) => (
                <span key={color} className="h-10 flex-1 rounded-lg border border-black/5" style={{ background: color }} />
              ))}
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl leading-none" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Aa
              </span>
              <span className="text-right text-xs text-muted-foreground">
                Playfair Display
                <br />
                Inter
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Publics ─── */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Kicker>{t("personas.kicker")}</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("personas.title")}</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {personas.map(({ key, icon: Icon }) => (
              <li key={key} className="rounded-2xl border bg-card p-5 shadow-xs">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm leading-relaxed">{t(`personas.${key}`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Paiement ─── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-6 rounded-3xl border bg-gradient-to-br from-amber-50 to-orange-50 p-8 md:grid-cols-[auto_1fr_auto] dark:from-amber-950/40 dark:to-orange-950/30">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#ff7900] text-white shadow-lg shadow-orange-500/30">
            <Smartphone className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">{t("payment.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("payment.body")}</p>
          </div>
          <ButtonLink href="/tarifs" variant="outline" size="lg" className="h-11 rounded-xl bg-background px-5">
            {t("payment.cta")}
          </ButtonLink>
        </div>
      </section>

      {/* ─── Appel final ─── */}
      <section className="px-4 pb-20">
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-emerald-700 to-teal-900 px-8 py-14 text-primary-foreground shadow-xl md:px-14">
          <div className="absolute -right-20 -bottom-24 -z-10 size-80 rounded-full bg-amber-400/30 blur-3xl" aria-hidden="true" />
          <div className="absolute top-0 left-0 -z-10 size-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px]" aria-hidden="true" />
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{t("cta.title")}</h2>
              <p className="mt-3 text-pretty opacity-90">{t("cta.body")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/outils/generateur-de-noms" variant="secondary" size="lg" className="h-12 rounded-xl px-6 text-base">
                {t("cta.button")}
              </ButtonLink>
              <ButtonLink href="/inscription" variant="outline" size="lg" className="h-12 rounded-xl border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white">
                {t("cta.secondary")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
