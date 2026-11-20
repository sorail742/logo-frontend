"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Contrast,
  Crop,
  Download,
  Eye,
  EyeOff,
  Layers,
  Maximize2,
  Minimize2,
  Palette,
  Redo2,
  RotateCw,
  Scissors,
  Sliders,
  Sparkles,
  Sun,
  Undo2,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PrintTechnique } from "@/lib/apparel/types";
import { dataUrlToRawImage, rawImageToDataUrl, runImagePipeline } from "@/lib/image-engine/pipeline";
import { prepareForTechnique } from "@/lib/image-engine/technique-prep";
import type {
  ImageAnalysis,
  ImageOperation,
  ProcessedImageResult,
  RawImageData,
} from "@/lib/image-engine/types";
import { cn } from "@/lib/utils";
import { ImageAnalysisCard } from "./image-analysis-card";

function getSingleValue(val: number | readonly number[] | number[], fallback = 0): number {
  if (typeof val === "number") return val;
  if (val && typeof val === "object" && 0 in val) return (val as readonly number[])[0] ?? fallback;
  return fallback;
}

export interface ImageStudioModalProps {
  initialImageUrl: string;
  targetZoneMm: { width: number; height: number };
  activeTechnique?: PrintTechnique;
  garmentColorHex?: string;
  onApply: (result: { dataUrl: string; svg?: string; analysis: ImageAnalysis }) => void;
  onClose: () => void;
}

