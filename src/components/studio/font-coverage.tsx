"use client";

import { useTranslations } from "next-intl";
import { fallbackLetters } from "@/lib/render/fonts";

/**
 * Lettres du texte que la police choisie n'a pas (pular ɓ ɗ ŋ ƴ, écriture N'Ko) : elles seront
 * dessinées avec la police de secours, dans l'éditeur comme dans les exports.
 */
export function FontCoverageNotice({ text, fontId }: Readonly<{ text: string; fontId: string }>) {
  const t = useTranslations("studio.text");
  const { letters, nko } = fallbackLetters(text, fontId);
  if (!letters.length && !nko) return null;
  return (
    <div className="grid gap-0.5 text-[11px] text-amber-700 dark:text-amber-400">
      {letters.length > 0 && (
        <p>{t("fallbackLetters", { letters: letters.join(" "), count: letters.length })}</p>
      )}
      {nko && <p>{t("nkoFallback")}</p>}
    </div>
  );
}
