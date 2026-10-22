"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { brandTexts, type BrandText, type BrandTextInput } from "@/lib/brand-texts";
import { cn } from "@/lib/utils";

function TextBlock({ item, label }: { item: BrandText; label: string }) {
  const t = useTranslations("kit.texts");
  const [value, setValue] = useState(item.text);
  const [copied, setCopied] = useState(false);
  const over = value.length > item.limit;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  const id = `brand-text-${item.id}`;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <span className={cn("text-[11px] tabular-nums", over ? "font-medium text-destructive" : "text-muted-foreground")}>{t("count", { count: value.length, limit: item.limit })}</span>
          <Button variant="ghost" size="icon" className="size-7" onClick={copy} aria-label={`${t("copy")} — ${label}`} title={t("copy")}>
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </div>
      <Textarea id={id} value={value} onChange={(e) => setValue(e.target.value)} rows={item.id === "linkedin" || item.id === "hashtags" ? 2 : 4} className="text-sm" />
    </div>
  );
}

/** Textes de marque prêts à publier, modifiables avant copie. */
export function BrandTextsCard(input: Omit<BrandTextInput, "locale">) {
  const t = useTranslations("kit.texts");
  const locale = useLocale();
  const texts = brandTexts({ ...input, locale });
  // Les champs repartent des textes proposés quand le contenu du kit change.
  const key = texts.map((item) => item.text).join("|");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("title")}</CardTitle>
        <CardDescription className="text-xs">{t("body")}</CardDescription>
      </CardHeader>
      <CardContent key={key} className="grid gap-4 md:grid-cols-2">
        {texts.map((item) => (
          <TextBlock key={item.id} item={item} label={t(`items.${item.id}`)} />
        ))}
      </CardContent>
    </Card>
  );
}
