"use client";

import { useMemo } from "react";
import { Minus, Plus, Sparkles, Tag, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OutfitCut = "UNISEX" | "MEN" | "WOMEN" | "KIDS";

export interface OutfitOptionsStepProps {
  name: string;
  defaultName: string;
  cut: OutfitCut;
  quantities: Record<string, number>;
  unitBasePrice: number;
  onNameChange(val: string): void;
  onCutChange(val: OutfitCut): void;
  onQuantityChange(size: string, delta: number): void;
}

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function OutfitOptionsStep({
  name,
  defaultName,
  cut,
  quantities,
  unitBasePrice,
  onNameChange,
  onCutChange,
  onQuantityChange,
}: Readonly<OutfitOptionsStepProps>) {
  // Suggested name quick pills
  const nameSuggestions = [
    defaultName,
    `${defaultName} Équipe A`,
    `${defaultName} Domicile 2026`,
    `${defaultName} Staff & Event`,
    `${defaultName} Édition Limitée`,
  ];

  const totalPieces = useMemo(() => Object.values(quantities).reduce((acc, q) => acc + q, 0), [quantities]);

  // Volume discount calculation
  const discountRate = useMemo(() => {
    if (totalPieces >= 50) return 0.3; // 30% off
    if (totalPieces >= 25) return 0.2; // 20% off
    if (totalPieces >= 10) return 0.1; // 10% off
    return 0;
  }, [totalPieces]);

  const effectiveUnitPrice = unitBasePrice * (1 - discountRate);
  const totalPrice = effectiveUnitPrice * totalPieces;

  return (
    <div className="space-y-6">
      {/* 1. Name & Suggestions */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="outfit-name" className="text-foreground text-xs font-semibold">
            Nom de la tenue
          </label>
          <span className="text-muted-foreground text-[11px]">{name.length} / 80 caractères</span>
        </div>

        <Input
          id="outfit-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={defaultName}
          maxLength={80}
          className="h-10 text-sm font-medium"
        />

        {/* Quick Name Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <Sparkles className="size-3 text-amber-500" />
            Suggestions :
          </span>
          {nameSuggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onNameChange(sug)}
              className="border-border/80 bg-muted/40 text-foreground hover:bg-muted hover:border-primary/40 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition select-none"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Cut Selector */}
      <div className="space-y-2">
        <label className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
          <Users className="text-muted-foreground size-3.5" />
          <span>Coupe & Morphologie</span>
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
          {[
            { id: "UNISEX", label: "Unisexe", desc: "Coupe standard droite" },
            { id: "MEN", label: "Homme", desc: "Coupe classique athlétique" },
            { id: "WOMEN", label: "Femme", desc: "Coupe cintrée féminine" },
            { id: "KIDS", label: "Enfant", desc: "Tailles 4 à 14 ans" },
          ].map((item) => {
            const active = cut === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onCutChange(item.id as OutfitCut)}
                className={cn(
                  "rounded-xl border p-2.5 text-left transition-all select-none",
                  active
                    ? "border-[#0B6B4F] bg-[#0B6B4F]/5 ring-1 ring-[#0B6B4F]"
                    : "border-border/80 bg-card hover:bg-muted/40",
                )}
              >
                <div
                  className={cn(
                    "text-xs font-bold",
                    active ? "text-[#0B6B4F] dark:text-emerald-400" : "text-foreground",
                  )}
                >
                  {item.label}
                </div>
                <div className="text-muted-foreground text-[10px] leading-tight">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sizes & Quantities Matrix */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
            <Tag className="text-muted-foreground size-3.5" />
            <span>Tailles & Quantités prévisionnelles</span>
          </label>
          <span className="text-xs font-bold text-[#0B6B4F] dark:text-emerald-400">
            Total : {totalPieces} {totalPieces > 1 ? "pièces" : "pièce"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SIZES.map((sz) => {
            const qty = quantities[sz] ?? 0;
            return (
              <div
                key={sz}
                className="border-border/80 bg-card flex items-center justify-between rounded-xl border p-2 shadow-2xs"
              >
                <span className="text-foreground w-8 text-center text-xs font-bold">{sz}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(sz, -1)}
                    disabled={qty <= 0}
                    className="border-border/70 text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md border transition disabled:opacity-30"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(sz, 1)}
                    className="border-border/70 text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md border transition"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Live Pricing & Volume Discount Banner */}
      <div className="border-border/80 bg-muted/30 space-y-2 rounded-xl border p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Prix unitaire estimé :</span>
          <span className="text-foreground font-bold">
            {effectiveUnitPrice.toFixed(2)} € HT
            {discountRate > 0 && (
              <span className="ml-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                (-{discountRate * 100}%)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total estimé ({totalPieces} pcs) :</span>
          <span className="text-sm font-extrabold text-[#0B6B4F] dark:text-emerald-400">
            {totalPrice.toFixed(2)} € HT
          </span>
        </div>

        {totalPieces < 10 && (
          <p className="text-muted-foreground/90 border-border/50 border-t pt-2 text-[11px]">
            💡 <strong>Astuce volume :</strong> -10% de remise dès 10 pièces, -20% dès 25 pièces.
          </p>
        )}
      </div>
    </div>
  );
}
