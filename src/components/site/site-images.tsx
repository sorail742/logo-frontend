"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MOCKUP_SCENES, mockupSvg } from "@/lib/render/mockups";
import type { BrandAssets } from "@/lib/render/compose";
import type { SiteImage } from "@/lib/render/site";
import type { WebsiteMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;
/** Au-delà, la photo est réduite dans le navigateur avant l'envoi. */
const MAX_SIDE = 1600;
const LIGHT_BYTES = 1.5 * 1024 * 1024;

const thumbnails = new WeakMap<BrandAssets, Map<string, string>>();

/** Vignette d'une mise en situation (SVG en data URL), gardée pour une même marque. */
export function mockupThumbnail(assets: BrandAssets | undefined, sceneId: string) {
  const scene = MOCKUP_SCENES.find((s) => s.id === sceneId);
  if (!assets || !scene) return "";
  let cache = thumbnails.get(assets);
  if (!cache) {
    cache = new Map();
    thumbnails.set(assets, cache);
  }
  let url = cache.get(sceneId);
  if (!url) {
    url = `data:image/svg+xml,${encodeURIComponent(mockupSvg(assets, scene))}`;
    cache.set(sceneId, url);
  }
  return url;
}

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

/** Photo prête à l'envoi : gardée telle quelle si elle est légère, sinon réduite en JPEG. */
export async function prepareImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= LIGHT_BYTES) {
    bitmap.close();
    return readAsDataUrl(file);
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.86);
}

function sameImage(a: SiteImage, b: SiteImage) {
  return a.kind === "media" ? b.kind === "media" && a.id === b.id : b.kind === "mockup" && a.scene === b.scene;
}

function Tile({
  src,
  label,
  selected,
  disabled,
  onClick,
  onRemove,
  removeLabel,
}: {
  src: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        title={label}
        onClick={onClick}
        className={cn(
          "block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 bg-muted transition",
          selected ? "border-primary" : "border-transparent hover:border-muted-foreground/40",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- vignette locale (data URL) ou image servie par l'API
          <img src={src} alt={label} className="size-full object-cover" loading="lazy" />
        ) : (
          <span className="text-xs">{label}</span>
        )}
        {selected && (
          <span className="absolute top-1 left-1 rounded-full bg-primary p-0.5 text-primary-foreground">
            <Check className="size-3" aria-hidden="true" />
          </span>
        )}
      </button>
      {onRemove && !disabled && (
        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          className="absolute top-1 right-1 opacity-80 group-hover:opacity-100"
          aria-label={removeLabel}
          title={removeLabel}
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}

/**
 * Choix des visuels : mises en situation du logo et photos téléversées. Sélection simple (accueil,
 * avec « symbole du logo ») ou multiple (galerie, dans l'ordre des clics).
 */
export function ImagePicker({
  assets,
  media,
  value,
  onChange,
  multiple = false,
  max = 16,
  disabled,
  onUpload,
  onRemoveMedia,
}: {
  assets?: BrandAssets;
  media: WebsiteMedia[];
  value: SiteImage[];
  onChange: (images: SiteImage[]) => void;
  multiple?: boolean;
  max?: number;
  disabled: boolean;
  onUpload: (dataUrl: string, alt: string) => Promise<void>;
  onRemoveMedia: (id: string) => void;
}) {
  const t = useTranslations("site.images");
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const toggle = (image: SiteImage) => {
    const selected = value.some((v) => sameImage(v, image));
    if (!multiple) return onChange(selected ? [] : [image]);
    if (selected) return onChange(value.filter((v) => !sameImage(v, image)));
    if (value.length < max) onChange([...value, image]);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(t("badType"));
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await prepareImage(file);
      if (dataUrl.length * 0.75 > MAX_BYTES) toast.error(t("tooLarge"));
      else await onUpload(dataUrl, file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 160));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="grid gap-3">
      {!multiple && (
        <button
          type="button"
          disabled={disabled}
          aria-pressed={value.length === 0}
          onClick={() => onChange([])}
          className={cn(
            "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm",
            value.length === 0 ? "border-primary" : "border-transparent bg-muted hover:border-muted-foreground/40",
          )}
        >
          {value.length === 0 && <Check className="size-4 text-primary" aria-hidden="true" />}
          {t("none")}
        </button>
      )}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("mockups")}</p>
        <div className="grid grid-cols-4 gap-2">
          {MOCKUP_SCENES.map((scene) => {
            const image: SiteImage = { kind: "mockup", scene: scene.id };
            return (
              <Tile
                key={scene.id}
                src={mockupThumbnail(assets, scene.id)}
                label={t(`scenes.${scene.id}`)}
                selected={value.some((v) => sameImage(v, image))}
                disabled={disabled}
                onClick={() => toggle(image)}
              />
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("uploads")}</p>
        <div className="grid grid-cols-4 gap-2">
          {media.map((item) => {
            const image: SiteImage = { kind: "media", id: item.id, alt: item.alt };
            return (
              <Tile
                key={item.id}
                src={item.url}
                label={item.alt || t("uploads")}
                selected={value.some((v) => sameImage(v, image))}
                disabled={disabled}
                onClick={() => toggle(image)}
                onRemove={() => onRemoveMedia(item.id)}
                removeLabel={t("deleteMedia")}
              />
            );
          })}
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => input.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            {uploading ? t("uploading") : t("upload")}
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(event) => {
            upload(event.target.files?.[0]).catch(() => toast.error(t("badType")));
          }}
        />
      </div>
    </div>
  );
}
