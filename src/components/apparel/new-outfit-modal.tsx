"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Copy, Layers, Palette, Shirt, Sparkles, Wand2, X } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useProject } from "@/hooks/use-project";
import { useApiErrorToast } from "@/hooks/use-api-error";
import type {
  ApparelDesignSummary,
  ApparelTemplate,
  PrintTechnique,
  ProductCategory,
} from "@/lib/apparel/types";
import { GARMENT_METADATA } from "@/lib/apparel/templates-data";
import { PRINT_TECHNIQUES_META } from "@/lib/apparel/techniques-data";
import { evaluateTextileContrast } from "@/lib/apparel/contrast";
import { OUTFIT_PRESETS, generateSurpriseCombos, type OutfitPreset } from "@/lib/apparel/presets-data";
import { fireLightConfetti } from "@/lib/apparel/confetti";
import { GarmentPicker } from "./garment-picker";
import { ColorPicker } from "./color-picker";
import { PrintTechniquePicker } from "./print-technique-picker";
import { OutfitOptionsStep, type OutfitCut } from "./outfit-options-step";
import { LiveGarmentPreview } from "./live-garment-preview";
import { useBrandLogos } from "@/components/studio/editor";
import { cn } from "@/lib/utils";

export type OutfitModalMode = "CUSTOM" | "PRESETS" | "SURPRISE" | "DUPLICATE";
export type OutfitStep = 1 | 2 | 3 | 4;

export interface NewOutfitModalProps {
  templates: ApparelTemplate[];
  initialTemplateId?: string;
  onClose(): void;
}

