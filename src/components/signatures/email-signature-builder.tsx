"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ClipboardCopy, FileCode2, Plus, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/field";
import { downloadBlob } from "@/lib/render/export";
import {
  EMAIL_TEMPLATES,
  EMPTY_EMAIL_SIGNATURE,
  renderEmailSignature,
  renderEmailSignatureText,
  type EmailTemplateId,
  type SignatureBrand,
} from "@/lib/render/email-signature";
import { buildZip } from "@/lib/render/zip";
import { slugify } from "@/lib/format";
import type { EmailSignatureData } from "@/lib/types";
import { cn } from "@/lib/utils";

async function copyRich(html: string, text: string) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) }),
    ]);
    return true;
  } catch {
    // Repli : sélection du rendu puis copie
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "fixed";
    container.style.left = "-9999px";
    document.body.appendChild(container);
    const range = document.createRange();
    range.selectNodeContents(container);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    const ok = document.execCommand("copy");
    selection?.removeAllRanges();
    container.remove();
    return ok;
  }
}

/** Lecture CSV simple (séparateur , ou ;, guillemets doubles). */
function parseCsv(source: string) {
  const separator = source.split("\n")[0]!.includes(";") ? ";" : ",";
  const rows = source
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const cells: string[] = [];
      let current = "";
      let quoted = false;
      for (const char of line) {
        if (char === '"') quoted = !quoted;
        else if (char === separator && !quoted) {
          cells.push(current.trim());
          current = "";
        } else current += char;
      }
      cells.push(current.trim());
      return cells;
    });
  const [header = [], ...data] = rows;
  const index = (...keys: string[]) => header.findIndex((h) => keys.includes(h.toLowerCase().trim()));
  const cols = { name: index("nom", "name", "fullname"), title: index("fonction", "title", "poste"), email: index("email", "e-mail"), phone: index("telephone", "téléphone", "phone") };
  return data.map((cells) => ({ fullName: cells[cols.name] ?? "", jobTitle: cells[cols.title] ?? "", email: cells[cols.email] ?? "", phone: cells[cols.phone] ?? "" })).filter((r) => r.fullName);
}

