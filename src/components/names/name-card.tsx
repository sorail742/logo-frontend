"use client";

import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Ban, CheckCircle2, ExternalLink, Heart, Loader2, Search, Sparkles, ThumbsDown, ThumbsUp, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SvgView } from "@/components/brand/svg-view";
import { renderLogoSvg } from "@/lib/render/logo";
import { namePreviewSpecs } from "@/lib/render/name-previews";
import type { AvailabilityCheck, Brief, CheckStatus, NameSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CheckStatus, string> = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  TAKEN: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  UNKNOWN: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

function CheckPill({ check }: { check: AvailabilityCheck }) {
  const t = useTranslations("names");
  const content = (
    <>
      <span className="font-medium">{check.target}</span>
      <span className="opacity-80">· {t(`status.${check.status}`)}</span>
    </>
  );
  const className = cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs", STATUS_STYLES[check.status]);
  return check.url && check.kind === "DOMAIN" ? (
    <a href={check.url} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <span className={className}>{content}</span>
  );
}

export function AvailabilityResults({ checks }: { checks: AvailabilityCheck[] }) {
  const t = useTranslations("names");
  const format = useFormatter();
  if (!checks.length) return null;
  const domains = checks.filter((c) => c.kind === "DOMAIN");
  const socials = checks.filter((c) => c.kind === "SOCIAL");
  const trademarks = checks.filter((c) => c.kind === "TRADEMARK");
  const phonetic = checks.find((c) => c.kind === "PHONETIC");
  return (
    <div className="grid gap-3 border-t pt-3 text-sm">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("domains")}</p>
        <div className="flex flex-wrap gap-1.5">
          {domains.map((check) => (
            <CheckPill key={check.target} check={check} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("socials")}</p>
        <div className="flex flex-wrap gap-1.5">
          {socials.map((check) => (
            <CheckPill key={check.target} check={check} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("trademarks")}</p>
        <div className="flex flex-wrap gap-2">
          {trademarks.map((check) => (
            <a key={check.target} href={check.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              {t("trademarkSearch", { base: check.target })}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
      {phonetic && (
        <p className="text-xs">
          <span className="font-medium text-muted-foreground">{t("phonetic")} : </span>
          {phonetic.status === "TAKEN" ? t("phoneticTaken", { name: phonetic.target }) : t("phoneticOk")}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("checkedAt", { date: format.dateTime(new Date(checks[0]!.checkedAt), { dateStyle: "medium", timeStyle: "short" }) })} · {t("disclaimer")}
      </p>
    </div>
  );
}

/** Le nom mis en forme en trois pistes de logo, pour le juger en situation. */
function NameLogoPreviews({ value, brief }: { value: string; brief?: Brief | null }) {
  const t = useTranslations("names");
  const svgs = useMemo(() => namePreviewSpecs(value, brief).map((spec) => renderLogoSvg(spec).svg), [value, brief]);
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("logoPreviews")}>
      {svgs.map((svg, index) => (
        <SvgView key={index} svg={svg} className="aspect-[4/3] rounded-lg border bg-white p-2" />
      ))}
    </div>
  );
}

export function NameCard({
  name,
  brief,
  isChosen,
  canEdit,
  canVote,
  checking,
  compareSelected,
  onFavorite,
  onReject,
  onCheck,
  onSimilar,
  onChoose,
  onVote,
  onToggleCompare,
}: {
  name: NameSuggestion;
  brief?: Brief | null;
  isChosen: boolean;
  canEdit: boolean;
  canVote: boolean;
  checking: boolean;
  compareSelected: boolean;
  onFavorite: () => void;
  onReject: () => void;
  onCheck: () => void;
  onSimilar: () => void;
  onChoose: () => void;
  onVote: (value: -1 | 1) => void;
  onToggleCompare: () => void;
}) {
  const t = useTranslations("names");
  return (
    <article className={cn("grid gap-3 rounded-xl border bg-card p-4", isChosen && "border-primary ring-2 ring-primary/30", name.isRejected && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight break-words">{name.value}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{t(`styles.${name.style}`)}</Badge>
            {isChosen && (
              <Badge>
                <CheckCircle2 />
                {t("chosen")}
              </Badge>
            )}
          </div>
        </div>
        {canEdit && !name.isRejected && (
          <Button variant="ghost" size="icon" onClick={onFavorite} aria-pressed={name.isFavorite} aria-label={name.isFavorite ? t("unfavorite") : t("favorite")}>
            <Heart className={cn(name.isFavorite && "fill-red-500 text-red-500")} />
          </Button>
        )}
      </div>
      {!name.isRejected && <NameLogoPreviews value={name.value} brief={brief} />}
      <p className="text-sm">{name.meaning}</p>
      <div className="grid gap-1 text-xs text-muted-foreground">
        {name.pronunciation && <p>{t("pronunciation", { value: name.pronunciation })}</p>}
        {name.score != null && (
          <div className="flex items-center gap-2">
            <span>{t("score", { score: name.score })}</span>
            <span className="h-1.5 flex-1 rounded-full bg-muted">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${name.score}%` }} />
            </span>
          </div>
        )}
      </div>

      {checking ? (
        <p className="flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t("checking")}
        </p>
      ) : (
        <AvailabilityResults checks={name.checks} />
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
        {canEdit && !name.isRejected && (
          <>
            {!name.checks.length && (
              <Button variant="outline" size="sm" onClick={onCheck} disabled={checking}>
                <Search />
                {t("check")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onSimilar}>
              <Sparkles />
              {t("similar")}
            </Button>
            {!isChosen && (
              <Button size="sm" onClick={onChoose}>
                {t("choose")}
              </Button>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {name.isFavorite && (
            <label className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Checkbox checked={compareSelected} onCheckedChange={onToggleCompare} aria-label={t("compareTitle")} />
              {t("compareShort")}
            </label>
          )}
          {canVote && name.isFavorite && (
            <>
              <Button variant={name.myVote === 1 ? "secondary" : "ghost"} size="icon-sm" onClick={() => onVote(1)} aria-label={`${t("vote")} +1`}>
                <ThumbsUp />
              </Button>
              <span className="min-w-4 text-center text-xs tabular-nums">{name.votes}</span>
              <Button variant={name.myVote === -1 ? "secondary" : "ghost"} size="icon-sm" onClick={() => onVote(-1)} aria-label={`${t("vote")} -1`}>
                <ThumbsDown />
              </Button>
            </>
          )}
          {canEdit && (
            <Button variant="ghost" size="icon-sm" onClick={onReject} aria-label={name.isRejected ? t("unreject") : t("reject")}>
              {name.isRejected ? <Undo2 /> : <Ban />}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
