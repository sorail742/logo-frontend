"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  Cake,
  Flag,
  GraduationCap,
  Hash,
  Heart,
  ImagePlus,
  Quote,
  Shapes,
  Trash2,
  Type,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/common/native-select";
import { contrastRatio, luminance } from "@/lib/render/color";
import {
  CELEBRATION_KITS,
  KIT_FONTS,
  celebrationKit,
  type CelebrationKit,
  type KitCopy,
} from "@/lib/apparel/celebrations";
import { createLogoElement, createTextElement, type TextKind } from "@/lib/apparel/elements";
import type { ElementKind } from "@/lib/apparel/types";
import type { BrandLogos } from "@/lib/studio/brand";
import { COUNTRIES, getCountry } from "@/lib/studio/countries";
import { ensureFonts } from "@/lib/studio/text";
import { cn } from "@/lib/utils";
import { useApparel } from "@/stores/apparel";
import { useSessionStore } from "@/stores/session";
import { useApparelEditor } from "./editor";

// Panneau d'ajout : zone visée, logos du projet, textes (nom, numéro, slogan), image importée,
// puis calques de la vue.

const KIND_ICONS: Record<ElementKind, LucideIcon> = {
  LOGO: Shapes,
  SPONSOR: Shapes,
  TEXT: Type,
  PLAYER_NAME: UserRound,
  PLAYER_NUMBER: Hash,
  IMAGE: ImagePlus,
  PATTERN: Shapes,
};

const LOGO_ORDER: (keyof BrandLogos)[] = ["color", "white", "black", "icon", "horizontal", "vertical"];

const KIT_ICONS: Record<CelebrationKit, LucideIcon> = {
  independence: Flag,
  birthday: Cake,
  graduation: GraduationCap,
  team: Heart,
};

