"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { PageHeader } from "@/components/common/page-header";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/session";

function ProfileForm() {
  const t = useTranslations("app.profile");
  const tc = useTranslations("common.actions");
  const router = useRouter();
  const pathname = usePathname();
  const onError = useApiErrorToast();
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  // Monté par ProfilePage une fois l'utilisateur connu.
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [locale, setLocale] = useState(user?.locale ?? "fr");
  const [country, setCountry] = useState(user?.country ?? "GN");
  const [totp, setTotp] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const save = useMutation({
    mutationFn: () => api.me.update({ fullName, locale, country }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success(t("saved"));
      if (updated.locale !== user?.locale) router.replace(pathname, { locale: updated.locale as "fr" | "en" });
    },
    onError,
  });
  const verify = useMutation({
    mutationFn: () => api.auth.verify2fa(code),
    onSuccess: async ({ backupCodes }) => {
      setBackupCodes(backupCodes);
      setTotp(null);
      setUser(await api.me.get());
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: api.me.remove,
    onSuccess: () => {
      toast.success(t("deleted"));
      setUser(null);
      router.replace("/");
    },
    onError,
  });

  if (!user) return null;

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader title={t("title")} />
      <Card>
        <CardContent className="pt-0">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <Field label={t("fullName")} htmlFor="profile-name">
              <Input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label={t("email")} htmlFor="profile-email">
              <Input id="profile-email" value={user.email ?? ""} disabled />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("language")} htmlFor="profile-locale">
                <NativeSelect id="profile-locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </NativeSelect>
              </Field>
              <Field label={t("country")} htmlFor="profile-country">
                <NativeSelect id="profile-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {["GN", "SN", "ML", "CI", "SL", "LR", "FR", "BE", "CA", "US"].map((code) => (
                    <option key={code} value={code}>
                      {new Intl.DisplayNames([locale], { type: "region" }).of(code)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Button type="submit" className="justify-self-end" disabled={save.isPending}>
              {tc("save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t("twoFactor")}
            <Badge variant={user.totpEnabled ? "default" : "secondary"}>{user.totpEnabled ? t("twoFactorOn") : t("twoFactorOff")}</Badge>
          </CardTitle>
          <CardDescription className="text-xs">{t("twoFactorRequired")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {backupCodes && (
            <div className="rounded-lg bg-muted p-3">
              <p className="mb-2 text-sm font-medium">{t("backupCodes")}</p>
              <ul className="grid grid-cols-2 gap-1 font-mono text-sm">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {!user.totpEnabled && !totp && (
            <Button variant="outline" className="justify-self-start" onClick={() => api.auth.setup2fa().then(setTotp, onError)}>
              {t("enable2fa")}
            </Button>
          )}
          {totp && (
            <>
              <p className="text-sm">{t("scan")}</p>
              <Field label={t("secret")}>
                <code className="rounded bg-muted px-2 py-1 font-mono text-sm break-all">{totp.secret}</code>
              </Field>
              <div className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-label={t("code")} placeholder="123456" />
                <Button onClick={() => verify.mutate()} disabled={code.length !== 6 || verify.isPending}>
                  {t("verify")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("data")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              api.me.exportData().then(({ url }) => {
                const link = document.createElement("a");
                link.href = url;
                link.download = "mes-donnees.json";
                link.click();
              }, onError)
            }
          >
            <Download />
            {t("export")}
          </Button>
          <Button variant="destructive" onClick={() => window.confirm(t("deleteConfirm")) && remove.mutate()}>
            <Trash2 />
            {t("delete")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const userId = useSessionStore((s) => s.user?.id);
  if (!userId) return null;
  return <ProfileForm key={userId} />;
}
