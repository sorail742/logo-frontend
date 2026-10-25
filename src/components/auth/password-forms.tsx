"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { PasswordInput, PasswordStrength } from "@/components/common/password-input";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import { AuthCard } from "./auth-card";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("errors.email"));
      document.getElementById("email")?.focus();
      return;
    }
    setBusy(true);
    try {
      await api.auth.forgotPassword(email);
      // Réponse identique que le compte existe ou non (pas d'énumération des comptes)
      setSent(true);
    } catch (failure) {
      const fields = fieldErrors(failure);
      if (fields.email) setError(fields.email);
      else toast.error(errorMessage(failure));
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
          <Field label={t("login.email")} htmlFor="email" error={error}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => {
                setError(undefined);
                setEmail(e.target.value);
              }}
            />
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
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
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
    const invalid = {
      password: password.length < 8 ? t("errors.password") : undefined,
      confirm: password.length >= 8 && password !== confirm ? t("errors.mismatch") : undefined,
    };
    if (invalid.password || invalid.confirm) {
      setErrors(invalid);
      document.getElementById(invalid.password ? "password" : "confirm")?.focus();
      return;
    }
    setBusy(true);
    try {
      await api.auth.resetPassword(token, password);
      toast.success(t("reset.done"));
      router.replace("/connexion");
    } catch (error) {
      const fields = fieldErrors(error);
      if (fields.password) setErrors({ password: fields.password });
      else toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title={t("reset.title")}>
      <form onSubmit={(event) => void submit(event)} className="grid gap-4" noValidate>
        <Field label={t("reset.password")} htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            maxLength={128}
            value={password}
            onChange={(e) => {
              setErrors({});
              setPassword(e.target.value);
            }}
          />
        </Field>
        <PasswordStrength password={password} />
        <Field label={t("reset.confirm")} htmlFor="confirm" error={errors.confirm}>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            maxLength={128}
            value={confirm}
            onChange={(e) => {
              setErrors({});
              setConfirm(e.target.value);
            }}
          />
        </Field>
        <Button type="submit" size="lg" disabled={busy}>
          {t("reset.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
