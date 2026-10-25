"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cssFontFamily, FONTS, getFont, PULAR_FONTS, type FontCategory } from "@/lib/render/fonts";
import { cn } from "@/lib/utils";

// Choix de la police avec aperçu dans chaque police, recherche et polices de la marque en tête.

const CATEGORIES: FontCategory[] = ["sport", "festive", "sans", "serif", "display", "script"];

const NO_FONTS: string[] = [];

export function FontPicker({ value, onChange, brandFonts = NO_FONTS }: Readonly<{ value: string; onChange(fontId: string): void; brandFonts?: string[] }>) {
  const t = useTranslations("studio.text");
  const tc = useTranslations("common.fontCategories");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const font = getFont(value);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = FONTS.filter((f) => !q || f.name.toLowerCase().includes(q));
    const brand = match.filter((f) => brandFonts.includes(f.id));
    return [
      ...(brand.length ? [{ id: "brand", label: t("brandFonts"), fonts: brand }] : []),
      ...CATEGORIES.map((c) => ({ id: c, label: tc(c), fonts: match.filter((f) => f.category === c) })).filter((g) => g.fonts.length),
    ];
  }, [query, brandFonts, t, tc]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input px-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={t("font")}
      >
        <span className="truncate" style={{ fontFamily: cssFontFamily(font.id) }}>
          {font.name}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="grid w-72 gap-2 p-2" side="left">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchFont")} className="h-8 pl-8 text-xs" aria-label={t("searchFont")} />
        </div>
        <fieldset className="max-h-80 overflow-y-auto pr-1">
          <legend className="sr-only">{t("font")}</legend>
          {groups.map((group) => (
            <div key={group.id} className="mb-1.5">
              <p className="sticky top-0 bg-popover px-2 py-1 text-[11px] font-medium text-muted-foreground">{group.label}</p>
              {group.fonts.map((f) => (
                <button
                  key={`${group.id}-${f.id}`}
                  type="button"
                  aria-pressed={f.id === value}
                  onClick={() => {
                    onChange(f.id);
                    setOpen(false);
                  }}
                  className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[15px] hover:bg-muted", f.id === value && "bg-accent")}
                  style={{ fontFamily: cssFontFamily(f.id) }}
                >
                  <span className="truncate">{f.name}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
                    {PULAR_FONTS.has(f.id) && (
                      <span className="text-[11px] text-muted-foreground" style={{ fontFamily: cssFontFamily("montserrat") }} title={t("pular")}>
                        <span aria-hidden="true">ɓɗƴ</span>
                        <span className="sr-only">{t("pular")}</span>
                      </span>
                    )}
                    {f.id === value && <Check className="size-3.5" aria-hidden="true" />}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
