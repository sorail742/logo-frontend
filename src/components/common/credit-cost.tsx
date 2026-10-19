import { Coins } from "lucide-react";
import { useTranslations } from "next-intl";

export function CreditCost({ cost }: { cost: number }) {
  const t = useTranslations("common");
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Coins className="size-3.5" aria-hidden="true" />
      {cost === 0 ? t("free") : t("credits", { count: cost })}
    </span>
  );
}
