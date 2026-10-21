"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, GripVertical, Image as ImageIcon, Lock, LockOpen, Shapes, Sparkles, Stamp, Type } from "lucide-react";
import { mapPage } from "@/lib/studio/doc";
import type { DesignElement } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio";
import { cn } from "@/lib/utils";

// Calques de la page : du premier plan vers le fond, réordonnables par glisser-déposer,
// avec visibilité, verrouillage et renommage (double-clic).

const ICONS = { text: Type, shape: Shapes, icon: Sparkles, image: ImageIcon, svg: Stamp } as const;

export function LayersPanel() {
  const t = useTranslations("studio.layers");
  const ti = useTranslations("studio.inspector.types");
  const tr = useTranslations("studio.roles");
  const page = useStudio((s) => s.doc?.pages[s.pageIndex]);
  const selection = useStudio((s) => s.selection);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  if (!page) return null;
  const state = useStudio.getState();
  const layers = [...page.elements].reverse();

  const label = (el: DesignElement) => el.name || (el.type === "text" ? el.text.split("\n")[0]!.slice(0, 40) || ti("text") : el.role ? tr(el.role) : ti(el.type));

  const move = (id: string, beforeId: string) => {
    if (id === beforeId) return;
    state.change((d) =>
      mapPage(d, state.pageIndex, (p) => {
        const els = p.elements.filter((el) => el.id !== id);
        const moved = p.elements.find((el) => el.id === id)!;
        // La liste est affichée à l'envers : « avant » dans la liste = au-dessus dans la page.
        const index = els.findIndex((el) => el.id === beforeId);
        els.splice(index + 1, 0, moved);
        return { ...p, elements: els };
      }),
    );
  };

  if (!layers.length) return <p className="text-xs text-muted-foreground">{t("empty")}</p>;

  return (
    <ol className="grid gap-0.5" aria-label={t("label")}>
      {layers.map((el) => {
        const Icon = ICONS[el.type];
        const selected = selection.includes(el.id);
        return (
          <li
            key={el.id}
            draggable={renaming !== el.id}
            onDragStart={(e) => {
              setDragId(el.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              setOverId(el.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) move(dragId, el.id);
              setDragId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            className={cn(
              "group flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-1 text-xs",
              selected ? "border-primary/40 bg-accent" : "hover:bg-muted",
              overId === el.id && dragId !== el.id && "border-t-primary",
              el.hidden && "opacity-50",
            )}
          >
            <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" aria-hidden="true" />
            <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            {renaming === el.id ? (
              <input
                autoFocus
                defaultValue={el.name ?? ""}
                placeholder={label(el)}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  state.updateElements([el.id], (x) => ({ ...x, name: name || undefined }));
                  setRenaming(null);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setRenaming(null);
                }}
                className="h-6 min-w-0 flex-1 rounded border bg-background px-1.5 outline-none"
                aria-label={t("rename")}
              />
            ) : (
              <button
                type="button"
                className="min-w-0 flex-1 truncate py-0.5 text-left"
                onClick={(e) => (e.shiftKey || e.metaKey || e.ctrlKey ? state.toggle(el.id) : state.select([el.id]))}
                onDoubleClick={() => setRenaming(el.id)}
                aria-pressed={selected}
                title={t("renameHint")}
              >
                {label(el)}
              </button>
            )}
            <button type="button" onClick={() => state.updateElements([el.id], (x) => ({ ...x, locked: !x.locked }))} className={cn("rounded p-0.5 text-muted-foreground hover:text-foreground", !el.locked && "opacity-0 group-hover:opacity-100")} aria-label={el.locked ? t("unlock") : t("lock")} title={el.locked ? t("unlock") : t("lock")}>
              {el.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
            </button>
            <button type="button" onClick={() => state.updateElements([el.id], (x) => ({ ...x, hidden: !x.hidden }))} className={cn("rounded p-0.5 text-muted-foreground hover:text-foreground", !el.hidden && "opacity-0 group-hover:opacity-100")} aria-label={el.hidden ? t("show") : t("hide")} title={el.hidden ? t("show") : t("hide")}>
              {el.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
