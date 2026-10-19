"use client";

import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const next = locale === "fr" ? "en" : "fr";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.replace(pathname, { locale: next })}
      aria-label={next === "en" ? "Switch to English" : "Passer en français"}
    >
      <Languages />
      {next.toUpperCase()}
    </Button>
  );
}
