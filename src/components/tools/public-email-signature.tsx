"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { EmailSignatureBuilder } from "@/components/signatures/email-signature-builder";

/** Parcours court sans compte (§2.2) : la mention de la plateforme est imposée (offre gratuite). */
export function PublicEmailSignature() {
  const t = useTranslations("signatures.email");
  const [organisation, setOrganisation] = useState("");
  const [primary, setPrimary] = useState("#0f766e");
  const brand = useMemo(
    () => ({ name: organisation, primary, secondary: "#f59e0b", logoUrl: null, poweredBy: t("poweredBy") }),
    [organisation, primary, t],
  );
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto]">
        <Field label={t("organisation")} htmlFor="pub-org">
          <Input id="pub-org" value={organisation} onChange={(e) => setOrganisation(e.target.value)} autoComplete="organization" />
        </Field>
        <Field label={t("color")} htmlFor="pub-color">
          <input id="pub-color" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-8 w-16 cursor-pointer rounded border" />
        </Field>
      </div>
      <EmailSignatureBuilder brand={brand} />
    </div>
  );
}
