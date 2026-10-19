"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { ApiError, errorMessage } from "@/lib/api";

/** Affiche une erreur d'API, avec un raccourci vers la facturation si les crédits manquent. */
export function useApiErrorToast() {
  const t = useTranslations("app");
  const router = useRouter();
  return (error: unknown) => {
    if (error instanceof ApiError && error.code === "INSUFFICIENT_CREDITS") {
      toast.error(t("errors.INSUFFICIENT_CREDITS"), {
        action: { label: t("shell.buyCredits"), onClick: () => router.push("/app/facturation") },
      });
      return;
    }
    if (error instanceof ApiError && error.status === 403) {
      toast.error(t("errors.forbidden"));
      return;
    }
    toast.error(errorMessage(error));
  };
}
