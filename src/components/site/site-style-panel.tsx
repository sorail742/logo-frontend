"use client";

import { useTranslations } from "next-intl";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/common/native-select";
import { ButtonLink } from "@/components/common/button-link";
import { FONTS, closestWeight, getFont } from "@/lib/render/fonts";
import { SITE_THEMES, type SiteContent, type SiteFont, type SiteTheme } from "@/lib/render/site";
import { brandStyle } from "@/lib/site-defaults";
import type { Logo, Website } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LabeledField } from "./labeled-field";

const COLOR_KEYS = ["primary", "secondary", "text", "background"] as const;
const HEX = /^#[0-9a-f]{6}$/i;

/** Aperçu miniature d'un thème : bandeau d'accueil, titre et boutons. */
function ThemeSwatch({ theme, colors }: { theme: SiteTheme; colors: SiteContent["colors"] }) {
  const hero = theme === "bold" ? colors.primary : colors.background;
  const ink = theme === "bold" ? "#ffffff" : colors.text;
  return (
    <div className="h-16 overflow-hidden rounded-md border" style={{ background: colors.background }} aria-hidden="true">
      <div className={cn("flex h-10 flex-col justify-center gap-1 px-2", theme === "elegant" && "items-center")} style={{ background: hero }}>
        <span className="block h-1.5 w-12 rounded-full" style={{ background: ink, opacity: 0.85 }} />
        <span
          className={cn("block h-2.5 w-10", theme === "modern" && "rounded-full", theme === "bold" && "rounded")}
          style={{ background: theme === "bold" ? colors.secondary : colors.primary }}
        />
      </div>
      <div className="h-6" style={{ background: theme === "bold" ? "#111827" : colors.background }} />
    </div>
  );
}

function FontPicker({ label, value, onChange }: { label: string; value: SiteFont; onChange: (font: SiteFont) => void }) {
  const t = useTranslations("site.style");
  const font = getFont(value.id);
  return (
    <div className="grid grid-cols-[1fr_6.5rem] gap-2">
      <LabeledField label={label}>
        <NativeSelect value={value.id} onChange={(e) => onChange({ id: e.target.value, weight: closestWeight(e.target.value, value.weight) })}>
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </NativeSelect>
      </LabeledField>
      <LabeledField label={t("weight")}>
        <NativeSelect value={String(value.weight)} onChange={(e) => onChange({ ...value, weight: Number(e.target.value) })}>
          {font.weights.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </NativeSelect>
      </LabeledField>
    </div>
  );
}

/** Onglet « Style » : thème, couleurs, polices, langue de l'interface, logo affiché, mention. */
export function SiteStylePanel({
  content,
  onChange,
  website,
  logos,
  onLogoChange,
  disabled,
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
  website: Website;
  logos: Logo[];
  onLogoChange: (logoId: string | null) => void;
  disabled: boolean;
}) {
  const t = useTranslations("site.style");
  const tp = useTranslations("site.publish");
  const set = (patch: Partial<SiteContent>) => onChange({ ...content, ...patch });
  const displayed = logos.find((l) => l.id === website.displayedLogoId);
  const spec = displayed?.current?.spec;

  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("theme")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {SITE_THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              aria-pressed={content.theme === theme}
              onClick={() => set({ theme })}
              className={cn(
                "grid gap-1.5 rounded-lg border-2 p-2 text-left transition",
                content.theme === theme ? "border-primary" : "border-transparent bg-muted/50 hover:border-muted-foreground/30",
              )}
            >
              <ThemeSwatch theme={theme} colors={content.colors} />
              <span className="flex items-center gap-1 text-sm font-medium">
                {content.theme === theme && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                {t(`themes.${theme}`)}
              </span>
              <span className="text-xs leading-snug text-muted-foreground">{t(`themeHints.${theme}`)}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t("colors")}</CardTitle>
          {spec && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                set(brandStyle(spec));
                toast.success(t("fromLogoDone"));
              }}
            >
              <Palette /> {t("fromLogo")}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {COLOR_KEYS.map((key) => (
            <LabeledField key={key} label={t(key)}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content.colors[key]}
                  aria-label={t(key)}
                  onChange={(e) => set({ colors: { ...content.colors, [key]: e.target.value } })}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
                />
                <Input
                  defaultValue={content.colors[key]}
                  key={content.colors[key]}
                  maxLength={7}
                  className="font-mono"
                  onBlur={(e) => {
                    if (HEX.test(e.target.value)) set({ colors: { ...content.colors, [key]: e.target.value.toLowerCase() } });
                  }}
                />
              </div>
            </LabeledField>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("fonts")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <FontPicker label={t("heading")} value={content.fonts.heading} onChange={(heading) => set({ fonts: { ...content.fonts, heading } })} />
          <FontPicker label={t("body")} value={content.fonts.body} onChange={(body) => set({ fonts: { ...content.fonts, body } })} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-4">
          <LabeledField label={t("logo")}>
            <NativeSelect value={website.logoId ?? ""} onChange={(e) => onLogoChange(e.target.value || null)}>
              <option value="">{t("logoAuto")}</option>
              {logos.map((logo, index) => (
                <option key={logo.id} value={logo.id}>
                  {t("logoNumber", { number: logos.length - index })}
                  {logo.isFavorite ? " ★" : ""}
                </option>
              ))}
            </NativeSelect>
          </LabeledField>
          <LabeledField label={t("language")} hint={t("languageHint")}>
            <NativeSelect value={content.language} onChange={(e) => set({ language: e.target.value as SiteContent["language"] })}>
              {(["fr", "en"] as const).map((language) => (
                <option key={language} value={language}>
                  {t(`languages.${language}`)}
                </option>
              ))}
            </NativeSelect>
          </LabeledField>
          <div className="grid gap-1">
            <label className="flex items-center justify-between gap-3 text-sm">
              {t("credit")}
              <Switch
                checked={content.credit || website.free}
                disabled={disabled || website.free}
                onCheckedChange={(credit) => set({ credit })}
              />
            </label>
            {website.free && (
              <p className="text-xs text-muted-foreground">
                {t("creditFree")}{" "}
                <ButtonLink href="/app/facturation" variant="link" size="xs" className="h-auto p-0">
                  {tp("upgrade")}
                </ButtonLink>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </fieldset>
  );
}
