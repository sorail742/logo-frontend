"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { api, errorMessage } from "@/lib/api";
import { useSessionStore } from "@/stores/session";
import { AuthCard } from "./auth-card";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);

  const schema = z.object({
    fullName: z.string().trim().min(2, t("errors.required")),
    email: z.email(t("errors.email")),
    password: z.string().min(8, t("errors.password")),
    terms: z.literal(true, { error: t("errors.terms") }),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", terms: false as unknown as true },
  });

  const onSubmit = form.handleSubmit(async ({ fullName, email, password }) => {
    try {
      const session = await api.auth.register({ fullName, email, password });
      setUser(session.user);
      toast.success(t("register.verifyNotice"));
      router.replace("/app/projets/nouveau");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  const { errors } = form.formState;
  return (
    <AuthCard
      title={t("register.title")}
      description={t("register.subtitle")}
      footer={
        <>
          {t("register.hasAccount")}{" "}
          <Link href="/connexion" className="font-medium text-primary hover:underline">
            {t("register.login")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Field label={t("register.fullName")} htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
        </Field>
        <Field label={t("register.email")} htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label={t("register.password")} htmlFor="password" hint={t("register.passwordHint")} error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <div className="grid gap-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...form.register("terms")} />
            <span>{t("register.terms")}</span>
          </label>
          {errors.terms && (
            <p className="text-xs text-destructive" role="alert">
              {errors.terms.message}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {t("register.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
