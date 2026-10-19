// Coût des actions en crédits (§8.3, à calibrer). Source unique, partagée à terme via packages/shared.
export const CREDIT_COSTS = {
  NAMES_BATCH: 1,
  AVAILABILITY_CHECK: 0,
  LOGOS_SVG_COMPOSER: 2,
  LOGOS_IMAGE_VECTORIZE: 5,
  SLOGANS_BATCH: 1,
  EMAIL_SIGNATURE: 0,
  HANDWRITTEN_OR_STAMP: 1,
  BRAND_GUIDE_PDF: 3,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export const LOW_CREDITS_THRESHOLD = 5;

/** Quotas de l'offre gratuite (§8.2). */
export const FREE_QUOTAS = {
  nameBatchesPerDay: 3,
  logoBatchesPerDay: 1,
  publicTriesPerDay: 3,
} as const;
