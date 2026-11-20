"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Palette,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PrintTechnique } from "@/lib/apparel/types";
import type { ImageAnalysis, TechniqueVerdict } from "@/lib/image-engine/types";
import { cn } from "@/lib/utils";

interface ImageAnalysisCardProps {
  analysis: ImageAnalysis;
  activeTechnique?: PrintTechnique;
  onApplyFix?: (actionId: NonNullable<TechniqueVerdict["actionFixId"]>) => void;
  className?: string;
}

const TECHNIQUE_LABELS: Record<PrintTechnique, string> = {
  DTF: "DTF (Transfert numérique)",
  SCREEN_PRINT: "Sérigraphie",
  EMBROIDERY: "Broderie",
  HEAT_TRANSFER_VINYL: "Flex vinyle thermocollant",
  FLOCK: "Flocage velours",
  SUBLIMATION: "Sublimation",
  DTG: "DTG (Impression directe)",
};

export function ImageAnalysisCard({
  analysis,
  activeTechnique = "DTF",
  onApplyFix,
  className,
}: ImageAnalysisCardProps) {
  const t = useTranslations("apparel");

  const dpiBadgeColors = {
    EXCELLENT: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    GOOD: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30",
    LOW: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    CRITICAL: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  }[analysis.dpiRating];

  const currentVerdict = analysis.techniqueAudit[activeTechnique];

  return (
    <div
      className={cn(
        "border-border/80 bg-card/60 space-y-4 rounded-2xl border p-4 shadow-sm backdrop-blur",
        className,
      )}
    >
      {/* 1. Résolution & Jauge DPI */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Qualité d&apos;impression
          </span>
          <Badge variant="outline" className={cn("font-mono text-xs font-semibold", dpiBadgeColors)}>
            {analysis.effectiveDpi} DPI · {analysis.dpiRating}
          </Badge>
        </div>

        {/* Barre de jauge DPI */}
        <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full transition-all duration-500",
              analysis.effectiveDpi >= 300
                ? "bg-emerald-500"
                : analysis.effectiveDpi >= 200
                  ? "bg-teal-500"
                  : analysis.effectiveDpi >= 150
                    ? "bg-amber-500"
                    : "bg-rose-500",
            )}
            style={{ width: `${Math.min(100, (analysis.effectiveDpi / 350) * 100)}%` }}
          />
        </div>

        <div className="text-muted-foreground flex justify-between font-mono text-[10px]">
          <span>
            {analysis.width} × {analysis.height} px
          </span>
          <span>
            Zone : {analysis.targetZoneMm.width} × {analysis.targetZoneMm.height} mm
          </span>
        </div>
      </div>

      {/* 2. Statut Détection de fond */}
      <div className="bg-muted/40 flex items-center justify-between rounded-xl p-2.5 text-xs">
        <div className="flex items-center gap-2">
          {analysis.hasAlpha ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="size-4 text-amber-500" />
          )}
          <span>
            {analysis.hasAlpha
              ? "Fond transparent détecté"
              : analysis.hasSolidBackground
                ? "Fond opaque uni détecté"
                : "Image opaque sans transparence"}
          </span>
        </div>

        {!analysis.hasAlpha && onApplyFix && (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 gap-1 text-[11px] font-medium"
            onClick={() => onApplyFix("remove-bg")}
          >
            <Wand2 className="text-primary size-3" />
            Détourer
          </Button>
        )}
      </div>

      {/* 3. Couleurs dominantes */}
      {analysis.dominantColors.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Palette className="size-3.5" /> Couleurs détectées ({analysis.dominantColors.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {analysis.dominantColors.map((color) => (
              <div
                key={color.hex}
                className="border-border/80 bg-background/80 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] shadow-2xs"
              >
                <span
                  className="size-3 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-mono text-[10px] font-medium">{color.hex}</span>
                <span className="text-muted-foreground font-mono text-[10px]">{color.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Verdict Technique active */}
      <div className="border-border/80 bg-muted/30 space-y-2 rounded-xl border p-3">
        <div className="flex items-center justify-between">
          <span className="text-foreground text-xs font-semibold">{TECHNIQUE_LABELS[activeTechnique]}</span>
          {currentVerdict.compliant ? (
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400">
              Compatible
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">
              Attention requise
            </Badge>
          )}
        </div>

        {currentVerdict.warnings.length > 0 && (
          <ul className="space-y-1 text-[11px] text-amber-700 dark:text-amber-400">
            {currentVerdict.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}

        {currentVerdict.recommendations.length > 0 && (
          <ul className="text-muted-foreground space-y-1 text-[11px]">
            {currentVerdict.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Sparkles className="text-primary mt-0.5 size-3 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}

        {currentVerdict.actionFixId && onApplyFix && (
          <Button
            size="sm"
            variant="default"
            className="mt-1 h-7 w-full gap-1.5 text-xs"
            onClick={() => onApplyFix(currentVerdict.actionFixId!)}
          >
            <Sparkles className="size-3" />
            Corriger automatiquement ({currentVerdict.actionFixId})
          </Button>
        )}
      </div>
    </div>
  );
}
