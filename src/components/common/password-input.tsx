"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Champ mot de passe avec bouton afficher / masquer. */
export function PasswordInput({ className, ...props }: Readonly<Omit<ComponentProps<"input">, "type">>) {
  const t = useTranslations("auth.passwordField");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-9", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-controls={props.id}
        aria-label={visible ? t("hide") : t("show")}
        title={visible ? t("hide") : t("show")}
        disabled={props.disabled}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg outline-none focus-visible:ring-3 disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/** Mots de passe trop courants, refusés quelle que soit leur longueur. */
const COMMON = new Set([
  "password",
  "motdepasse",
  "12345678",
  "123456789",
  "1234567890",
  "azertyuiop",
  "qwertyuiop",
  "azerty123",
  "password1",
  "iloveyou",
  "00000000",
  "11111111",
]);

/** Robustesse de 0 (trop court) à 4 (excellent) : longueur et variété des caractères. */
export function passwordScore(password: string) {
  if (password.length < 8 || COMMON.has(password.toLowerCase())) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  let score = 1;
  if (password.length >= 12) score++;
  if (kinds >= 3) score++;
  if (password.length >= 16 || (password.length >= 12 && kinds === 4)) score++;
  return Math.min(4, score);
}

const LEVELS = ["tooShort", "weak", "fair", "good", "strong"] as const;
const COLORS = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

/** Indicateur de robustesse affiché sous un nouveau mot de passe. */
export function PasswordStrength({ password }: Readonly<{ password: string }>) {
  const t = useTranslations("auth.passwordField");
  if (!password) return null;
  const score = passwordScore(password);
  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn("h-1 rounded-full", step <= Math.max(1, score) ? COLORS[score] : "bg-muted")}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        {t("strength", { level: t(`levels.${LEVELS[score]}`) })}
      </p>
    </div>
  );
}
