"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Download, Eraser, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SvgView } from "@/components/brand/svg-view";
import { CreditCost } from "@/components/common/credit-cost";
import { Field } from "@/components/common/field";
import { CREDIT_COSTS } from "@/lib/credits";
import { downloadBlob, downloadSvg, svgToPngBlob } from "@/lib/render/export";
import { SCRIPT_FONTS } from "@/lib/render/fonts";
import { INK_COLORS, renderHandwrittenSvg, smoothStroke } from "@/lib/render/stamp";
import type { HandwrittenData, InkColor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Attestation } from "./attestation";

export function InkPicker({ value, onChange }: { value: InkColor; onChange: (ink: InkColor) => void }) {
  const t = useTranslations("signatures.inks");
  return (
    <div className="flex gap-2" role="radiogroup">
      {(Object.keys(INK_COLORS) as InkColor[]).map((ink) => (
        <button
          key={ink}
          type="button"
          role="radio"
          aria-checked={value === ink}
          onClick={() => onChange(ink)}
          className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", value === ink && "border-primary ring-2 ring-primary/30")}
        >
          <span className="size-3.5 rounded-full" style={{ background: INK_COLORS[ink] }} aria-hidden="true" />
          {t(ink)}
        </button>
      ))}
    </div>
  );
}

export function HandwrittenPanel({
  defaultText,
  canEdit,
  saving,
  onSave,
}: {
  defaultText: string;
  canEdit: boolean;
  saving: boolean;
  onSave: (data: HandwrittenData, attested: boolean) => Promise<boolean>;
}) {
  const t = useTranslations("signatures");
  const [mode, setMode] = useState<"font" | "draw">("font");
  const [text, setText] = useState(defaultText);
  const [ink, setInk] = useState<InkColor>("blue");
  const [fontId, setFontId] = useState(SCRIPT_FONTS[0]!.id);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [attested, setAttested] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const drawing = useRef(false);
  const surface = useRef<SVGSVGElement>(null);

  const path = useMemo(() => strokes.map(smoothStroke).join(" "), [strokes]);
  const data: HandwrittenData = mode === "draw" ? { text, fontId, ink, strokes: path } : { text, fontId, ink };
  const svg = renderHandwrittenSvg(data);

  const point = (event: PointerEvent<SVGSVGElement>) => {
    const rect = surface.current!.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 600, y: ((event.clientY - rect.top) / rect.height) * 240 };
  };

  const save = async () => {
    if (!attested) return toast.error(t("security.attestRequired"));
    if (await onSave(data, attested)) {
      setSavedOnce(true);
      toast.success(t("handwritten.saved"));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardContent className="grid gap-4">
          <div className="flex gap-2" role="tablist">
            {(["font", "draw"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={cn("rounded-lg px-3 py-1.5 text-sm", mode === value ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-muted")}
              >
                {t(`handwritten.modes.${value}`)}
              </button>
            ))}
          </div>
          {mode === "font" ? (
            <>
              <Field label={t("handwritten.text")} htmlFor="hw-text">
                <Input id="hw-text" value={text} maxLength={30} onChange={(e) => setText(e.target.value)} />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                {SCRIPT_FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    aria-pressed={fontId === font.id}
                    onClick={() => setFontId(font.id)}
                    className={cn("rounded-lg border p-1", fontId === font.id ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted")}
                    title={font.name}
                  >
                    <SvgView svg={renderHandwrittenSvg({ text: text || "Paraphe", fontId: font.id, ink })} className="h-16" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid gap-2">
              <p className="text-xs text-muted-foreground">{t("handwritten.drawHint")}</p>
              <svg
                ref={surface}
                viewBox="0 0 600 240"
                className="bg-checker aspect-[5/2] w-full touch-none rounded-lg border"
                onPointerDown={(event) => {
                  drawing.current = true;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setStrokes((s) => [...s, [point(event)]]);
                }}
                onPointerMove={(event) => {
                  if (!drawing.current) return;
                  const p = point(event);
                  setStrokes((s) => [...s.slice(0, -1), [...s[s.length - 1]!, p]]);
                }}
                onPointerUp={() => (drawing.current = false)}
                role="img"
                aria-label={t("handwritten.drawHint")}
              >
                <path d={path} fill="none" stroke={INK_COLORS[ink]} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setStrokes([])}>
                <Eraser />
                {t("handwritten.clear")}
              </Button>
            </div>
          )}
          <Field label={t("handwritten.ink")}>
            <InkPicker value={ink} onChange={setInk} />
          </Field>
        </CardContent>
      </Card>
      <div className="grid content-start gap-4">
        <SvgView svg={svg} className="bg-checker aspect-[5/2] rounded-xl border" label={text} />
        <Attestation checked={attested} onChange={setAttested} />
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={saving || (mode === "draw" ? !path : !text.trim())}>
              <Save />
              {t("handwritten.save")}
            </Button>
            <CreditCost cost={CREDIT_COSTS.HANDWRITTEN_OR_STAMP} />
            <Button variant="outline" disabled={!savedOnce} onClick={() => downloadSvg(svg, "paraphe.svg")} title={savedOnce ? undefined : t("export.requiresSave")}>
              <Download />
              {t("export.svg")}
            </Button>
            <Button
              variant="outline"
              disabled={!savedOnce}
              onClick={async () => downloadBlob(await svgToPngBlob(svg, { size: 2400 }), "paraphe.png")}
              title={savedOnce ? undefined : t("export.requiresSave")}
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
