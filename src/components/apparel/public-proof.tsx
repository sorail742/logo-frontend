"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { BadgeCheck, CircleAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/api/errors";
import { viewsOf } from "@/lib/apparel/garments";
import type { ApparelStatus } from "@/lib/apparel/types";
import { ensureFonts } from "@/lib/studio/text";
import { GarmentPreview } from "./garment-view";
import { STATUS_VARIANT } from "./status";

// BAT consulté par le client sans compte (lien /bat/<jeton>) : vues du vêtement avec les
// impressions, technique, effectif, puis approbation signée (nom, horodatage, adresse IP).

/** Approbation signée : nom et fonction, case de confirmation ; état si déjà traité. */
function Approval({
  token,
  status,
  approvedAt,
  onApproved,
}: {
  token: string;
  status: ApparelStatus;
  approvedAt: string | null;
  onApproved(): void;
}) {
  const t = useTranslations("apparel.public");
  const format = useFormatter();
  const [approver, setApprover] = useState("");
  const [checked, setChecked] = useState(false);
  const approve = useMutation({
    mutationFn: () => api.apparel.approveProof(token, approver.trim()),
    onSuccess: onApproved,
  });

  if (status === "APPROVED" || status === "IN_PRODUCTION") {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
        <BadgeCheck className="size-5" aria-hidden="true" />
        {t("approvedOn", {
          date: approvedAt
            ? format.dateTime(new Date(approvedAt), { dateStyle: "long", timeStyle: "short" })
            : "",
        })}
      </p>
    );
  }
  if (status !== "PROOF_SENT") return <p className="text-muted-foreground mt-3 text-sm">{t("notPending")}</p>;
  return (
    <form
      className="mt-3 grid gap-3 sm:max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        approve.mutate();
      }}
    >
      <p className="text-muted-foreground text-sm">{t("approvalHint")}</p>
      <label className="grid gap-1 text-sm font-medium">
        {t("approver")}
        <Input
          value={approver}
          onChange={(e) => setApprover(e.target.value)}
          minLength={2}
          maxLength={120}
          required
          placeholder={t("approverPlaceholder")}
        />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => setChecked(Boolean(value))}
          className="mt-0.5"
        />
        {t("confirm")}
      </label>
      {approve.error && <p className="text-destructive text-sm">{errorMessage(approve.error)}</p>}
      <Button type="submit" size="lg" disabled={!checked || approver.trim().length < 2 || approve.isPending}>
        {approve.isPending ? <Loader2 className="animate-spin" /> : <BadgeCheck />} {t("approve")}
      </Button>
    </form>
  );
}

export function PublicProof() {
  const t = useTranslations("apparel");
  const { token } = useParams<{ token: string }>();
  const proof = useQuery({
    queryKey: ["public-proof", token],
    queryFn: () => api.apparel.publicProof(token),
    retry: false,
  });

  const data = proof.data;
  useEffect(() => {
    if (data)
      void ensureFonts(
        data.elements
          .filter((e) => e.content.fontId)
          .map((e) => ({ fontId: e.content.fontId!, fontWeight: e.content.fontWeight ?? 700 })),
      );
  }, [data]);

  if (proof.isLoading) {
    return (
      <div className="grid gap-4" role="status" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-[2/1] w-full rounded-2xl" />
      </div>
    );
  }
  if (proof.error || !data) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border p-8 text-center">
        <CircleAlert className="text-muted-foreground mx-auto mb-3 size-8" aria-hidden="true" />
        <p className="font-semibold">{t("public.notFound")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("public.notFoundBody")}</p>
      </div>
    );
  }

  const used = new Set(data.elements.map((e) => data.template.zones.find((z) => z.key === e.zoneKey)?.view));
  const views = viewsOf(data.template).filter(
    (v) => v !== "OTHER" && (used.has(v) || v === "FRONT" || v === "BACK"),
  );
  const sizes = data.roster?.entries.reduce<Record<string, number>>(
    (acc, e) => ({ ...acc, [e.size]: (acc[e.size] ?? 0) + e.quantity }),
    {},
  );

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("public.kicker")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            {data.template.name} · {t(`techniques.${data.technique}.name`)} ·
            <span className="inline-flex items-center gap-1">
              <span
                className="size-3.5 rounded-full border"
                style={{ background: data.garmentColor }}
                aria-hidden="true"
              />
              {data.garmentColor.toUpperCase()}
            </span>
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[data.status]}>{t(`status.${data.status}`)}</Badge>
      </header>

      <section className="grid gap-4 sm:grid-cols-2" aria-label={t("public.views")}>
        {views.map((view) => (
          <figure key={view} className="bg-muted/50 grid gap-2 rounded-2xl p-4">
            <GarmentPreview
              category={data.template.category}
              view={view}
              color={data.garmentColor}
              zones={data.template.zones}
              elements={data.elements}
              className="mx-auto aspect-square w-full max-w-md"
              label={t(`views.${view}`)}
            />
            <figcaption className="text-center text-sm font-medium">{t(`views.${view}`)}</figcaption>
          </figure>
        ))}
      </section>
      <p className="text-muted-foreground text-xs">{t("public.screenNotice")}</p>

      {data.roster && (
        <section className="grid gap-3" aria-labelledby="proof-roster">
          <h2 id="proof-roster" className="text-lg font-semibold">
            {t("public.roster", { name: data.roster.name })}
          </h2>
          <p className="text-muted-foreground text-sm">
            {Object.entries(sizes ?? {})
              .map(([size, count]) => `${size} × ${count}`)
              .join(" · ")}
          </p>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("public.printedName")}</th>
                  <th className="px-3 py-2 font-medium">{t("public.number")}</th>
                  <th className="px-3 py-2 font-medium">{t("public.size")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("public.quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {data.roster.entries.map((e, i) => (
                  <tr key={`${e.displayName}-${e.number ?? i}`} className="border-t">
                    <td className="px-3 py-1.5 font-medium">{e.displayName}</td>
                    <td className="px-3 py-1.5 tabular-nums">{e.number ?? "—"}</td>
                    <td className="px-3 py-1.5">{e.size}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{e.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border p-5" aria-labelledby="proof-approval">
        <h2 id="proof-approval" className="text-lg font-semibold">
          {t("public.approval")}
        </h2>
        <Approval
          token={token}
          status={data.status}
          approvedAt={data.approvedAt}
          onApproved={() => void proof.refetch()}
        />
      </section>
    </div>
  );
}
