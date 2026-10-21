"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ImageUp, Images, Loader2, RotateCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { qk } from "@/lib/query-keys";
import { prepareImage } from "@/lib/studio/images";
import type { LibraryPhoto, PhotoOrientation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStudioContext } from "../context";
import { placeImages } from "../placement";

// Banque de photos (Pexels) : recherche, sélection du moment, crédit du photographe.
// Un clic télécharge la photo par l'API et la pose sur la page (ou dans le cadre sélectionné).

type Orientation = PhotoOrientation | "all";
const ORIENTATIONS: Orientation[] = ["all", "landscape", "portrait", "square"];

export function useCapabilities() {
  return useQuery({ queryKey: qk.capabilities, queryFn: () => api.library.capabilities(), staleTime: 10 * 60_000 });
}

function Unavailable() {
  const t = useTranslations("studio.photos");
  const { pickImages } = useStudioContext();
  return (
    <div className="grid justify-items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center">
      <Images className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-semibold">{t("unavailableTitle")}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("unavailable")}</p>
      <Button size="sm" variant="outline" onClick={() => pickImages(null)}>
        <ImageUp />
        {t("importOwn")}
      </Button>
    </div>
  );
}

function PhotoTile({ photo, busy, disabled, onAdd }: { photo: LibraryPhoto; busy: boolean; disabled: boolean; onAdd(): void }) {
  const t = useTranslations("studio.photos");
  return (
    <div className="group relative overflow-hidden rounded-lg" style={{ aspectRatio: `${photo.width} / ${photo.height}`, background: photo.color ?? undefined }}>
      <button type="button" onClick={onAdd} disabled={disabled} className="block size-full disabled:cursor-wait" aria-label={t("add", { author: photo.author })} title={photo.alt || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- vignette servie par Pexels */}
        <img src={photo.thumbUrl} alt="" loading="lazy" className="size-full object-cover transition group-hover:scale-[1.03]" />
      </button>
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        </span>
      )}
      <a
        href={photo.authorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-4 pb-1 text-[10px] text-white opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 hover:underline"
      >
        {t("by", { author: photo.author })}
      </a>
    </div>
  );
}

export function PhotosPanel() {
  const t = useTranslations("studio.photos");
  const locale = useLocale();
  const onError = useApiErrorToast();
  const capabilities = useCapabilities();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("all");
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), 400);
    return () => clearTimeout(id);
  }, [input]);

  // L'orientation ne filtre que les recherches (la sélection du moment est mélangée).
  const filter = query ? orientation : "all";
  const photos = useInfiniteQuery({
    queryKey: qk.photos(query, filter),
    queryFn: ({ pageParam }) => api.library.photos({ q: query || undefined, page: pageParam, orientation: filter === "all" ? undefined : filter, locale }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore && last.page < 50 ? last.page + 1 : undefined),
    enabled: capabilities.data?.photos === true,
    staleTime: 10 * 60_000,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  });

  if (capabilities.isPending) {
    return <Loader2 className="mx-auto mt-8 size-5 animate-spin text-muted-foreground" aria-hidden="true" />;
  }
  if (!capabilities.data?.photos || (photos.error instanceof ApiError && photos.error.code === "NOT_AVAILABLE")) return <Unavailable />;

  const add = async (photo: LibraryPhoto) => {
    setAdding(photo.id);
    try {
      placeImages([await prepareImage(await api.library.photoFile(photo.id))]);
      toast.success(t("added"));
    } catch (error) {
      onError(error);
    } finally {
      setAdding(null);
    }
  };

  const list = photos.data?.pages.flatMap((page) => page.photos) ?? [];
  // Une photo peut glisser d'une page à l'autre entre deux appels : pas de doublon à l'écran.
  const unique = [...new Map(list.map((photo) => [photo.id, photo])).values()];
  // Mosaïque en deux colonnes équilibrées : chaque photo va dans la plus courte, et une page
  // ajoutée (« Voir plus ») complète les colonnes sans déplacer les vignettes déjà affichées.
  const columns: LibraryPhoto[][] = [[], []];
  const heights = [0, 0];
  for (const photo of unique) {
    const column = heights[0]! <= heights[1]! ? 0 : 1;
    columns[column]!.push(photo);
    heights[column]! += photo.height / photo.width;
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") setQuery(input.trim());
          }}
          placeholder={t("placeholder")}
          aria-label={t("search")}
          maxLength={80}
          className="pr-8 pl-8"
        />
        {input && (
          <button type="button" onClick={() => setInput("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label={t("clear")}>
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {query ? (
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={t("orientation")}>
          {ORIENTATIONS.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={orientation === o}
              onClick={() => setOrientation(o)}
              className={cn("rounded-full border px-2.5 py-0.5 text-[11px] transition", orientation === o ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:border-primary/50")}
            >
              {t(`orientations.${o}`)}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {(t.raw("suggestions") as string[]).map((word) => (
            <button key={word} type="button" onClick={() => setInput(word)} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground">
              {word}
            </button>
          ))}
        </div>
      )}

      <h3 className="text-xs font-semibold">{query ? t("results", { q: query }) : t("curated")}</h3>

      {photos.isPending ? (
        <div className="grid grid-cols-2 gap-1.5" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted" style={{ aspectRatio: i % 3 ? "3 / 4" : "4 / 3" }} />
          ))}
        </div>
      ) : photos.isError ? (
        <div className="grid justify-items-center gap-2 py-6 text-center text-xs text-muted-foreground">
          {t("error")}
          <Button size="sm" variant="outline" onClick={() => photos.refetch()}>
            <RotateCw />
            {t("retry")}
          </Button>
        </div>
      ) : unique.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 items-start gap-1.5">
            {columns.map((column, index) => (
              <div key={index} className="grid gap-1.5">
                {column.map((photo) => (
                  <PhotoTile key={photo.id} photo={photo} busy={adding === photo.id} disabled={adding !== null} onAdd={() => add(photo)} />
                ))}
              </div>
            ))}
          </div>
          {photos.hasNextPage && (
            <Button variant="outline" size="sm" onClick={() => photos.fetchNextPage()} disabled={photos.isFetchingNextPage}>
              {photos.isFetchingNextPage && <Loader2 className="animate-spin" />}
              {t("more")}
            </Button>
          )}
        </>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
          {t("provided")}
        </a>
        {" · "}
        {t("license")}
      </p>
    </div>
  );
}
