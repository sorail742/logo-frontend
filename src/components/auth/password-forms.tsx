"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { api, errorMessage } from "@/lib/api";
import { AuthCard } from "./auth-card";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(t("errors.email"));
      return;
    }
    setBusy(true);
    try {
      await api.auth.forgotPassword(email);
      // Réponse identique que le compte existe ou non (pas d'énumération des comptes)
      setSent(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title={t("forgot.title")}
      description={t("forgot.subtitle")}
      footer={
        <Link href="/connexion" className="text-primary hover:underline">
          {t("forgot.back")}
        </Link>
      }
    >
      {sent ? (
        <output className="block rounded-lg bg-accent p-3 text-sm text-accent-foreground">
          {t("forgot.sent")}
        </output>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="grid gap-4" noValidate>
          <Field label={t("login.email")} htmlFor="email">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" disabled={busy}>
            {t("forgot.submit")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <AuthCard title={t("reset.title")}>
        <p className="text-sm text-destructive">{t("reset.invalid")}</p>
      </AuthCard>
    );
  }

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error(t("errors.password"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("errors.mismatch"));
      return;
    }
    setBusy(true);
    try {
      await api.auth.resetPassword(token, password);
      toast.success(t("reset.done"));
      router.replace("/connexion");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title={t("reset.title")}>
      <form onSubmit={(event) => void submit(event)} className="grid gap-4" noValidate>
        <Field label={t("reset.password")} htmlFor="password">
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label={t("reset.confirm")} htmlFor="confirm">
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" disabled={busy}>
          {t("reset.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
