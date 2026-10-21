"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/common/button-link";
import { api } from "@/lib/api";
import { AuthCard } from "./auth-card";

/** Lien reçu par e-mail après l'inscription : confirme l'adresse auprès de l'API. */
export function VerifyEmail() {
  const t = useTranslations("auth.verifyEmail");
  const token = useSearchParams().get("token");
  const verification = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => api.auth.verifyEmail(token!),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  const message = !token
    ? t("missing")
    : verification.isPending
      ? t("pending")
      : verification.isSuccess
        ? t("done")
        : t("failed");

  return (
    <AuthCard title={t("title")} description={message}>
      {verification.isSuccess && (
        <ButtonLink href="/app" size="lg">
          {t("continue")}
        </ButtonLink>
      )}
    </AuthCard>
  );
}
