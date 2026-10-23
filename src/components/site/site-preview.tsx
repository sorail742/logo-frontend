"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteSectionType } from "@/lib/render/site";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { closestWeight } from "@/lib/render/fonts";
import { PLATFORM_NAME, renderSiteHtml, type SiteContent, type SiteUrls } from "@/lib/render/site";
import type { Website, WebsiteBrand } from "@/lib/types";
import { cn } from "@/lib/utils";
import { mockupThumbnail } from "./site-images";

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;

/** Page du site rendue dans le navigateur (aperçu non indexé, ou page de démonstration). */
export function buildSiteHtml(website: Website, content: SiteContent, brand: WebsiteBrand, preview = true) {
  const urls: SiteUrls = {
    font: (id, weight, subset) =>
      website.assetsUrl ? `${website.assetsUrl}/site-fonts/${id}/${closestWeight(id, weight)}/${subset}` : null,
    media: (id) => website.media.find((m) => m.id === id)?.url ?? "",
    mockup: (scene) => mockupThumbnail(brand.assets, scene),
    file: () => null,
    form: null,
    canonical: null,
  };
  return renderSiteHtml({
    content: { ...content, credit: content.credit || website.free },
    name: brand.name,
    logo: { color: brand.assets.logo.color.svg, white: brand.assets.logo.white.svg, mark: brand.assets.mark.color.svg },
    urls,
    platform: { name: PLATFORM_NAME, url: typeof window === "undefined" ? "" : window.location.origin },
    preview,
  });
}

/**
 * Page de l'aperçu, recalculée peu après la dernière frappe. Une page identique (sauvegarde sans
 * changement visible) garde la même chaîne : l'iframe ne se recharge pas.
 */
function useSiteHtml(website: Website, content: SiteContent, brand: WebsiteBrand | undefined) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (!brand) return;
    const timer = setTimeout(() => setHtml(buildSiteHtml(website, content, brand)), 150);
    return () => clearTimeout(timer);
  }, [brand, content, website]);
  return brand ? html : "";
}

/**
 * Iframe rendue à la largeur d'un écran réel, réduite à la largeur disponible. La position de
 * lecture survit au rechargement de la page ; `focus` amène la section modifiée à l'écran.
 */
function ScaledFrame({ html, width, title, focus }: { html: string; width: number; title: string; focus?: SiteSectionType | null }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const scrollY = useRef(0);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry?.contentRect.width ?? 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!focus) return;
    frame.current?.contentDocument?.querySelector(`section.${focus}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);

  const onLoad = () => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    win.scrollTo(0, scrollY.current);
    win.addEventListener("scroll", () => (scrollY.current = win.scrollY), { passive: true });
  };

  const scale = available ? Math.min(1, available / width) : 0;
  const height = 720;
  return (
    <div ref={box} className="w-full overflow-hidden" style={{ height: scale ? height : undefined }}>
      {scale > 0 && (
        <iframe
          ref={frame}
          title={title}
          srcDoc={html}
          onLoad={onLoad}
          // Aucun script : l'éditeur lit seulement la position de lecture ; les liens externes s'ouvrent à part.
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="origin-top-left border-0 bg-white"
          style={{
            width,
            height: height / scale,
            transform: `scale(${scale})`,
            marginLeft: Math.max(0, (available - width * scale) / 2),
          }}
        />
      )}
    </div>
  );
}

export function SitePreview({
  website,
  content,
  brand,
  loading,
  focus,
}: {
  website: Website;
  content: SiteContent;
  brand?: WebsiteBrand;
  loading: boolean;
  focus?: SiteSectionType | null;
}) {
  const t = useTranslations("site.preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const html = useSiteHtml(website, content, brand);

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 truncate text-xs text-muted-foreground">{website.url.replace(/^https?:\/\//, "")}</span>
        </div>
        <div className="flex gap-1" role="group" aria-label={t("label")}>
          {(
            [
              ["desktop", Monitor],
              ["mobile", Smartphone],
            ] as const
          ).map(([id, Icon]) => (
            <Button
              key={id}
              type="button"
              size="icon-sm"
              variant={device === id ? "secondary" : "ghost"}
              aria-pressed={device === id}
              aria-label={t(id)}
              title={t(id)}
              onClick={() => setDevice(id)}
            >
              <Icon />
            </Button>
          ))}
        </div>
      </div>
      <div className={cn("p-3", device === "mobile" && "flex justify-center")}>
        {brand && (
          <div className={cn(device === "mobile" && "w-[390px] max-w-full overflow-hidden rounded-[28px] border-8 border-foreground/80")}>
            <ScaledFrame html={html} width={device === "mobile" ? MOBILE_WIDTH : DESKTOP_WIDTH} title={t("label")} focus={focus} />
          </div>
        )}
        {!brand && loading && <Skeleton className="h-[720px] w-full" aria-label={t("loading")} />}
        {!brand && !loading && <p className="p-8 text-center text-sm text-muted-foreground">{t("noLogo")}</p>}
      </div>
    </div>
  );
}
