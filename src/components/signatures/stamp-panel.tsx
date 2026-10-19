"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SvgView } from "@/components/brand/svg-view";
import { CreditCost } from "@/components/common/credit-cost";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { CREDIT_COSTS } from "@/lib/credits";
import { downloadBlob, downloadSvg, svgToPngBlob } from "@/lib/render/export";
import { renderLogoSvg } from "@/lib/render/logo";
import { findOfficialTerms, renderStampSvg } from "@/lib/render/stamp";
import type { LogoSpec, Signature, StampData } from "@/lib/types";
import { Attestation } from "./attestation";
import { InkPicker } from "./handwritten-panel";

/** Symbole du logo, sans balise <svg> racine, pour le centre du cachet. */
function logoMark(spec: LogoSpec | null, size: number) {
  if (!spec) return undefined;
  const { svg, width, height } = renderLogoSvg({ ...spec, colors: { primary: "#000", secondary: "#000", text: "#000", background: "#fff" } }, { layout: "icon", variant: "black" });
  const scale = size / Math.max(width, height);
  return `<g transform="scale(${scale})">${svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "").replace(/<title>.*?<\/title>/, "")}</g>`;
}

export function StampPanel({
  initial,
  logoSpec,
  canEdit,
  saving,
  existing,
  onSave,
}: {
  initial: StampData;
  logoSpec: LogoSpec | null;
  canEdit: boolean;
  saving: boolean;
  existing: Signature | null;
  onSave: (data: StampData, attested: boolean) => Promise<Signature | null>;
}) {
  const t = useTranslations("signatures");
  const [data, setData] = useState<StampData>(initial);
  const [attested, setAttested] = useState(false);
  const [status, setStatus] = useState(existing?.status ?? null);
  const set = <K extends keyof StampData>(key: K, value: StampData[K]) => setData((d) => ({ ...d, [key]: value }));

  const svg = useMemo(() => renderStampSvg(data, { idPrefix: "stamp-editor", logoMarkup: logoMark(logoSpec, 70) }), [data, logoSpec]);
  const terms = findOfficialTerms(data.ringText, data.bottomText, data.centerText);

  const save = async () => {
    if (!attested) return toast.error(t("security.attestRequired"));
    const signature = await onSave(data, attested);
    if (!signature) return;
    setStatus(signature.status);
    if (signature.status === "PENDING_REVIEW") toast.warning(t("stamp.pending", { terms: terms.join(", ") }));
    else toast.success(t("stamp.saved"));
  };

  const exportable = status === "ACTIVE";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardContent className="grid gap-4">
          <Field label={t("stamp.shape")} htmlFor="stamp-shape">
            <NativeSelect id="stamp-shape" value={data.shape} onChange={(e) => set("shape", e.target.value as StampData["shape"])}>
              {(["round", "oval", "rectangle"] as const).map((shape) => (
                <option key={shape} value={shape}>
                  {t(`stamp.shapes.${shape}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("stamp.ringText")} htmlFor="stamp-ring">
            <Input id="stamp-ring" value={data.ringText} maxLength={48} onChange={(e) => set("ringText", e.target.value)} />
          </Field>
          <Field label={t("stamp.bottomText")} htmlFor="stamp-bottom">
            <Input id="stamp-bottom" value={data.bottomText} maxLength={40} onChange={(e) => set("bottomText", e.target.value)} />
          </Field>
          <Field label={t("stamp.center")} htmlFor="stamp-center-mode">
            <NativeSelect id="stamp-center-mode" value={data.centerMode} onChange={(e) => set("centerMode", e.target.value as StampData["centerMode"])}>
              {(["acronym", "title", "logo"] as const).map((mode) => (
                <option key={mode} value={mode} disabled={mode === "logo" && !logoSpec}>
                  {t(`stamp.centerModes.${mode}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {data.centerMode !== "logo" && (
            <Field label={t("stamp.centerText")} htmlFor="stamp-center">
              <Input id="stamp-center" value={data.centerText} maxLength={30} onChange={(e) => set("centerText", e.target.value)} />
            </Field>
          )}
          <Field label={t("stamp.ink")}>
            <InkPicker value={data.ink} onChange={(ink) => set("ink", ink)} />
          </Field>
          <label className="flex items-center justify-between text-sm">
            {t("stamp.inkEffect")}
            <Switch checked={data.inkEffect} onCheckedChange={(checked) => set("inkEffect", checked)} />
          </label>
          {terms.length > 0 && (
            <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100" role="alert">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              {t("stamp.officialWarning", { terms: terms.join(", ") })}
            </p>
          )}
        </CardContent>
      </Card>
      <div className="grid content-start gap-4">
        <SvgView svg={svg} className="bg-checker aspect-square rounded-xl border p-6" label={data.ringText} />
        {status === "PENDING_REVIEW" && <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-950">{t("stamp.pendingStatus")}</p>}
        {status === "REJECTED" && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-900">{t("stamp.rejected")}</p>}
        <Attestation checked={attested} onChange={setAttested} />
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={saving || !data.ringText.trim()}>
              <Save />
              {t("stamp.save")}
            </Button>
            <CreditCost cost={CREDIT_COSTS.HANDWRITTEN_OR_STAMP} />
            <Button variant="outline" disabled={!exportable} onClick={() => downloadSvg(svg, "cachet.svg")} title={exportable ? undefined : t("export.requiresSave")}>
              <Download />
              {t("export.svg")}
            </Button>
            <Button
              variant="outline"
              disabled={!exportable}
              onClick={async () => downloadBlob(await svgToPngBlob(svg, { size: 2400 }), "cachet.png")}
              title={exportable ? undefined : t("export.requiresSave")}
            >
              <Download />
              {t("export.png")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
