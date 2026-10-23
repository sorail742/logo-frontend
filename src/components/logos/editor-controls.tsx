"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { contrastRatio } from "@/lib/render/color";
import { getFont, LOGO_FONTS, PULAR_FONTS } from "@/lib/render/fonts";
import { FontCoverageNotice } from "@/components/studio/font-coverage";
import { ICONS, searchIcons, type IconNode } from "@/lib/render/icons";
import { LOGO_TYPES, type IconFrame, type LogoLayout, type LogoSpec } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLogoEditor } from "@/stores/logo-editor";

function IconGlyph({ node }: Readonly<{ node: IconNode }>) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {node.map(([tag, attrs]) => {
        const Tag = tag as "path";
        const { key, ...props } = attrs as Record<string, string>;
        return <Tag key={key ?? `${tag}-${JSON.stringify(props)}`} {...props} />;
      })}
    </svg>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="grid gap-3 border-b pb-4 last:border-0">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function EditorControls({ spec }: Readonly<{ spec: LogoSpec }>) {
  const t = useTranslations("logos");
  const tc = useTranslations("common");
  const update = useLogoEditor((s) => s.update);
  const updateColors = useLogoEditor((s) => s.updateColors);
  const [iconQuery, setIconQuery] = useState("");
  const icons = useMemo(() => (iconQuery ? searchIcons(iconQuery) : ICONS), [iconQuery]);
  const font = getFont(spec.fontId);
  const ratio = contrastRatio(spec.colors.text, spec.colors.background);

  return (
    <div className="grid gap-4">
      <Section title={t("editor.text")}>
        <Field label={t("editor.name")} htmlFor="logo-text">
          <Input id="logo-text" value={spec.text} maxLength={40} onChange={(e) => update({ text: e.target.value }, true)} />
        </Field>
        <Field label={t("editor.tagline")} htmlFor="logo-tagline">
          <Input id="logo-tagline" value={spec.tagline} maxLength={60} onChange={(e) => update({ tagline: e.target.value }, true)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("editor.font")} htmlFor="logo-font">
            <NativeSelect id="logo-font" value={spec.fontId} onChange={(e) => update({ fontId: e.target.value })}>
              {(["sans", "serif", "display"] as const).map((category) => (
                <optgroup key={category} label={tc(`fontCategories.${category}`)}>
                  {LOGO_FONTS.filter((f) => f.category === category).map((f) => (
                    <option key={f.id} value={f.id}>
                      {PULAR_FONTS.has(f.id) ? `${f.name} · ɓɗƴ` : f.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("editor.weight")} htmlFor="logo-weight">
            <NativeSelect id="logo-weight" value={spec.fontWeight} onChange={(e) => update({ fontWeight: Number(e.target.value) })}>
              {font.weights.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <FontCoverageNotice text={spec.text} fontId={spec.fontId} />
        <Field label={`${t("editor.letterSpacing")} (${spec.letterSpacing.toFixed(2)} em)`}>
          <Slider
            min={-0.05}
            max={0.3}
            step={0.01}
            value={[spec.letterSpacing]}
            onValueChange={(value) => update({ letterSpacing: Array.isArray(value) ? value[0]! : (value as number) }, true)}
            aria-label={t("editor.letterSpacing")}
          />
        </Field>
        <label className="flex items-center justify-between text-sm">
          {t("editor.uppercase")}
          <Switch checked={spec.uppercase} onCheckedChange={(checked) => update({ uppercase: checked })} />
        </label>
      </Section>

      <Section title={t("editor.colors")}>
        <div className="grid grid-cols-2 gap-3">
          {(["primary", "secondary", "text", "background"] as const).map((key) => (
            <label key={key} className="grid grid-cols-[auto_1fr] items-center gap-x-2 rounded-lg border p-1.5 text-sm">
              <input
                type="color"
                value={spec.colors[key]}
                onChange={(e) => updateColors({ [key]: e.target.value }, true)}
                className="row-span-2 size-7 cursor-pointer rounded border-0 bg-transparent"
              />
              <span className="text-xs">{t(`editor.${key === "text" ? "textColor" : key}`)}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{spec.colors[key].toUpperCase()}</span>
            </label>
          ))}
        </div>
        <p className={cn("flex items-start gap-1.5 text-xs", ratio < 4.5 ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
          {ratio < 4.5 && <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />}
          {ratio < 4.5 ? t("editor.contrastLow") : t("editor.contrast", { ratio: ratio.toFixed(1) })}
        </p>
      </Section>

      <Section title={t("editor.icon")}>
        <Input value={iconQuery} onChange={(e) => setIconQuery(e.target.value)} placeholder={t("editor.iconSearch")} aria-label={t("editor.iconSearch")} />
        <fieldset className="grid max-h-44 grid-cols-6 gap-1 overflow-y-auto">
          <legend className="sr-only">{t("editor.icon")}</legend>
          <button
            type="button"
            aria-pressed={!spec.iconId}
            onClick={() => update({ iconId: null })}
            className={cn("flex aspect-square items-center justify-center rounded-md border text-xs font-semibold", !spec.iconId ? "border-primary bg-accent" : "hover:bg-muted")}
            title={t("editor.iconNone")}
          >
            Aa
          </button>
          {icons.map((icon) => (
            <button
              key={icon.id}
              type="button"
              aria-pressed={spec.iconId === icon.id}
              onClick={() => update({ iconId: icon.id, type: spec.type === "MONOGRAM" || spec.type === "WORDMARK" ? "ICON_TEXT" : spec.type })}
              className={cn("flex aspect-square items-center justify-center rounded-md border", spec.iconId === icon.id ? "border-primary bg-accent" : "hover:bg-muted")}
              title={icon.id}
            >
              <IconGlyph node={icon.node} />
            </button>
          ))}
        </fieldset>
        <Field label={`${t("editor.iconScale")} (${Math.round(spec.iconScale * 100)} %)`}>
          <Slider
            min={0.5}
            max={1.5}
            step={0.05}
            value={[spec.iconScale]}
            onValueChange={(value) => update({ iconScale: Array.isArray(value) ? value[0]! : (value as number) }, true)}
            aria-label={t("editor.iconScale")}
          />
        </Field>
        <Field label={t("editor.frame")} htmlFor="logo-frame">
          <NativeSelect id="logo-frame" value={spec.iconFrame} onChange={(e) => update({ iconFrame: e.target.value as IconFrame })}>
            {(["none", "circle", "rounded", "hexagon"] as const).map((frame) => (
              <option key={frame} value={frame}>
                {t(`editor.frames.${frame}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </Section>

      <Section title={t("editor.layout")}>
        <div className="grid grid-cols-2 gap-2">
          {(["horizontal", "vertical", "icon", "text"] as LogoLayout[]).map((layout) => (
            <button
              key={layout}
              type="button"
              aria-pressed={spec.layout === layout}
              onClick={() => update({ layout, type: layout === "text" ? "WORDMARK" : spec.type === "WORDMARK" ? "ICON_TEXT" : spec.type })}
              className={cn("rounded-lg border px-3 py-2 text-sm", spec.layout === layout ? "border-primary bg-accent font-medium" : "hover:bg-muted")}
            >
              {t(`editor.layouts.${layout}`)}
            </button>
          ))}
        </div>
        <Field label={t("editor.logoType")} htmlFor="logo-type">
          <NativeSelect id="logo-type" value={spec.type} onChange={(e) => update({ type: e.target.value as LogoSpec["type"] })}>
            {LOGO_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </Section>
      <p className="text-xs text-muted-foreground">{t("editor.license")}</p>
    </div>
  );
}