export function ImageStudioModal({
  initialImageUrl,
  targetZoneMm,
  activeTechnique = "DTF",
  garmentColorHex = "#ffffff",
  onApply,
  onClose,
}: ImageStudioModalProps) {
  const t = useTranslations("apparel");

  const [rawOriginal, setRawOriginal] = useState<RawImageData | null>(null);
  const [operationsHistory, setOperationsHistory] = useState<ImageOperation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Outils & Paramètres de réglages
  const [activeTab, setActiveTab] = useState<"cutout" | "adjust" | "vectorize" | "print">("cutout");
  const [tolerance, setTolerance] = useState(25);
  const [decontaminate, setDecontaminate] = useState(true);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [vectorColors, setVectorColors] = useState(4);
  const [vectorMode, setVectorMode] = useState<"logo" | "color" | "monochrome">("logo");

  // Affichage & Visualisation
  const [isComparing, setIsComparing] = useState(false);
  const [compareSplit, setCompareSplit] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Charger l'image initiale
  useEffect(() => {
    let active = true;
    dataUrlToRawImage(initialImageUrl)
      .then((raw) => {
        if (active) setRawOriginal(raw);
      })
      .catch((err) => {
        toast.error("Impossible de charger l'image dans l'atelier");
      });
    return () => {
      active = false;
    };
  }, [initialImageUrl]);

  // Opérations actuelles
  const currentOperations = operationsHistory[historyIndex] ?? [];

  // Exécution du pipeline non-destructif en temps réel
  const processedResult: ProcessedImageResult | null = useMemo(() => {
    if (!rawOriginal) return null;
    return runImagePipeline({
      originalImage: rawOriginal,
      operations: currentOperations,
      targetZoneMm,
      garmentColorHex,
      technique: activeTechnique,
    });
  }, [rawOriginal, currentOperations, targetZoneMm, garmentColorHex, activeTechnique]);

  // Données de préparation technique
  const techniquePrep = useMemo(() => {
    if (!processedResult) return null;
    return prepareForTechnique(processedResult.rawImage, activeTechnique, targetZoneMm);
  }, [processedResult, activeTechnique, targetZoneMm]);

  // Ajouter une opération avec historique Undo/Redo
  const pushOperation = (op: ImageOperation) => {
    const updated = [...currentOperations, op];
    const newHistory = operationsHistory.slice(0, historyIndex + 1);
    newHistory.push(updated);
    setOperationsHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const handleRedo = () => {
    if (historyIndex < operationsHistory.length - 1) setHistoryIndex(historyIndex + 1);
  };

  // Actions d'outils
  const handleAutoEnhance = () => {
    pushOperation({ id: `enhance_${Date.now()}`, type: "auto-enhance" });
    toast.success("Amélioration automatique appliquée");
  };

  const handleRemoveBackground = () => {
    setIsProcessing(true);
    setTimeout(() => {
      pushOperation({
        id: `remove_bg_${Date.now()}`,
        type: "remove-background",
        params: {
          tolerance,
          edgeSmooth: 2,
          feather: 1,
          decontaminate,
        },
      });
      setIsProcessing(false);
      toast.success("Fond détouré avec succès");
    }, 50);
  };

  const handleApplyAdjustments = () => {
    pushOperation({
      id: `adjust_${Date.now()}`,
      type: "adjust",
      params: {
        brightness: brightness !== 0 ? brightness : undefined,
        contrast: contrast !== 0 ? contrast : undefined,
        saturation: saturation !== 0 ? saturation : undefined,
        sharpen: sharpen !== 0 ? sharpen : undefined,
      },
    });
    toast.success("Ajustements enregistrés");
  };

  const handleVectorize = () => {
    setIsProcessing(true);
    setTimeout(() => {
      pushOperation({
        id: `vec_${Date.now()}`,
        type: "vectorize",
        params: {
          colorsCount: vectorColors,
          simplifyTolerance: 1.2,
          mode: vectorMode,
        },
      });
      setIsProcessing(false);
      toast.success("Vectorisation SVG calculée");
    }, 50);
  };

  const handleRotate = () => {
    pushOperation({
      id: `rot_${Date.now()}`,
      type: "rotate",
      params: { angleDeg: 90 },
    });
  };

  const handleFlip = (horizontal: boolean) => {
    pushOperation({
      id: `flip_${Date.now()}`,
      type: "flip",
      params: { horizontal, vertical: !horizontal },
    });
  };

  // Sauvegarde finale
  const handleSaveAndApply = () => {
    if (!processedResult) return;
    onApply({
      dataUrl: processedResult.dataUrl,
      svg: processedResult.svgOutput,
      analysis: processedResult.analysis,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background border-border/80 flex h-[92vh] max-h-[92vh] w-[1400px] max-w-[96vw] flex-col overflow-hidden rounded-2xl p-0 shadow-2xl">
        {/* Barre d'en-tête Atelier */}
        <div className="border-border/80 bg-card/60 flex items-center justify-between border-b px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={onClose} className="size-8 rounded-full">
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-foreground text-base font-bold">
                  Atelier Image Textile
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400"
                >
                  100% In-House · Zéro API externe
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Optimisation non destructive, détourage intelligent, vectorisation et contrôle technique
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Boutons Historique */}
            <Button
              size="icon"
              variant="outline"
              className="size-8"
              disabled={historyIndex === 0}
              onClick={handleUndo}
              title="Annuler (Ctrl+Z)"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-8"
              disabled={historyIndex >= operationsHistory.length - 1}
              onClick={handleRedo}
              title="Rétablir (Ctrl+Y)"
            >
              <Redo2 className="size-3.5" />
            </Button>

            <div className="bg-border/60 mx-1 h-4 w-px" />

            {/* Mode Comparaison Avant / Après */}
            <Button
              variant={isComparing ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={() => setIsComparing(!isComparing)}
            >
              <Eye className="size-3.5" />
              {isComparing ? "Masquer comparaison" : "Comparer avant / après"}
            </Button>

            {/* Rotation / Flip */}
            <Button size="icon" variant="ghost" className="size-8" onClick={handleRotate} title="Pivoter 90°">
              <RotateCw className="size-3.5" />
            </Button>

            <div className="bg-border/60 mx-1 h-4 w-px" />

            {/* Bouton Enregistrer / Appliquer */}
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveAndApply}
              className="h-8 gap-1.5 bg-emerald-600 font-medium text-white hover:bg-emerald-700"
            >
              <Check className="size-4" />
              Appliquer à la tenue
            </Button>
          </div>
        </div>

        {/* Corps principal : 3 colonnes */}
        <div className="divide-border/60 bg-muted/20 grid min-h-0 flex-1 grid-cols-12 divide-x">
          {/* Colonne Gauche : Boîte à outils (4 colonnes) */}
          <div className="bg-card/40 col-span-3 flex flex-col space-y-4 overflow-y-auto p-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "cutout" | "adjust" | "vectorize" | "print")}
              className="w-full"
            >
              <TabsList className="bg-muted/60 grid h-9 w-full grid-cols-4 p-1">
                <TabsTrigger value="cutout" className="gap-1 px-1 text-xs">
                  <Scissors className="size-3" /> Fond
                </TabsTrigger>
                <TabsTrigger value="adjust" className="gap-1 px-1 text-xs">
                  <Sliders className="size-3" /> Réglages
                </TabsTrigger>
                <TabsTrigger value="vectorize" className="gap-1 px-1 text-xs">
                  <Palette className="size-3" /> SVG
                </TabsTrigger>
                <TabsTrigger value="print" className="gap-1 px-1 text-xs">
                  <Layers className="size-3" /> Technique
                </TabsTrigger>
              </TabsList>

              {/* Onglet 1 : Détourage & Fond */}
              <TabsContent value="cutout" className="space-y-4 pt-3">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 text-xs font-semibold"
                    onClick={handleAutoEnhance}
                  >
                    <Sparkles className="size-3.5 text-amber-500" />
                    Amélioration auto (contraste + netteté)
                  </Button>

                  <div className="border-border/80 bg-background/60 space-y-2 rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Détourage automatique</span>
                      <Wand2 className="text-primary size-3.5" />
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Élimine le fond opaque en analysant les bordures avec la formule colorimétrique
                      perceptive.
                    </p>

                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs">
                        <span>Tolérance</span>
                        <span className="text-muted-foreground font-mono">{tolerance}%</span>
                      </div>
                      <Slider
                        value={[tolerance]}
                        min={5}
                        max={80}
                        step={1}
                        onValueChange={(val) => setTolerance(getSingleValue(val, 25))}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <label htmlFor="decontaminate" className="text-muted-foreground cursor-pointer">
                        Décontaminer franges
                      </label>
                      <input
                        type="checkbox"
                        id="decontaminate"
                        checked={decontaminate}
                        onChange={(e) => setDecontaminate(e.target.checked)}
                        className="border-border rounded"
                      />
                    </div>

                    <Button
                      size="sm"
                      className="mt-2 h-8 w-full text-xs font-semibold"
                      onClick={handleRemoveBackground}
                      disabled={isProcessing}
                    >
                      <Wand2 className="mr-1.5 size-3" />
                      Supprimer le fond
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet 2 : Ajustements & Filtres */}
              <TabsContent value="adjust" className="space-y-3 pt-3">
                <div className="border-border/80 bg-background/60 space-y-3 rounded-xl border p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Luminosité</span>
                      <span className="text-muted-foreground font-mono">{brightness}</span>
                    </div>
                    <Slider
                      value={[brightness]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={(val) => setBrightness(getSingleValue(val, 0))}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Contraste</span>
                      <span className="text-muted-foreground font-mono">{contrast}</span>
                    </div>
                    <Slider
                      value={[contrast]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={(val) => setContrast(getSingleValue(val, 0))}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Saturation</span>
                      <span className="text-muted-foreground font-mono">{saturation}</span>
                    </div>
                    <Slider
                      value={[saturation]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={(val) => setSaturation(getSingleValue(val, 0))}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Netteté (Sharpen)</span>
                      <span className="text-muted-foreground font-mono">{sharpen}%</span>
                    </div>
                    <Slider
                      value={[sharpen]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(val) => setSharpen(getSingleValue(val, 0))}
                    />
                  </div>

                  <Button
                    size="sm"
                    className="mt-2 h-8 w-full text-xs font-semibold"
                    onClick={handleApplyAdjustments}
                  >
                    Appliquer les réglages
                  </Button>
                </div>
              </TabsContent>

              {/* Onglet 3 : Vectorisation SVG */}
              <TabsContent value="vectorize" className="space-y-3 pt-3">
                <div className="border-border/80 bg-background/60 space-y-3 rounded-xl border p-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold">Mode de vectorisation</span>
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      {(["logo", "color", "monochrome"] as const).map((m) => (
                        <Button
                          key={m}
                          size="sm"
                          variant={vectorMode === m ? "default" : "outline"}
                          className="h-7 text-[11px] capitalize"
                          onClick={() => setVectorMode(m)}
                        >
                          {m === "logo" ? "Logo net" : m === "color" ? "Couleurs" : "Mono"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {vectorMode !== "monochrome" && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs">
                        <span>Nombre de couleurs</span>
                        <span className="text-muted-foreground font-mono">{vectorColors}</span>
                      </div>
                      <Slider
                        value={[vectorColors]}
                        min={1}
                        max={16}
                        step={1}
                        onValueChange={(val) => setVectorColors(getSingleValue(val, 4))}
                      />
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="mt-2 h-8 w-full text-xs font-semibold"
                    onClick={handleVectorize}
                    disabled={isProcessing}
                  >
                    <Palette className="mr-1.5 size-3" />
                    Générer tracé vectoriel SVG
                  </Button>
                </div>
              </TabsContent>

              {/* Onglet 4 : Technique & Production */}
              <TabsContent value="print" className="space-y-3 pt-3">
                {techniquePrep?.dtfWhiteUnderbase && (
                  <div className="border-border/80 bg-background/60 space-y-2 rounded-xl border p-3 text-xs">
                    <span className="text-foreground font-semibold">Sous-couche blanche DTF</span>
                    <p className="text-muted-foreground text-[11px]">
                      Retrait (choke) de {techniquePrep.dtfWhiteUnderbase.chokePixels} px pour éliminer les
                      débordements sur textiles sombres.
                    </p>
                    <div className="font-mono text-[11px] text-emerald-600">
                      Surface encrée blanche : {techniquePrep.dtfWhiteUnderbase.whiteInkAreaPercent}%
                    </div>
                  </div>
                )}

                {techniquePrep?.embroideryPreview && (
                  <div className="border-border/80 bg-background/60 space-y-2 rounded-xl border p-3 text-xs">
                    <span className="text-foreground font-semibold">Aperçu Broderie</span>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>Points estimés</span>
                      <span className="font-bold">
                        {techniquePrep.embroideryPreview.estimatedStitches.toLocaleString()}
                      </span>
                    </div>
                    {techniquePrep.embroideryPreview.matchedThreads.map((t) => (
                      <div
                        key={t.code}
                        className="bg-muted/40 flex items-center justify-between rounded p-1.5 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="size-3 rounded-full" style={{ backgroundColor: t.hex }} />
                          <span>
                            {t.brand} {t.code} ({t.name})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {techniquePrep?.plotterCut && (
                  <div className="border-border/80 bg-background/60 space-y-2 rounded-xl border p-3 text-xs">
                    <span className="text-foreground font-semibold">Découpe Traceur / Flocage</span>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>Périmètre de coupe</span>
                      <span>{techniquePrep.plotterCut.perimeterMm} mm</span>
                    </div>
                    {techniquePrep.plotterCut.warningWeeding && (
                      <p className="text-[11px] text-amber-600">
                        Attention : Tracé dense, échenillage minutieux requis.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Colonne Centrale : Espace Canvas / Visualiseur (6 colonnes) */}
          <div className="relative col-span-6 flex flex-col items-center justify-center overflow-hidden bg-neutral-900/90 p-6 select-none">
            {/* Arrière-plan damier de transparence professionnel */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)`,
                backgroundSize: `20px 20px`,
                backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`,
              }}
            />

            {/* Visualiseur de l'image */}
            <div className="relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 shadow-2xl">
              {processedResult && !isComparing && (
                <img
                  src={processedResult.dataUrl}
                  alt="Aperçu traité"
                  className="max-h-[68vh] max-w-[42vw] object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              )}

              {/* Mode comparaison Split Slider */}
              {processedResult && isComparing && (
                <div className="relative max-h-[68vh] max-w-[42vw] overflow-hidden select-none">
                  {/* Image originale en dessous */}
                  <img
                    src={initialImageUrl}
                    alt="Originale"
                    className="block max-h-[68vh] max-w-[42vw] object-contain opacity-80"
                  />
                  {/* Image traitée au dessus découpée */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - compareSplit}% 0 0)` }}
                  >
                    <img
                      src={processedResult.dataUrl}
                      alt="Traitée"
                      className="block max-h-[68vh] max-w-[42vw] object-contain"
                    />
                  </div>
                  {/* Ligne séparatrice */}
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                    style={{ left: `${compareSplit}%` }}
                  >
                    <div className="absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] font-bold text-neutral-900 shadow-md">
                      ↔
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Slider de comparaison si actif */}
            {isComparing && (
              <div className="absolute bottom-4 z-10 w-72 rounded-xl border border-white/10 bg-neutral-900/80 p-2 backdrop-blur">
                <Slider
                  value={[compareSplit]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setCompareSplit(getSingleValue(val, 50))}
                />
              </div>
            )}
          </div>

          {/* Colonne Droite : Audit Qualité & Impression (3 colonnes) */}
          <div className="bg-card/40 col-span-3 flex flex-col space-y-4 overflow-y-auto p-4">
            {processedResult && (
              <ImageAnalysisCard
                analysis={processedResult.analysis}
                activeTechnique={activeTechnique}
                onApplyFix={(fixId) => {
                  if (fixId === "remove-bg") handleRemoveBackground();
                  else if (fixId === "vectorize") handleVectorize();
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
