"use client";

import { useTranslations } from "next-intl";
import { Heart, Lock, PenLine, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogoPreview } from "@/components/brand/logo-preview";
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
  return (
    <article className={cn("grid gap-3 rounded-xl border bg-card p-3", logo.isFavorite && "border-primary/60")}>
      <div className="relative">
        <LogoPreview spec={spec} className="aspect-[16/9] rounded-lg" />
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
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground hover:bg-primary/80"
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
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onFavorite} disabled={!canEdit} aria-pressed={logo.isFavorite} aria-label={t("favorite")}>
          <Heart className={cn(logo.isFavorite && "fill-red-500 text-red-500")} />
        </Button>
      </div>
    </article>
  );
}
