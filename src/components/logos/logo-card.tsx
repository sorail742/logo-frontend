"use client";

import { useTranslations } from "next-intl";
import { Heart, Lock, PenLine, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoPreview } from "@/components/brand/logo-preview";
import { SvgView } from "@/components/brand/svg-view";
import { sanitizeSvg } from "@/lib/render/svg";
import type { Logo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LogoMockups } from "./logo-mockups";

export type RelaunchKind = "simpler" | "otherIcon" | "sameColors";

export function LogoCard({
  logo,
  pid,
  canEdit,
  onFavorite,
  onRelaunch,
}: {
  logo: Logo;
  pid: string;
  canEdit: boolean;
  onFavorite: () => void;
  onRelaunch: (kind: RelaunchKind) => void;
}) {
  const t = useTranslations("logos");
  const tc = useTranslations("common.actions");
  const spec = logo.current.spec;
  // Logo importé : son SVG d'origine (nettoyé par l'API, puis ici) plutôt que la recomposition.
  const original = logo.engine === "UPLOAD" && logo.current.svg ? sanitizeSvg(logo.current.svg) : null;
  return (
    <article
      className={cn(
        "glow-card glow-card-3d glow-card-shimmer group border-border/80 bg-card hover:border-primary/50 grid gap-3.5 rounded-2xl border p-4 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl",
        logo.isFavorite && "border-primary/70 ring-primary/30 shadow-lg ring-2",
      )}
    >
      <div className="relative">
        {original ? (
          <SvgView svg={original} label={spec.text} className="bg-checker aspect-[16/9] rounded-lg p-3" />
        ) : (
          <LogoPreview
            spec={spec}
            className="aspect-[16/9] rounded-lg transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary">{t(`types.${logo.type}`)}</Badge>
          {logo.isExclusive && (
            <Badge>
              <Lock />
              {t("exclusive")}
            </Badge>
          )}
        </div>
      </div>
      <LogoMockups spec={spec} compact />
      <div className="flex items-center gap-1.5">
        {canEdit && (
          <>
            <Link
              href={`/app/projets/${pid}/logos/${logo.id}`}
              className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[0.8rem] font-medium"
            >
              <PenLine className="size-3.5" />
              {t("edit")}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <RefreshCw />
                {tc("regenerate")}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(["simpler", "otherIcon", "sameColors"] as const).map((kind) => (
                  <DropdownMenuItem key={kind} onClick={() => onRelaunch(kind)}>
                    {t(`relaunch.${kind}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          onClick={onFavorite}
          disabled={!canEdit}
          aria-pressed={logo.isFavorite}
          aria-label={t("favorite")}
        >
          <Heart className={cn(logo.isFavorite && "fill-red-500 text-red-500")} />
        </Button>
      </div>
    </article>
  );
}
