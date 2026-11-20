"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  Cake,
  Check,
  Copy,
  Eye,
  EyeOff,
  Flag,
  GraduationCap,
  Hash,
  Heart,
  ImagePlus,
  Layers,
  Lock,
  Plus,
  Quote,
  Shapes,
  Sparkles,
  Target,
  Trash2,
  Type,
  Unlock,
  Upload,
  UserRound,
  X,
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
import type { ElementKind, PrintZone } from "@/lib/apparel/types";
import type { BrandLogos } from "@/lib/studio/brand";
import { COUNTRIES, getCountry } from "@/lib/studio/countries";
import { ensureFonts } from "@/lib/studio/text";
import { OUTFIT_PRESETS, type OutfitPreset } from "@/lib/apparel/presets-data";
import { useApparel } from "@/stores/apparel";
import { useSessionStore } from "@/stores/session";
import { useApparelEditor } from "./editor";
import type { ToolTabId } from "./tool-rail";
import { cn } from "@/lib/utils";

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

export interface ToolDrawerProps {
  activeTab: ToolTabId | null;
  onClose(): void;
}

export function ToolDrawer({ activeTab, onClose }: Readonly<ToolDrawerProps>) {
  const t = useTranslations("apparel.add");
  const locale = useLocale();
  const userCountry = useSessionStore((s) => s.user?.country);
  const [kitCountry, setKitCountry] = useState(() => getCountry(userCountry).code);

  const { template, canEdit, logos, slogan, brandColors, zone, pickImage, openImageStudio } =
    useApparelEditor();
  const design = useApparel((s) => s.design)!;
  const view = useApparel((s) => s.view);
  const elements = useApparel((s) => s.elements);
  const selection = useApparel((s) => s.selection);

  const zones = useMemo(() => template.zones.filter((z) => z.view === view), [template.zones, view]);

  const isDark = luminance(design.garmentColor) < 0.4;
  const ink =
    brandColors.find((c) => contrastRatio(c, design.garmentColor) >= 3) ?? (isDark ? "#ffffff" : "#111111");

  const availableLogos = LOGO_ORDER.filter((key) => logos[key]);
  const recommendedLogoKey = isDark ? "white" : "color";

  const layers = elements.filter((el) => zones.some((z) => z.key === el.zoneKey)).reverse();

  // Text insertion handler
  const addText = async (kind: TextKind, text?: string) => {
    if (!zone) return;
    const base = createTextElement(kind, zone);
    await ensureFonts([{ fontId: base.content.fontId!, fontWeight: base.content.fontWeight ?? 700 }]);
    useApparel.getState().add(createTextElement(kind, zone, { fill: ink, ...(text ? { text } : {}) }));
  };

  // Celebration kit insertion handler
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

  if (!activeTab) return null;

  const tabTitles: Record<ToolTabId, { title: string; subtitle: string }> = {
    templates: { title: "Modèles Prêts", subtitle: "Styles et combinaisons préconfigurées" },
    zones: { title: "Zones d'Impression", subtitle: `Surfaces personnalisables (${zones.length} zones)` },
    logo: { title: "Logo du Projet", subtitle: "Déclinaisons vectorielles de votre identité" },
    text: { title: "Textes & Lettrages", subtitle: "Typographies sportives et titres" },
    images: { title: "Images & Visuels", subtitle: "Photos, écussons et fichiers PNG" },
    shapes: { title: "Formes & Écussons", subtitle: "Badges, numéros et rayures de sport" },
    celebrations: { title: "T-shirts de Fête", subtitle: "Événements, drapeaux et célébrations" },
    layers: { title: "Calques de la Vue", subtitle: `${layers.length} élément(s) placé(s)` },
  };

  return (
    <aside
      aria-label="Tiroir d'outils de création"
      className="border-border/70 bg-card z-10 flex w-80 shrink-0 flex-col border-r shadow-lg transition-all duration-300"
    >
      {/* Drawer Header */}
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-foreground text-sm font-bold">{tabTitles[activeTab]?.title}</h3>
          <p className="text-muted-foreground text-[11px]">{tabTitles[activeTab]?.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le tiroir"
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center rounded-lg transition"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Drawer Body (Scrollable) */}
      <div className="flex-1 scrollbar-none space-y-4 overflow-y-auto p-4">
        {/* 1. TEMPLATES / MODÈLES */}
        {activeTab === "templates" && (
          <div className="space-y-3">
            <div className="text-muted-foreground text-xs">
              Appliquez une ambiance de design en un clic sur votre support :
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {OUTFIT_PRESETS.map((pst) => (
                <button
                  key={pst.id}
                  type="button"
                  onClick={() => {
                    useApparel.getState().setDesign({
                      garmentColor: pst.color,
                      technique: pst.technique,
                    });
                  }}
                  className="border-border/70 bg-muted/20 hover:bg-muted hover:border-primary/40 flex items-center justify-between rounded-xl border p-3 text-left transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full border shadow-2xs"
                        style={{ backgroundColor: pst.color }}
                      />
                      <span className="text-foreground text-xs font-bold">{pst.name}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{pst.tagline}</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold">Appliquer</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. ZONES D'IMPRESSION */}
        {activeTab === "zones" && (
          <div className="space-y-3">
            <div className="text-muted-foreground text-xs">
              Cliquez sur une zone pour y cibler vos prochains ajouts de textes ou logos :
            </div>
            <div className="grid grid-cols-1 gap-2">
              {zones.map((z) => {
                const isTargeted = zone?.key === z.key;
                return (
                  <button
                    key={z.key}
                    type="button"
                    onClick={() => useApparel.getState().setTargetZone(z.key)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                      isTargeted
                        ? "border-[#0B6B4F] bg-[#0B6B4F]/10 ring-1 ring-[#0B6B4F]"
                        : "border-border/70 bg-card hover:bg-muted/40",
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Target
                          className={cn("size-3.5", isTargeted ? "text-[#0B6B4F]" : "text-muted-foreground")}
                        />
                        <span className="text-foreground text-xs font-bold">{z.label}</span>
                      </div>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {z.maxWidthMm} × {z.maxHeightMm} mm (
                        {z.scaling === "FIXED" ? "Taille fixe" : "Proportionnel"})
                      </span>
                    </div>
                    {isTargeted && (
                      <span className="rounded-full bg-[#0B6B4F] px-2 py-0.5 text-[10px] font-bold text-white">
                        Visée
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. LOGO DU PROJET */}
        {activeTab === "logo" && (
          <div className="space-y-3">
            {availableLogos.length > 0 ? (
              <>
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>Déclinaisons vectorielles :</span>
                  {zone && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Cible : {zone.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availableLogos.map((key) => {
                    const isRecommended = key === recommendedLogoKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!canEdit || !zone}
                        onClick={() => {
                          if (!zone) return;
                          useApparel.getState().add(createLogoElement(logos[key]!, zone, {}));
                        }}
                        className={cn(
                          "group hover:border-primary/50 relative flex flex-col items-center justify-center rounded-xl border p-3 transition hover:scale-102",
                          isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white",
                          !zone && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {isRecommended && (
                          <span className="py-0.2 absolute top-1.5 right-1.5 rounded-full bg-emerald-500/20 px-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
                            Recommandé
                          </span>
                        )}
                        <img
                          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(logos[key]!)}`}
                          alt={`Logo ${key}`}
                          className="h-14 w-full object-contain p-1"
                        />
                        <span className="text-muted-foreground group-hover:text-foreground mt-1 text-[11px] font-medium capitalize">
                          {key}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="border-border/80 bg-muted/20 space-y-3 rounded-2xl border border-dashed p-5 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Sparkles className="size-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-foreground text-xs font-bold">Aucun logo configuré</h4>
                  <p className="text-muted-foreground text-[11px]">
                    Créez un logo avec l&apos;IA dans l&apos;étape Logo ou importez un fichier SVG :
                  </p>
                </div>
                <Button size="sm" onClick={pickImage} className="w-full text-xs">
                  <Upload className="size-3.5" />
                  Importer un logo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 4. TEXTES & TYPOGRAPHIES */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <div className="text-muted-foreground text-xs">
              Insérez un élément textuel dans la zone sélectionnée :
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-16 flex-col justify-center gap-1 rounded-xl"
                onClick={() => addText("TEXT")}
                disabled={!canEdit || !zone}
              >
                <Type className="text-primary size-5" />
                <span className="text-xs font-bold">Texte libre</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col justify-center gap-1 rounded-xl"
                onClick={() => addText("PLAYER_NAME")}
                disabled={!canEdit || !zone}
              >
                <UserRound className="text-primary size-5" />
                <span className="text-xs font-bold">Nom de joueur</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col justify-center gap-1 rounded-xl"
                onClick={() => addText("PLAYER_NUMBER")}
                disabled={!canEdit || !zone}
              >
                <Hash className="text-primary size-5" />
                <span className="text-xs font-bold">Numéro « 10 »</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col justify-center gap-1 rounded-xl"
                onClick={() => slogan && addText("TEXT", slogan)}
                disabled={!canEdit || !zone || !slogan}
              >
                <Quote className="text-primary size-5" />
                <span className="text-xs font-bold">Slogan marque</span>
              </Button>
            </div>

            {/* Typographic style shortcuts */}
            <div className="border-border/50 space-y-2 border-t pt-2">
              <div className="text-foreground text-xs font-semibold">Styles de texte sportifs :</div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "Athletic College", text: "CHAMPIONS", font: "impact" },
                  { label: "Modern Street", text: "CREW 2026", font: "montserrat" },
                  { label: "Classic League", text: "TEAM CAPTAIN", font: "oswald" },
                ].map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    disabled={!canEdit || !zone}
                    onClick={() => addText("TEXT", st.text)}
                    className="border-border/70 hover:bg-muted flex items-center justify-between rounded-xl border p-2.5 text-left transition"
                  >
                    <div>
                      <span className="block text-xs font-black tracking-wider">{st.text}</span>
                      <span className="text-muted-foreground text-[10px]">{st.label}</span>
                    </div>
                    <Plus className="text-muted-foreground size-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. IMAGES & VISUELS */}
        {activeTab === "images" && (
          <div className="space-y-4">
            <div className="text-muted-foreground text-xs">
              Importez des photos ou illustrations transparentes haute résolution :
            </div>

            <Button
              size="lg"
              onClick={pickImage}
              disabled={!canEdit || !zone}
              className="bg-muted/20 text-foreground hover:bg-muted h-20 w-full flex-col gap-1.5 rounded-2xl border-2 border-dashed"
            >
              <ImagePlus className="size-6 text-[#0B6B4F]" />
              <span className="text-xs font-bold">Importer un fichier PNG / JPG</span>
              <span className="text-muted-foreground text-[10px]">300 DPI recommandé · Ctrl+V supporté</span>
            </Button>

            <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600" />
                <span className="text-foreground text-xs font-bold">Atelier Traitement Image Textile</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Détourage haute précision en 1 clic, vectorisation SVG locale, calcul DPI exact et séparation
                des films. Zéro API externe, 100% sécurisé.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={pickImage}
                disabled={!canEdit || !zone}
                className="w-full border-emerald-600/30 text-xs font-medium text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
              >
                <Upload className="mr-1 size-3.5 text-emerald-600" />
                Importer et traiter dans l&apos;Atelier
              </Button>
            </div>

            <div className="border-border/60 bg-muted/30 text-muted-foreground space-y-1 rounded-xl border p-3 text-xs">
              <p className="text-foreground font-semibold">💡 Astuce qualité d&apos;impression</p>
              <p className="text-[11px]">
                Pour les impressions DTF ou flex, privilégiez un fichier PNG avec fond transparent de largeur
                ≥ 2000 px.
              </p>
            </div>
          </div>
        )}

        {/* 6. FORMES & MOTIFS */}
        {activeTab === "shapes" && (
          <div className="space-y-3">
            <div className="text-muted-foreground text-xs">
              Écussons et motifs sportifs à apposer sur les maillots :
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Écusson Étoile", icon: Sparkles },
                { label: "Blason Sport", icon: Shapes },
                { label: "Bande Athlétique", icon: Layers },
                { label: "Badge Capitaine", icon: Target },
              ].map((sh) => {
                const Icon = sh.icon;
                return (
                  <button
                    key={sh.label}
                    type="button"
                    disabled={!canEdit || !zone}
                    onClick={() => addText("TEXT", "★ ★ ★")}
                    className="border-border/70 hover:bg-muted hover:border-primary/40 flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition disabled:opacity-50"
                  >
                    <Icon className="size-6 text-[#0B6B4F]" />
                    <span className="text-xs font-medium">{sh.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. FÊTES & ÉVÉNEMENTS */}
        {activeTab === "celebrations" && (
          <div className="space-y-3">
            <label className="text-foreground grid gap-1 text-xs font-semibold">
              Pays / Bannière :
              <NativeSelect
                value={kitCountry}
                onChange={(e) => setKitCountry(e.target.value)}
                className="h-9 text-xs"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {CELEBRATION_KITS.map((k) => {
                const icons: Record<CelebrationKit, LucideIcon> = {
                  independence: Flag,
                  birthday: Cake,
                  graduation: GraduationCap,
                  team: Heart,
                };
                const Icon = icons[k];
                return (
                  <Button
                    key={k}
                    variant="outline"
                    className="h-16 flex-col justify-center gap-1 rounded-xl text-xs font-bold"
                    onClick={() => addKit(k)}
                    disabled={!canEdit || !zone}
                  >
                    <Icon className="size-5 text-[#0B6B4F]" />
                    <span>{t(`kits.${k}`)}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. CALQUES DE LA VUE */}
        {activeTab === "layers" && (
          <div className="space-y-2">
            {layers.length > 0 ? (
              layers.map((el, index) => {
                const isSelected = selection === el.id;
                const Icon = KIND_ICONS[el.kind] ?? Shapes;

                return (
                  <div
                    key={el.id}
                    onClick={() => useApparel.getState().select(el.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition",
                      isSelected
                        ? "border-[#0B6B4F] bg-[#0B6B4F]/10 ring-1 ring-[#0B6B4F]"
                        : "border-border/70 bg-card hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-[#0B6B4F]" />
                      <span className="max-w-[140px] truncate font-semibold">
                        {el.content.text || el.kind}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          useApparel.getState().arrange(el.id, "forward");
                        }}
                        title="Monter d'un plan"
                        className="hover:text-foreground text-muted-foreground p-1"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          useApparel.getState().arrange(el.id, "backward");
                        }}
                        title="Descendre d'un plan"
                        className="hover:text-foreground text-muted-foreground p-1"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          useApparel.getState().remove(el.id);
                        }}
                        title="Supprimer"
                        className="hover:text-destructive text-muted-foreground p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
                Aucun élément sur cette vue. Utilisez les outils du rail gauche pour en ajouter.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
