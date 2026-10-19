"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Ban, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SvgView } from "@/components/brand/svg-view";
import { LogoMockups } from "@/components/logos/logo-mockups";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { readableOn } from "@/lib/render/color";
import { cssFontFamily } from "@/lib/render/fonts";
import { renderLogoSvg } from "@/lib/render/logo";
import { renderStampSvg } from "@/lib/render/stamp";
import type { StampData } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t py-8 first:border-0">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function CharterContent() {
  const t = useTranslations("kit");
  const version = Number(useSearchParams().get("v"));
  const { project, pid } = useProject();
  const { data: kits = [] } = useQuery({ queryKey: qk.brandKits(pid), queryFn: () => api.brandKits.list(pid) });
  const { data: signatures = [] } = useQuery({ queryKey: qk.signatures(pid), queryFn: () => api.signatures.list(pid) });
  const kit = kits.find((k) => k.version === version) ?? kits[0];

  if (!kit?.logoSpec || !project) return <p className="text-sm text-muted-foreground">{t("charter.notReady")}</p>;
  const spec = kit.logoSpec;
  const name = project.chosenName?.value ?? project.title;
  const stamp = signatures.find((s) => s.kind === "STAMP" && s.status === "ACTIVE");
  const main = renderLogoSvg(spec, { withBackground: false }).svg;

  return (
    <article className="mx-auto max-w-3xl bg-white text-neutral-900 print:max-w-none">
      <div className="no-print mb-6 flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer />
          {t("charter.print")}
        </Button>
      </div>

      <header className="flex min-h-[60vh] flex-col justify-center gap-6 rounded-xl p-10 print:min-h-[90vh]" style={{ background: spec.colors.primary, color: readableOn(spec.colors.primary) }}>
        <SvgView svg={renderLogoSvg(spec, { variant: readableOn(spec.colors.primary) === "#ffffff" ? "white" : "black", withBackground: false }).svg} className="h-40 justify-start" />
        <div>
          <p className="text-sm uppercase tracking-widest opacity-80">{t("charter.title")}</p>
          <p className="text-4xl font-semibold">{name}</p>
          <p className="mt-2 opacity-80">{t("version", { version: kit.version })}</p>
        </div>
      </header>

      <div className="px-2 py-6">
        <p className="text-lg">{t("charter.intro", { name })}</p>

        <Section title={t("charter.origin")}>
          <p className="text-2xl font-semibold">{name}</p>
          {project.chosenName?.acronym && project.chosenName.acronym !== name && <p>{project.chosenName.acronym}</p>}
          <p className="mt-2 text-neutral-700">{project.chosenName?.meaning ?? "—"}</p>
          {kit.slogan && <p className="mt-4 text-lg italic">« {kit.slogan} »</p>}
        </Section>

        <Section title={t("charter.logo")}>
          <SvgView svg={main} className="bg-checker aspect-[2/1] rounded-lg p-8" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <SvgView svg={renderLogoSvg(spec, { variant: "black" }).svg} className="aspect-[3/2] rounded-lg border p-3" />
            <SvgView svg={renderLogoSvg(spec, { variant: "white", withBackground: false }).svg} className="aspect-[3/2] rounded-lg bg-neutral-900 p-3" />
            <SvgView svg={renderLogoSvg(spec, { layout: "icon" }).svg} className="aspect-[3/2] rounded-lg border p-3" />
          </div>
        </Section>

        <Section title={t("charter.clearSpace")}>
          <div className="relative mx-auto w-3/4 border-2 border-dashed border-sky-400 p-[8%]">
            <SvgView svg={main} className="outline-1 outline-sky-300" />
          </div>
          <p className="mt-4 text-neutral-700">{t("charter.clearSpaceBody")}</p>
        </Section>

        <Section title={t("charter.minSize")}>
          <div className="flex items-end gap-6">
            <SvgView svg={main} className="w-[120px]" />
            <SvgView svg={renderLogoSvg(spec, { layout: "icon" }).svg} className="w-4" />
          </div>
          <p className="mt-4 text-neutral-700">{t("charter.minSizeBody")}</p>
        </Section>

        <Section title={t("charter.forbidden")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(
              [
                ["stretch", "scale-x-150"],
                ["rotate", "rotate-12"],
                ["contrast", "opacity-30"],
                ["colors", "hue-rotate-180"],
                ["effects", "drop-shadow-[4px_4px_2px_rgba(0,0,0,0.6)]"],
              ] as const
            ).map(([key, effect]) => (
              <figure key={key} className="grid gap-2">
                <div className="relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-lg border p-4">
                  <SvgView svg={main} className={`w-2/3 ${effect}`} />
                  <Ban className="absolute top-2 right-2 size-5 text-red-600" aria-hidden="true" />
                </div>
                <figcaption className="text-sm">{t(`charter.forbiddenItems.${key}`)}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section title={t("charter.colors")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kit.palette.map((color) => (
              <div key={color.role} className="overflow-hidden rounded-lg border">
                <div className="h-20" style={{ background: color.hex }} />
                <div className="p-2 text-xs">
                  <p className="font-medium">{t(`colorRoles.${color.role}` as "colorRoles.primary")}</p>
                  <p className="font-mono">HEX {color.hex}</p>
                  <p className="font-mono">RGB {color.rgb}</p>
                  <p className="font-mono">CMJN {color.cmyk}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("charter.typography")}>
          {kit.fonts.map((font) => (
            <div key={font.id} className="mb-4">
              <p className="text-3xl" style={{ fontFamily: cssFontFamily(font.id) }}>
                {font.name}
              </p>
              <p style={{ fontFamily: cssFontFamily(font.id) }}>Aa Bb Cc 0123456789 — éèàçô</p>
              <p className="text-xs text-neutral-600">{font.license}</p>
            </div>
          ))}
        </Section>

        <Section title={t("charter.signatures")}>
          {kit.slogan && <p className="mb-4 text-lg italic">« {kit.slogan} »</p>}
          {stamp && <SvgView svg={renderStampSvg(stamp.data as StampData, { idPrefix: "charter-stamp" })} className="w-48" />}
        </Section>

        <Section title={t("charter.examples")}>
          <LogoMockups spec={spec} />
        </Section>
      </div>
    </article>
  );
}

export default function CharterPage() {
  return (
    <Suspense>
      <CharterContent />
    </Suspense>
  );
}
