import type { ApparelStatus } from "@/lib/apparel/types";

/** Pastille d'état d'une tenue. */
export const STATUS_VARIANT: Record<ApparelStatus, "secondary" | "outline" | "default"> = {
  DRAFT: "secondary",
  PROOF_SENT: "outline",
  APPROVED: "default",
  IN_PRODUCTION: "default",
};
