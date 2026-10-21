"use client";

import { createContext, useContext } from "react";
import type { StudioBrand } from "@/lib/studio/brand";
import type { IconNode } from "@/lib/render/icons";

// Contexte de l'éditeur : identité du projet, droits et bibliothèque d'icônes chargée.

export interface StudioContextValue {
  projectId: string;
  brand: StudioBrand | null;
  canEdit: boolean;
  /** Bibliothèque complète (chargée à la demande). */
  icons: Record<string, IconNode> | null;
  /** Ouvre le sélecteur de fichiers pour des photos (cadre visé, le cas échéant). */
  pickImages(frameId?: string | null): void;
  /** Enregistre immédiatement les modifications en attente (avant un export serveur). */
  flush(): Promise<void>;
}

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudioContext() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("useStudioContext hors de l'éditeur du Studio");
  return value;
}