export function EmailSignatureBuilder({
  brand,
  initial,
  initialTemplate = "classic",
  onSave,
  saving,
  batch = "hidden",
}: {
  brand: SignatureBrand;
  initial?: EmailSignatureData;
  initialTemplate?: EmailTemplateId;
  onSave?: (data: EmailSignatureData, templateId: EmailTemplateId) => void;
  saving?: boolean;
  batch?: "enabled" | "locked" | "hidden";
}) {
  const t = useTranslations("signatures.email");
  const [data, setData] = useState<EmailSignatureData>(initial ?? EMPTY_EMAIL_SIGNATURE);
  const [template, setTemplate] = useState<EmailTemplateId>(initialTemplate);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const html = useMemo(() => renderEmailSignature(template, data, brand), [template, data, brand]);
  const text = useMemo(() => renderEmailSignatureText(data, brand), [data, brand]);
  const set = <K extends keyof EmailSignatureData>(key: K, value: EmailSignatureData[K]) => setData((d) => ({ ...d, [key]: value }));

  const copy = async () => {
    if (await copyRich(html, text)) {
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const runBatch = async (file: File | undefined) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    const entries = rows.map((row) => ({
      path: `${slugify(row.fullName) || "membre"}.html`,
      data: `<!doctype html><meta charset="utf-8">${renderEmailSignature(template, { ...data, fullName: row.fullName, jobTitle: row.jobTitle, email: row.email, phones: row.phone ? [row.phone] : [] }, brand)}`,
    }));
    downloadBlob(await buildZip(entries), `signatures-${slugify(brand.name) || "equipe"}.zip`);
    toast.success(t("batchDone", { count: rows.length }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("form")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fullName")} htmlFor="sig-name">
              <Input id="sig-name" value={data.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" />
            </Field>
            <Field label={t("jobTitle")} htmlFor="sig-title">
              <Input id="sig-title" value={data.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} autoComplete="organization-title" />
            </Field>
          </div>
          <Field label={t("phones")} hint={t("phoneHint")}>
            <div className="grid gap-2">
              {data.phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => set("phones", data.phones.map((p, i) => (i === index ? e.target.value : p)))}
                    aria-label={`${t("phones")} ${index + 1}`}
                  />
                  {data.phones.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => set("phones", data.phones.filter((_, i) => i !== index))} aria-label="×">
                      <X />
                    </Button>
                  )}
                </div>
              ))}
              {data.phones.length < 3 && (
                <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => set("phones", [...data.phones, "+224 "])}>
                  <Plus />
                  {t("addPhone")}
                </Button>
              )}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("email")} htmlFor="sig-email">
              <Input id="sig-email" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
            </Field>
            <Field label={t("website")} htmlFor="sig-web">
              <Input id="sig-web" type="url" value={data.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
            </Field>
          </div>
          <Field label={t("address")} htmlFor="sig-address">
            <Input id="sig-address" value={data.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" />
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">{t("socials")}</legend>
            {data.socials.map((social, index) => (
              <Input
                key={social.network}
                type="url"
                value={social.url}
                onChange={(e) => set("socials", data.socials.map((s, i) => (i === index ? { ...s, url: e.target.value } : s)))}
                placeholder={t("socialUrl", { network: social.network })}
                aria-label={t("socialUrl", { network: social.network })}
              />
            ))}
          </fieldset>
          <Field label={t("photo")} htmlFor="sig-photo">
            <Input id="sig-photo" type="url" value={data.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://" />
          </Field>
          <Field label={t("legal")} htmlFor="sig-legal">
            <Textarea id="sig-legal" rows={2} value={data.legal} onChange={(e) => set("legal", e.target.value)} placeholder={t("legalPlaceholder")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("banner")} htmlFor="sig-banner">
              <Input id="sig-banner" type="url" value={data.bannerUrl ?? ""} onChange={(e) => set("bannerUrl", e.target.value)} placeholder="https://" />
            </Field>
            <Field label={t("bannerLink")} htmlFor="sig-banner-link">
              <Input id="sig-banner-link" type="url" value={data.bannerLink ?? ""} onChange={(e) => set("bannerLink", e.target.value)} placeholder="https://" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("template")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2">
              {EMAIL_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  aria-pressed={template === tpl.id}
                  onClick={() => setTemplate(tpl.id)}
                  className={cn("rounded-lg border px-2 py-1.5 text-xs", template === tpl.id ? "border-primary bg-accent font-medium" : "hover:bg-muted")}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t("preview")}</p>
              {/* HTML produit par renderEmailSignature : toutes les valeurs saisies sont échappées */}
              <div className="overflow-x-auto rounded-lg border bg-white p-4 text-black" dangerouslySetInnerHTML={{ __html: html }} />
              <p className="mt-2 text-xs text-muted-foreground">{t("imageNote")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copy} disabled={!data.fullName}>
                {copied ? <Check /> : <ClipboardCopy />}
                {t("copy")}
              </Button>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(html).then(() => toast.success(t("copied")))} disabled={!data.fullName}>
                <FileCode2 />
                {t("copyHtml")}
              </Button>
              {onSave && (
                <Button variant="outline" onClick={() => onSave(data, template)} disabled={!data.fullName || saving}>
                  <Save />
                  {t("save")}
                </Button>
              )}
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">{t("plainText")}</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">{text}</pre>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(text)}>
                {t("copyText")}
              </Button>
            </details>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("install")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm">
              {(["gmail", "outlook", "outlookWeb", "apple", "thunderbird"] as const).map((key) => (
                <li key={key}>{t(`guides.${key}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {batch !== "hidden" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("batch")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">{batch === "enabled" ? t("batchBody") : t("batchProOnly")}</p>
              {batch === "enabled" && (
                <>
                  <input ref={fileInput} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => runBatch(e.target.files?.[0])} />
                  <Button variant="outline" className="justify-self-start" onClick={() => fileInput.current?.click()}>
                    <Upload />
                    {t("batchFile")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
