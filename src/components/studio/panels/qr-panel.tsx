"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { QrCode } from "lucide-react";
import { SvgView } from "@/components/brand/svg-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contrastRatio } from "@/lib/render/color";
import { qrSvg, vcard, whatsappLink, wifiPayload } from "@/lib/render/qr";
import { createSvg } from "@/lib/studio/doc";
import { cn } from "@/lib/utils";
import { useStudioContext } from "../context";
import { addCentered, pageUnit } from "../placement";

// QR codes : lien, conversation WhatsApp, fiche contact (vCard) ou accès Wi-Fi, posés sur la
// création. Fond blanc et marge de silence inclus : le code reste lisible sur toute couleur.

type QrKind = "link" | "whatsapp" | "contact" | "wifi";
const KINDS: QrKind[] = ["link", "whatsapp", "contact", "wifi"];

type Fields = Record<string, string>;

function payload(kind: QrKind, f: Fields): string | null {
  switch (kind) {
    case "link": {
      const url = f.url?.trim();
      if (!url) return null;
      return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
    }
    case "whatsapp":
      return f.phone?.replace(/\D/g, "") ? whatsappLink(f.phone, f.message?.trim()) : null;
    case "contact":
      return f.name?.trim() && (f.phone?.trim() || f.email?.trim() || f.website?.trim())
        ? vcard({ fullName: f.name.trim(), organization: f.organization?.trim(), phone: f.phone?.trim(), email: f.email?.trim(), website: f.website?.trim() })
        : null;
    case "wifi":
      return f.ssid?.trim() ? wifiPayload(f.ssid.trim(), f.password ?? "") : null;
  }
}

const FIELDS: Record<QrKind, { id: string; type?: string }[]> = {
  link: [{ id: "url", type: "url" }],
  whatsapp: [{ id: "phone", type: "tel" }, { id: "message" }],
  contact: [{ id: "name" }, { id: "organization" }, { id: "phone", type: "tel" }, { id: "email", type: "email" }, { id: "website", type: "url" }],
  wifi: [{ id: "ssid" }, { id: "password" }],
};

export function QrPanel() {
  const t = useTranslations("studio.qr");
  const { brand } = useStudioContext();
  const [kind, setKind] = useState<QrKind>("link");
  const [fields, setFields] = useState<Fields>({ organization: brand?.name ?? "" });
  const [useBrand, setUseBrand] = useState(false);

  // Couleur de la marque seulement si elle contraste assez avec le fond blanc du code.
  const brandInk = brand && contrastRatio(brand.colors.primary, "#ffffff") >= 4.5 ? brand.colors.primary : null;
  const color = useBrand && brandInk ? brandInk : "#111111";
  const content = payload(kind, fields);
  const svg = useMemo(() => {
    if (!content) return null;
    try {
      return qrSvg(content, { color, level: "M", margin: 2 });
    } catch {
      return null;
    }
  }, [content, color]);

  const add = () => {
    if (!svg) return;
    const size = pageUnit() * 0.24;
    addCentered([createSvg(svg, "graphic", { width: size, height: size, role: "info", name: t(`kinds.${kind}`) })]);
  };

  return (
    <div className="grid gap-4">
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("help")}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {KINDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={cn("rounded-lg border px-2 py-1.5 text-xs", kind === option ? "border-primary bg-accent font-medium" : "hover:bg-muted")}
          >
            {t(`kinds.${option}`)}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {FIELDS[kind].map((field) => (
          <label key={field.id} className="grid gap-1 text-xs">
            <span className="text-muted-foreground">{t(`fields.${field.id}`)}</span>
            <Input
              type={field.type ?? "text"}
              value={fields[field.id] ?? ""}
              onChange={(e) => setFields((current) => ({ ...current, [field.id]: e.target.value }))}
              placeholder={t(`placeholders.${field.id}`)}
              className="h-8 text-xs"
            />
          </label>
        ))}
      </div>
      {brandInk && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={useBrand} onChange={(e) => setUseBrand(e.target.checked)} />
          {t("brandColor")}
        </label>
      )}
      <div className="flex aspect-square items-center justify-center rounded-lg border bg-white p-3">
        {svg ? <SvgView svg={svg} label={t("preview")} className="size-full" /> : <QrCode className="size-10 text-muted-foreground/40" aria-hidden="true" />}
      </div>
      <Button onClick={add} disabled={!svg}>
        {t("add")}
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("printTip")}</p>
    </div>
  );
}
