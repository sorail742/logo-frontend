"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldControl {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldControl | null>(null);

/**
 * Attributs ARIA du contrôle désigné par le libellé du champ (même `id`) : aide ou erreur lue par
 * les lecteurs d'écran, état invalide. Sans effet hors d'un `Field` ou pour un autre contrôle.
 */
export function useFieldControl(id?: string) {
  const field = useContext(FieldContext);
  if (!field || !id || field.id !== id) return {};
  return { "aria-describedby": field.describedBy, "aria-invalid": field.invalid || undefined };
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: Readonly<{
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}>) {
  const messageId = htmlFor && (error || hint) ? `${htmlFor}-message` : undefined;
  const invalid = Boolean(error);
  const control = useMemo(() => (htmlFor ? { id: htmlFor, describedBy: messageId, invalid } : null), [htmlFor, messageId, invalid]);
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <FieldContext value={control}>{children}</FieldContext>
      {error ? (
        <p id={messageId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
