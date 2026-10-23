"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { PasswordInput } from "@/components/common/password-input";
import { api, ApiError, errorMessage, type Session } from "@/lib/api";
import { useSessionStore } from "@/stores/session";
import { AuthCard } from "./auth-card";
import { GoogleButton } from "./google-button";

function useAfterLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useSessionStore((s) => s.setUser);
  return (user: Parameters<typeof setUser>[0]) => {
    setUser(user);
    const next = searchParams.get("next");
    // Redirection interne uniquement (pas d'URL externe)
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
  };
}

/** Connexion à rejouer avec le code de double authentification (TOTP ou code de secours). */
type PendingLogin = (totpCode: string) => Promise<Session>;

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [mode, setMode] = useState<"email" | "otp">("email");
  const [pending, setPending] = useState<PendingLogin | null>(null);
  const afterLogin = useAfterLogin();

  /** Ouvre la session, ou demande le code si la double authentification est active. */
  const attempt = async (first: () => Promise<Session>, withCode: PendingLogin) => {
    try {
      afterLogin((await first()).user);
    } catch (error) {
      if (error instanceof ApiError && error.code === "MFA_REQUIRED") setPending(() => withCode);
      else toast.error(errorMessage(error));
    }
  };

  const schema = z.object({
    email: z.email(t("errors.email")),
    password: z.string().min(1, t("errors.required")),
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit((values) =>
    attempt(
      () => api.auth.login(values),
      (totpCode) => api.auth.login({ ...values, totpCode }),
    ),
  );

  const google = (idToken: string) =>
    attempt(
      () => api.auth.google(idToken),
      (totpCode) => api.auth.google(idToken, totpCode),
    );

  if (pending) return <MfaForm login={pending} onBack={() => setPending(null)} onLoggedIn={afterLogin} />;
  if (mode === "otp") return <OtpForm onBack={() => setMode("email")} onLoggedIn={afterLogin} />;

  return (
    <AuthCard
      title={t("login.title")}
      description={t("login.subtitle")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link href="/inscription" className="font-medium text-primary hover:underline">
            {t("login.signup")}
          </Link>
        </>
      }
    >
      {api.isAvailable("googleLogin") ? (
        <GoogleButton onCredential={google} locale={locale} />
      ) : (
        api.mode === "mock" && (
          <Button type="button" variant="outline" size="lg" onClick={() => toast.info(t("errors.googleMock"))}>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-7.8z" />
              <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z" />
              <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
            </svg>
            {t("login.google")}
          </Button>
        )
      )}
      {api.isAvailable("smsLogin") && (
        <Button type="button" variant="outline" size="lg" onClick={() => setMode("otp")}>
          <Smartphone />
          {t("login.phone")}
        </Button>
      )}
      {(api.isAvailable("googleLogin") || api.mode === "mock" || api.isAvailable("smsLogin")) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("login.or")}
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Field label={t("login.email")} htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" maxLength={254} {...form.register("email")} />
        </Field>
        <Field
          label={
            <span className="flex w-full justify-between">
              {t("login.password")}
              <Link href="/mot-de-passe-oublie" className="text-xs font-normal text-primary hover:underline">
                {t("login.forgot")}
              </Link>
            </span>
          }
          htmlFor="password"
          error={form.formState.errors.password?.message}
        >
          <PasswordInput id="password" autoComplete="current-password" maxLength={128} {...form.register("password")} />
        </Field>
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {t("login.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}

/** Deuxième étape : code de l'application d'authentification ou code de secours (§14.1). */
function MfaForm({ login, onBack, onLoggedIn }: { login: PendingLogin; onBack: () => void; onLoggedIn: ReturnType<typeof useAfterLogin> }) {
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = /^(\d{6}|[0-9a-z]{4}-?[0-9a-z]{4})$/i.test(code.replace(/\s/g, ""));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      onLoggedIn((await login(code.replace(/\s/g, ""))).user);
    } catch (error) {
      toast.error(errorMessage(error));
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title={t("mfa.title")}
      description={t("mfa.subtitle")}
      footer={
        <button type="button" onClick={onBack} className="text-primary hover:underline">
          {t("mfa.back")}
        </button>
      }
    >
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <Field label={t("mfa.code")} htmlFor="totp" hint={t("mfa.hint")}>
          <Input id="totp" autoComplete="one-time-code" autoFocus maxLength={9} value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" disabled={busy || !valid}>
          {t("mfa.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}

function OtpForm({ onBack, onLoggedIn }: { onBack: () => void; onLoggedIn: ReturnType<typeof useAfterLogin> }) {
  const t = useTranslations("auth");
  const [phone, setPhone] = useState("+224 ");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!/^\+\d{8,15}$/.test(phone.replace(/\s/g, ""))) return toast.error(t("errors.phone"));
    setBusy(true);
    try {
      await api.auth.requestOtp(phone.replace(/\s/g, ""));
      setSent(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      const session = await api.auth.verifyOtp(phone.replace(/\s/g, ""), code);
      onLoggedIn(session.user);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title={t("otp.title")}
      footer={
        <button type="button" onClick={onBack} className="text-primary hover:underline">
          {t("otp.backToEmail")}
        </button>
      }
    >
      <Field label={t("otp.phone")} htmlFor="phone">
        <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sent} />
      </Field>
      {sent ? (
        <>
          <p className="text-sm text-muted-foreground">{t("otp.sent", { phone })}</p>
          <Field label={t("otp.code")} htmlFor="code">
            <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Button size="lg" onClick={verify} disabled={busy || code.length !== 6}>
            {t("otp.verify")}
          </Button>
        </>
      ) : (
        <Button size="lg" onClick={send} disabled={busy}>
          {t("otp.send")}
        </Button>
      )}
    </AuthCard>
  );
}
