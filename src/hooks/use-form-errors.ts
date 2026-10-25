"use client";

import { useState } from "react";
import { fieldErrors } from "@/lib/api";
import { useApiErrorToast } from "./use-api-error";

/**
 * Erreurs de l'API affichées sous les champs du formulaire. `fields` : identifiants des champs
 * présents, dans l'ordre du formulaire (le premier refusé reçoit le focus). Une erreur qui ne
 * concerne aucun de ces champs reste signalée par un toast.
 */
export function useFormErrors(fields: readonly string[]) {
  const toastError = useApiErrorToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onError = (error: unknown) => {
    const all = fieldErrors(error);
    const shown = Object.fromEntries(Object.entries(all).filter(([key]) => fields.includes(key)));
    setErrors(shown);
    const first = fields.find((key) => shown[key]);
    if (first) document.getElementById(first)?.focus();
    if (Object.keys(shown).length < Math.max(1, Object.keys(all).length)) toastError(error);
  };

  const clear = (field: string) =>
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });

  return { errors, setErrors, onError, clear };
}
