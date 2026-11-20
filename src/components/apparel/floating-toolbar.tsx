"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDown,
  ArrowUp,
  Copy,
  FlipHorizontal,
  Lock,
  Trash2,
  Unlock,
  Wand2,
} from "lucide-react";
import type { EditorElement } from "@/lib/apparel/render";
import type { PrintZone } from "@/lib/apparel/types";
import { useApparel } from "@/stores/apparel";
import { cn } from "@/lib/utils";
import { useApparelEditor } from "./editor";

export interface FloatingToolbarProps {
  element: EditorElement;
  zone: PrintZone;
  x: number;
  y: number;
  className?: string;
}

export function FloatingToolbar({ element, zone, x, y, className }: Readonly<FloatingToolbarProps>) {
  const store = useApparel.getState();
  const { openImageStudio } = useApparelEditor();

  const handleCenterH = () => {
    store.update(element.id, (el) => ({
      ...el,
      offsetXMm: Math.round((zone.maxWidthMm - el.widthMm) / 2),
    }));
  };

  const handleCenterV = () => {
    store.update(element.id, (el) => ({
      ...el,
      offsetYMm: Math.round((zone.maxHeightMm - el.heightMm) / 2),
    }));
  };

  const handleDuplicate = () => {
    store.duplicate(element.id);
  };

  const handleDelete = () => {
    store.remove(element.id);
  };

  const handleFlip = () => {
    store.update(element.id, (el) => {
      if (el.content.photo) {
        return {
          ...el,
          content: {
            ...el.content,
            photo: {
              ...el.content.photo,
              flipX: !el.content.photo.flipX,
            },
          },
        };
      }
      return el;
    });
  };

  return (
    <div
      style={{
        left: x,
        top: Math.max(10, y - 48),
      }}
      className={cn(
        "border-border/80 bg-popover/95 animate-in fade-in-0 zoom-in-95 absolute z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border p-1 shadow-xl backdrop-blur-md select-none",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleCenterH}
        title="Centrer horizontalement dans la zone"
        className="text-popover-foreground hover:bg-muted flex size-7 items-center justify-center rounded-lg transition"
      >
        <AlignCenterHorizontal className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={handleCenterV}
        title="Centrer verticalement dans la zone"
        className="text-popover-foreground hover:bg-muted flex size-7 items-center justify-center rounded-lg transition"
      >
        <AlignCenterVertical className="size-3.5" />
      </button>

      {element.content.photo && (
        <button
          type="button"
          onClick={() => openImageStudio(element.content.photo!.src, element.id)}
          title="Atelier Image (Détourer, Vectoriser, DPI...)"
          className="flex size-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-500/10"
        >
          <Wand2 className="size-3.5" />
        </button>
      )}

      <div className="bg-border/80 mx-0.5 h-4 w-px" />

      <button
        type="button"
        onClick={handleDuplicate}
        title="Dupliquer l'élément (Ctrl+D)"
        className="text-popover-foreground hover:bg-muted flex size-7 items-center justify-center rounded-lg transition"
      >
        <Copy className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => store.arrange(element.id, "forward")}
        title="Monter d'un plan"
        className="text-popover-foreground hover:bg-muted flex size-7 items-center justify-center rounded-lg transition"
      >
        <ArrowUp className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => store.arrange(element.id, "backward")}
        title="Descendre d'un plan"
        className="text-popover-foreground hover:bg-muted flex size-7 items-center justify-center rounded-lg transition"
      >
        <ArrowDown className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={handleFlip}
        title="Retourner horizontalement"
        className="text-popover-foreground hover:bg-muted flex size-7 items-center justify-center rounded-lg transition"
      >
        <FlipHorizontal className="size-3.5" />
      </button>

      <div className="bg-border/80 mx-0.5 h-4 w-px" />

      <button
        type="button"
        onClick={handleDelete}
        title="Supprimer (Suppr / Backspace)"
        className="text-destructive hover:bg-destructive/10 flex size-7 items-center justify-center rounded-lg"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