export function NewOutfitModal({ templates, initialTemplateId, onClose }: Readonly<NewOutfitModalProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const { pid } = useProject();

  // Load project's logos and brand kit for live pre-rendering & branding
  const logosQuery = useQuery({
    queryKey: qk.logos(pid),
    queryFn: () => api.logos.list(pid),
  });
  const mainLogo = logosQuery.data?.find((l) => l.isFavorite) ?? logosQuery.data?.[0];
  const brandLogos = useBrandLogos(mainLogo?.id);

  const brandKitsQuery = useQuery({
    queryKey: qk.brandKits(pid),
    queryFn: () => api.brandKits.list(pid),
  });
  const currentBrandKit = brandKitsQuery.data?.[0];
  const brandColors = useMemo<string[]>(() => {
    if (currentBrandKit?.palette?.length) {
      return currentBrandKit.palette.map((p) => p.hex);
    }
    return ["#0D6E5F", "#1D4ED8", "#EAB308"];
  }, [currentBrandKit]);

  // Existing outfits for duplication tab
  const existingOutfitsQuery = useQuery({
    queryKey: qk.apparel(pid),
    queryFn: () => api.apparel.list(pid),
  });

  // Modal navigation & mode states
  const [mode, setMode] = useState<OutfitModalMode>("CUSTOM");
  const [step, setStep] = useState<OutfitStep>(1);

  // Form State
  const defaultTpl = templates.find((t) => t.id === initialTemplateId) ?? templates[0];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId ?? templates[0]?.id ?? "tpl-tshirt",
  );
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? defaultTpl,
    [templates, selectedTemplateId, defaultTpl],
  );

  const [color, setColor] = useState<string>(brandColors[0] ?? "#FFFFFF");
  const [technique, setTechnique] = useState<PrintTechnique>("DTF");
  const [name, setName] = useState<string>("");
  const [cut, setCut] = useState<OutfitCut>("UNISEX");
  const [quantities, setQuantities] = useState<Record<string, number>>({
    M: 10,
    L: 10,
    XL: 5,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Suggested title based on template
  const defaultTitle = selectedTemplate?.name ?? "Tenue";

  // Contrast check between selected fabric color and brand logo
  const contrastCheck = useMemo(() => {
    // Check contrast of black/dark or white logo against garment
    const darkRatio = evaluateTextileContrast("#000000", color);
    const lightRatio = evaluateTextileContrast("#FFFFFF", color);

    if (darkRatio.ratio < 3.0 && lightRatio.ratio > 4.5) {
      return {
        ratio: darkRatio.ratio,
        message: "Faible contraste détecté sur ce tissu",
        suggestion:
          "Un tissu sombre nécessite un logo ou marquage blanc/clair pour rester parfaitement lisible.",
      };
    }
    return null;
  }, [color]);

  // Handle template selection
  const handleSelectTemplate = (tpl: ApparelTemplate) => {
    setSelectedTemplateId(tpl.id);
    setIsDirty(true);
    // Suggest optimal technique for this garment
    if (tpl.category === "FOOTBALL_JERSEY" || tpl.category === "BASKETBALL_JERSEY") {
      setTechnique("HEAT_TRANSFER_VINYL");
    } else if (tpl.category === "POLO") {
      setTechnique("EMBROIDERY");
    } else {
      setTechnique("DTF");
    }
  };

  // Handle Preset application
  const handleApplyPreset = (preset: OutfitPreset) => {
    setSelectedTemplateId(preset.templateId);
    setColor(preset.color);
    setTechnique(preset.technique);
    setName(preset.suggestedName);
    setIsDirty(true);
    setMode("CUSTOM");
    setStep(4); // Jump to options/confirm
    toast.success(`Modèle « ${preset.name} » appliqué`);
  };

  // Handle Duplication
  const handleDuplicateOutfit = (outfit: ApparelDesignSummary) => {
    setSelectedTemplateId(outfit.templateId);
    setColor(outfit.garmentColor);
    setTechnique(outfit.technique);
    setName(`${outfit.name} (Copie)`);
    setIsDirty(true);
    setMode("CUSTOM");
    setStep(4);
    toast.success(`Configuration de « ${outfit.name} » dupliquée`);
  };

  // Surprise Me AI Combos
  const surpriseCombos = useMemo(() => generateSurpriseCombos(brandColors), [brandColors]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      api.apparel.create(pid, {
        templateId: selectedTemplateId,
        name: (name.trim() || defaultTitle).slice(0, 120),
        technique,
        garmentColor: color,
      }),
    onSuccess: (design) => {
      fireLightConfetti(0.5, 0.4);
      toast.success("Tenue créée avec succès !", {
        description: "Redirection vers l'atelier textile...",
      });
      void queryClient.invalidateQueries({ queryKey: qk.apparel(pid) });
      setTimeout(() => {
        onClose();
        router.push(`/textile/${design.id}`);
      }, 700);
    },
    onError,
  });

  // Safe Close handler
  const handleSafeClose = () => {
    if (isDirty && !createMutation.isPending) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // Keyboard navigation (Escape = Close, Left/Right = Steps)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSafeClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty]);

  const stepTitles = [
    { num: 1, title: "Support", desc: "Choix du vêtement" },
    { num: 2, title: "Couleur", desc: "Teinte du tissu" },
    { num: 3, title: "Technique", desc: "Marquage & rendu" },
    { num: 4, title: "Nom & Tailles", desc: "Options finales" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Créer une nouvelle tenue textile"
      className="animate-in fade-in-0 fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 backdrop-blur-md duration-200 sm:p-4"
    >
      {/* Confirmation Dialog on exit */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="border-border bg-card w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl">
            <h4 className="text-foreground text-base font-bold">Quitter la création ?</h4>
            <p className="text-muted-foreground text-xs">
              Vous avez des modifications en cours. Si vous fermez maintenant, vos choix ne seront pas
              enregistrés.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="border-border/80 text-foreground hover:bg-muted rounded-xl border px-3.5 py-2 text-xs font-semibold"
              >
                Continuer la création
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl px-3.5 py-2 text-xs font-semibold"
              >
                Quitter sans sauver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Fullscreen / Max-width Modal Frame */}
      <div className="border-border/80 bg-background flex h-[95vh] max-h-[920px] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border shadow-2xl">
        {/* Header Bar */}
        <header className="border-border/70 bg-card/80 flex flex-wrap items-center justify-between border-b px-6 py-3.5 backdrop-blur-md">
          {/* Title & Brand Badge */}
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0D6E5F] to-emerald-600 text-white shadow-sm">
              <Shirt className="size-5" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-bold tracking-tight sm:text-lg">
                Nouvelle tenue textile
              </h2>
              <p className="text-muted-foreground hidden text-xs sm:block">
                Configurez le vêtement, sa couleur et sa technique de marquage en direct.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bg-muted/60 flex items-center gap-1 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode("CUSTOM")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all select-none",
                mode === "CUSTOM"
                  ? "bg-[#0B6B4F] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sur-mesure
            </button>
            <button
              type="button"
              onClick={() => setMode("PRESETS")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all select-none",
                mode === "PRESETS"
                  ? "bg-[#0B6B4F] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Modèles prêts
            </button>
            <button
              type="button"
              onClick={() => setMode("SURPRISE")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all select-none",
                mode === "SURPRISE"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-amber-700 hover:text-amber-800 dark:text-amber-400",
              )}
            >
              <Sparkles className="size-3" />
              <span>Surprends-moi</span>
            </button>
            {existingOutfitsQuery.data && existingOutfitsQuery.data.length > 0 && (
              <button
                type="button"
                onClick={() => setMode("DUPLICATE")}
                className={cn(
                  "hidden items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all select-none sm:flex",
                  mode === "DUPLICATE"
                    ? "bg-[#0B6B4F] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Copy className="size-3" />
                <span>Dupliquer</span>
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleSafeClose}
            aria-label="Fermer le configurateur"
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary flex size-9 items-center justify-center rounded-xl transition focus-visible:ring-2"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* 2-Column Body */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Column (55% / 7 cols) : Steps & Controls */}
          <div className="border-border/70 flex flex-col border-b lg:col-span-7 lg:border-r lg:border-b-0">
            {/* Stepper Progress Bar (only in CUSTOM mode) */}
            {mode === "CUSTOM" && (
              <div className="border-border/60 bg-muted/20 border-b px-6 py-2.5">
                <div className="flex items-center justify-between">
                  {stepTitles.map((st, idx) => {
                    const isDone = step > st.num;
                    const isCurrent = step === st.num;
                    return (
                      <button
                        key={st.num}
                        type="button"
                        onClick={() => setStep(st.num as OutfitStep)}
                        className={cn(
                          "group flex items-center gap-2 text-left transition select-none",
                          isCurrent ? "opacity-100" : isDone ? "opacity-90 hover:opacity-100" : "opacity-50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                            isCurrent
                              ? "bg-[#0B6B4F] text-white ring-2 ring-[#0B6B4F]/30"
                              : isDone
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {isDone ? <Check className="size-3 stroke-[3]" /> : st.num}
                        </div>
                        <div className="hidden sm:block">
                          <div
                            className={cn(
                              "text-xs font-bold",
                              isCurrent ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {st.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scrollable Step Content */}
            <div className="flex-1 scrollbar-none overflow-y-auto p-6">
              {/* MODE 1: CUSTOM STEPPER */}
              {mode === "CUSTOM" && (
                <>
                  {step === 1 && (
                    <GarmentPicker
                      templates={templates}
                      selectedTemplateId={selectedTemplateId}
                      currentColor={color}
                      onSelect={(tpl) => handleSelectTemplate(tpl)}
                    />
                  )}

                  {step === 2 && (
                    <ColorPicker
                      selectedColor={color}
                      brandColors={brandColors}
                      onSelect={(hex) => {
                        setColor(hex);
                        setIsDirty(true);
                      }}
                    />
                  )}

                  {step === 3 && (
                    <PrintTechniquePicker
                      selectedTechnique={technique}
                      category={selectedTemplate?.category ?? "TSHIRT"}
                      garmentColor={color}
                      onSelect={(tech) => {
                        setTechnique(tech);
                        setIsDirty(true);
                      }}
                    />
                  )}

                  {step === 4 && (
                    <OutfitOptionsStep
                      name={name}
                      defaultName={defaultTitle}
                      cut={cut}
                      quantities={quantities}
                      unitBasePrice={
                        (GARMENT_METADATA[selectedTemplateId]?.minPrice ?? 14.5) *
                        (PRINT_TECHNIQUES_META[technique]?.relativeCost ?? 1)
                      }
                      onNameChange={(val) => {
                        setName(val);
                        setIsDirty(true);
                      }}
                      onCutChange={(val) => {
                        setCut(val);
                        setIsDirty(true);
                      }}
                      onQuantityChange={(sz, delta) => {
                        setQuantities((prev) => ({
                          ...prev,
                          [sz]: Math.max(0, (prev[sz] ?? 0) + delta),
                        }));
                        setIsDirty(true);
                      }}
                    />
                  )}
                </>
              )}

              {/* MODE 2: READY-MADE PRESETS */}
              {mode === "PRESETS" && (
                <div className="space-y-4">
                  <div className="text-muted-foreground text-xs">
                    Sélectionnez un style prêt à l&apos;emploi. Vous pourrez affiner tous les détails dans
                    l&apos;atelier :
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {OUTFIT_PRESETS.map((pst) => (
                      <button
                        key={pst.id}
                        type="button"
                        onClick={() => handleApplyPreset(pst)}
                        className="group border-border/80 bg-card hover:border-primary/50 flex flex-col justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="bg-muted/80 text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                            {pst.styleTag}
                          </span>
                          {pst.badge && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              {pst.badge}
                            </span>
                          )}
                        </div>

                        <div className="my-3 space-y-1">
                          <h4 className="text-foreground group-hover:text-primary text-sm font-bold">
                            {pst.name}
                          </h4>
                          <p className="text-muted-foreground line-clamp-2 text-xs">{pst.tagline}</p>
                        </div>

                        <div className="border-border/50 text-muted-foreground flex items-center justify-between border-t pt-2 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="size-3 rounded-full border"
                              style={{ backgroundColor: pst.color }}
                            />
                            {pst.technique}
                          </span>
                          <span className="text-primary font-semibold">Appliquer →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 3: SURPRISE ME (IA) */}
              {mode === "SURPRISE" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300">
                    ✨ L&apos;IA a analysé la charte de votre marque ({brandColors.length} couleurs, logo
                    vectoriel) et vous propose 3 tenues harmonisées :
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {surpriseCombos.map((pst) => (
                      <button
                        key={pst.id}
                        type="button"
                        onClick={() => handleApplyPreset(pst)}
                        className="group border-border/80 bg-card flex flex-col justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:border-amber-500 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            {pst.badge}
                          </span>
                        </div>

                        <div className="my-3 space-y-1">
                          <h4 className="text-foreground text-sm font-bold group-hover:text-amber-600">
                            {pst.name}
                          </h4>
                          <p className="text-muted-foreground text-xs">{pst.tagline}</p>
                        </div>

                        <div className="border-border/50 text-muted-foreground flex items-center justify-between border-t pt-2 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="size-3.5 rounded-full border shadow-2xs"
                              style={{ backgroundColor: pst.color }}
                            />
                            {pst.technique}
                          </span>
                          <span className="font-bold text-amber-600">Choisir →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 4: DUPLICATE */}
              {mode === "DUPLICATE" && (
                <div className="space-y-4">
                  <div className="text-muted-foreground text-xs">
                    Repartez d&apos;une tenue existante de votre projet pour créer une variante ou une version
                    extérieure :
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {existingOutfitsQuery.data?.map((outfit) => (
                      <button
                        key={outfit.id}
                        type="button"
                        onClick={() => handleDuplicateOutfit(outfit)}
                        className="group border-border/80 bg-card hover:border-primary flex flex-col justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-foreground group-hover:text-primary text-sm font-bold">
                            {outfit.name}
                          </h4>
                          <Copy className="text-muted-foreground group-hover:text-primary size-4" />
                        </div>
                        <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="size-3 rounded-full border"
                              style={{ backgroundColor: outfit.garmentColor }}
                            />
                            {outfit.template.name}
                          </span>
                          <span className="text-primary font-semibold">Dupliquer →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Footer Controls */}
            {mode === "CUSTOM" && (
              <footer className="border-border/60 bg-card flex items-center justify-between border-t px-6 py-3.5">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as OutfitStep)}
                    className="border-border/80 text-foreground hover:bg-muted flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Précédent</span>
                  </button>
                ) : (
                  <span />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s + 1) as OutfitStep)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0B6B4F] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <span>Étape suivante</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="flex items-center gap-2 rounded-xl bg-[#0B6B4F] px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:scale-102 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Création en cours...
                      </span>
                    ) : (
                      <>
                        <Shirt className="size-4" />
                        <span>Créer la tenue</span>
                      </>
                    )}
                  </button>
                )}
              </footer>
            )}
          </div>

          {/* Right Column (45% / 5 cols) : Sticky Live Garment Preview */}
          <div className="bg-muted/15 flex flex-col p-4 lg:col-span-5 lg:p-6">
            <LiveGarmentPreview
              category={selectedTemplate?.category ?? "TSHIRT"}
              color={color}
              zones={selectedTemplate?.zones ?? []}
              garmentName={selectedTemplate?.name ?? "T-shirt"}
              brandLogoSvg={brandLogos?.color || brandLogos?.white || mainLogo?.current?.svg || null}
              contrastWarning={contrastCheck}
              className="h-full min-h-[380px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
