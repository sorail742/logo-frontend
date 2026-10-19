"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROMPTS = [
  { id: "names.generate", version: "v1", kind: "NAMES" },
  { id: "logos.compose", version: "v1", kind: "LOGOS" },
  { id: "slogans.generate", version: "v1", kind: "SLOGANS" },
  { id: "moderation.check", version: "v1", kind: "MODERATION" },
];

export default function AdminAiPage() {
  const t = useTranslations("admin.ai");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("provider")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("providerValue")}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("quotas")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("quotaValue")}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("prompts")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 font-mono text-xs">
            {PROMPTS.map((prompt) => (
              <li key={prompt.id} className="flex justify-between rounded border px-2 py-1">
                <span>{prompt.id}</span>
                <span className="text-muted-foreground">{prompt.version}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("costs")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("costsBody")}</CardContent>
      </Card>
    </div>
  );
}
