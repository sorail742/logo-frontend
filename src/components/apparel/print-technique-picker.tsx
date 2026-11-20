"use client";

import { useState } from "react";
import { AlertCircle, Check, Clock, Coins, ExternalLink, HelpCircle, Sparkles, X } from "lucide-react";
import type { PrintTechnique, ProductCategory } from "@/lib/apparel/types";
import { PRINT_TECHNIQUES_META, checkTechniqueCompatibility } from "@/lib/apparel/techniques-data";
import { TECHNIQUES } from "@/lib/apparel/types";
import { cn } from "@/lib/utils";

export interface PrintTechniquePickerProps {
  selectedTechnique: PrintTechnique;
  category: ProductCategory;
  garmentColor: string;
  onSelect(technique: PrintTechnique): void;
}

export function PrintTechniquePicker({
  selectedTechnique,
  category,
  garmentColor,
  onSelect,
}: Readonly<PrintTechniquePickerProps>) {
  const [showCompareModal, setShowCompareModal] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with smart recommendation & compare link */}
      <div className="border-border/60 flex items-center justify-between border-b pb-3">
        <div className="text-muted-foreground text-xs">
          Sélectionnez la technique de personnalisation adaptée à votre usage :
        </div>
        <button
          type="button"
          onClick={() => setShowCompareModal(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B6B4F] hover:underline dark:text-emerald-400"
        >
          <span>Comparer le tableau</span>
          <ExternalLink className="size-3" />
        </button>
      </div>

      {/* Techniques List / Cards */}
      <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Techniques d'impression">
        {TECHNIQUES.map((tech) => {
          const meta = PRINT_TECHNIQUES_META[tech];
          const isSelected = selectedTechnique === tech;
          const { compatible, reason } = checkTechniqueCompatibility(tech, category, garmentColor);

          return (
            <button
              key={tech}
              type="button"
              disabled={!compatible}
              role="radio"
              aria-checked={isSelected}
              onClick={() => compatible && onSelect(tech)}
              className={cn(
                "group focus-visible:ring-primary relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 select-none focus-visible:ring-2 focus-visible:outline-none",
                !compatible && "bg-muted/40 border-border/80 cursor-not-allowed border-dashed opacity-45",
                compatible && isSelected
                  ? "border-[#0B6B4F] bg-[#0B6B4F]/5 shadow-sm ring-2 ring-[#0B6B4F]"
                  : compatible && "border-border/80 bg-card hover:border-primary/40 hover:shadow-xs",
              )}
            >
              {/* Header row: Name + Badge + Check */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold tracking-tight transition-colors",
                        isSelected ? "text-[#0B6B4F] dark:text-emerald-400" : "text-foreground",
                      )}
                    >
                      {meta?.name ?? tech}
                    </span>
                    {meta?.badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="size-2.5" />
                        {meta.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{meta?.summary}</p>
                </div>

                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                    isSelected
                      ? "bg-[#0B6B4F] text-white shadow-xs"
                      : "border-border/80 bg-muted/40 border text-transparent",
                  )}
                >
                  <Check className="size-3 stroke-[3]" />
                </div>
              </div>

              {/* Incompatibility notice if disabled */}
              {!compatible && reason && (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                  <span>{reason}</span>
                </div>
              )}

              {/* Bottom specs: Turnaround & Price Tier */}
              {compatible && (
                <div className="border-border/50 text-muted-foreground mt-3 flex flex-wrap items-center justify-between border-t pt-2.5 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="text-muted-foreground size-3" />
                      {meta?.turnaroundDays}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="text-muted-foreground size-3" />
                      Tarif : <strong className="text-foreground">{meta?.priceTier}</strong>
                    </span>
                  </div>

                  {meta?.pros && meta.pros[0] && (
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      ✔ {meta.pros[0]}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Comparative modal table */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-card w-full max-w-3xl space-y-4 overflow-hidden rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <h3 className="text-foreground text-lg font-bold">Tableau Comparatif des Techniques</h3>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-border/80 text-muted-foreground border-b font-semibold">
                    <th className="py-2.5 pr-3">Technique</th>
                    <th className="py-2.5 pr-3">Photos / Dégradés</th>
                    <th className="py-2.5 pr-3">Petite série (1-10)</th>
                    <th className="py-2.5 pr-3">Durabilité</th>
                    <th className="py-2.5">Délai estimé</th>
                  </tr>
                </thead>
                <tbody className="divide-border/60 divide-y">
                  {TECHNIQUES.map((tech) => {
                    const m = PRINT_TECHNIQUES_META[tech];
                    return (
                      <tr key={tech} className="hover:bg-muted/30">
                        <td className="text-foreground py-3 pr-3 font-bold">{m?.name.split("(")[0]}</td>
                        <td className="py-3 pr-3">
                          {tech === "DTF" || tech === "DTG" || tech === "SUBLIMATION" ? (
                            <span className="font-bold text-emerald-600">✔ Idéal</span>
                          ) : (
                            <span className="text-muted-foreground">✖ Non conseillé</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          {tech === "SCREEN_PRINT" ? (
                            <span className="font-medium text-amber-600">Dès 20 pcs</span>
                          ) : (
                            <span className="font-bold text-emerald-600">Dès 1 pièce</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          {tech === "EMBROIDERY" || tech === "SUBLIMATION" ? (
                            <span className="font-bold text-emerald-600">À vie (inaltérable)</span>
                          ) : (
                            <span>Très bonne (60°C)</span>
                          )}
                        </td>
                        <td className="text-muted-foreground py-3">{m?.turnaroundDays}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="rounded-xl bg-[#0B6B4F] px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