const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function AddPanel() {
  const t = useTranslations("apparel.add");
  const tv = useTranslations("apparel");
  const locale = useLocale();
  const userCountry = useSessionStore((s) => s.user?.country);
  const [kitCountry, setKitCountry] = useState(() => getCountry(userCountry).code);
  const { template, canEdit, logos, slogan, brandColors, zone, pickImage } = useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const view = useApparel((s) => s.view);
  const elements = useApparel((s) => s.elements);
  const selection = useApparel((s) => s.selection);
  const zones = template.zones.filter((z) => z.view === view);
  const zoneLabel = new Map(template.zones.map((z) => [z.key, z.label]));
  const dark = luminance(design.garmentColor) < 0.4;
  // Encre lisible sur le tissu : couleur de la marque si le contraste suffit, sinon blanc ou noir.
  const ink =
    brandColors.find((c) => contrastRatio(c, design.garmentColor) >= 3) ?? (dark ? "#ffffff" : "#111111");
  const available = LOGO_ORDER.filter((key) => logos[key]);
  const recommended = dark ? "white" : "color";
  const layers = elements.filter((el) => zones.some((z) => z.key === el.zoneKey)).reverse();
  const disabled = !canEdit || !zone;

  const addText = async (kind: TextKind, text?: string) => {
    if (!zone) return;
    const base = createTextElement(kind, zone);
    await ensureFonts([{ fontId: base.content.fontId!, fontWeight: base.content.fontWeight ?? 700 }]);
    useApparel.getState().add(createTextElement(kind, zone, { fill: ink, ...(text ? { text } : {}) }));
  };

  // T-shirt de fête : éléments ordinaires (modifiables un à un), ajoutés en une seule étape.
  const addKit = async (kit: CelebrationKit) => {
    if (!zone) return;
    await ensureFonts(KIT_FONTS);
    const second = brandColors.find((c) => c.toLowerCase() !== ink.toLowerCase()) ?? ink;
    const kitElements = celebrationKit(
      {
        kit,
        ink,
        second,
        locale,
        garment: design.garmentColor,
        country: kitCountry,
        copy: t.raw("kitCopy") as KitCopy,
      },
      zone,
    );
    const store = useApparel.getState();
    store.change((current) => [...current, ...kitElements]);
    store.select(kitElements[0]?.id ?? null);
  };

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return COUNTRIES.map((c) => ({ code: c.code, name: names.of(c.code) ?? c.code })).sort((a, b) =>
      a.name.localeCompare(b.name, locale),
    );
  }, [locale]);

  const addLogo = (key: keyof BrandLogos) => {
    const svg = logos[key];
    if (!svg || !zone) return;
    useApparel.getState().add(createLogoElement(svg, zone, { logoVariant: key, source: "library" }));
  };

  return (
    <div className="grid gap-5">
      <section className="grid gap-2" aria-labelledby="apparel-zone">
        <h2 id="apparel-zone" className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("zone")}
        </h2>
        <div className="grid gap-1">
          {zones.map((z) => (
            <button
              key={z.key}
              type="button"
              aria-pressed={zone?.key === z.key}
              onClick={() => useApparel.getState().setTargetZone(z.key)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition",
                zone?.key === z.key ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted",
              )}
            >
              <span className="truncate font-medium">{z.label}</span>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                {z.maxWidthMm} × {z.maxHeightMm}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-2" aria-labelledby="apparel-logos">
        <h2
          id="apparel-logos"
          className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
        >
          {t("logo")}
        </h2>
        {available.length ? (
          <div className="grid grid-cols-3 gap-1.5">
            {available.map((key) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => addLogo(key)}
                className="group hover:border-primary relative flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-1.5 transition disabled:opacity-50"
                style={{ background: design.garmentColor }}
                title={t(`variants.${key}`)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG du logo en data URL */}
                <img
                  src={svgSrc(logos[key]!)}
                  alt={t(`variants.${key}`)}
                  className="max-h-[70%] max-w-full object-contain"
                />
                {key === recommended && (
                  <span className="bg-primary text-primary-foreground absolute top-1 right-1 rounded-full px-1 text-[9px] font-semibold">
                    {t("recommended")}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="bg-muted/60 text-muted-foreground rounded-lg p-2.5 text-xs">{t("noLogo")}</p>
        )}
      </section>

      <section className="grid gap-2" aria-labelledby="apparel-texts">
        <h2
          id="apparel-texts"
          className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
        >
          {t("texts")}
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => void addText("TEXT")}>
            <Type />
            {t("text")}
          </Button>
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => void addText("PLAYER_NAME")}>
            <UserRound />
            {t("name")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => void addText("PLAYER_NUMBER")}
          >
            <Hash />
            {t("number")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !slogan}
            onClick={() => slogan && void addText("TEXT", slogan)}
            title={slogan ?? t("noSlogan")}
          >
            <Quote />
            {t("slogan")}
          </Button>
        </div>
      </section>

      <section className="grid min-w-0 gap-2" aria-labelledby="apparel-kits">
        <h2 id="apparel-kits" className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("kits")}
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          {CELEBRATION_KITS.map((kit) => {
            const Icon = KIT_ICONS[kit];
            return (
              <Button
                key={kit}
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => void addKit(kit)}
                className="min-w-0"
              >
                <Icon />
                <span className="truncate">{t(`kitNames.${kit}`)}</span>
              </Button>
            );
          })}
        </div>
        <NativeSelect
          aria-label={t("kitCountry")}
          title={t("kitCountry")}
          value={kitCountry}
          onChange={(e) => setKitCountry(e.target.value)}
          className="h-8 min-w-0 text-xs"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <p className="text-muted-foreground text-[11px]">{t("kitsHint")}</p>
      </section>

      <section className="grid gap-2" aria-labelledby="apparel-image">
        <h2
          id="apparel-image"
          className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
        >
          {t("image")}
        </h2>
        <Button variant="outline" size="sm" disabled={disabled} onClick={pickImage}>
          <ImagePlus />
          {t("upload")}
        </Button>
        <p className="text-muted-foreground text-[11px]">{t("imageHint")}</p>
      </section>

      <section className="grid gap-2" aria-labelledby="apparel-layers">
        <h2
          id="apparel-layers"
          className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
        >
          {t("layers", { view: tv(`views.${view}`) })}
        </h2>
        {layers.length ? (
          <ul className="grid grid-cols-1 gap-1">
            {layers.map((el) => {
              const Icon = KIND_ICONS[el.kind];
              const label = el.content.text ?? tv(`kinds.${el.kind}`);
              return (
                <li key={el.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs",
                      selection === el.id ? "border-primary bg-primary/5" : "hover:bg-muted",
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => useApparel.getState().select(el.id)}
                    >
                      <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{label}</span>
                        <span className="text-muted-foreground block truncate text-[10px]">
                          {zoneLabel.get(el.zoneKey)}
                        </span>
                      </span>
                    </button>
                    {canEdit && (
                      <span className="flex shrink-0 opacity-60 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => useApparel.getState().arrange(el.id, "forward")}
                          aria-label={t("forward")}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => useApparel.getState().arrange(el.id, "backward")}
                          aria-label={t("backward")}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => useApparel.getState().remove(el.id)}
                          aria-label={t("remove")}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">{t("noLayers")}</p>
        )}
      </section>
    </div>
  );
}
