export function formatGnf(amount: number | null | undefined, locale = "fr") {
  if (amount == null) return "—";
  return new Intl.NumberFormat(locale === "fr" ? "fr-GN" : "en-GN", {
    style: "currency",
    currency: "GNF",
    // « 150 000 GNF » plutôt que le symbole local « FG » (PAY-07)
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | Date, locale = "fr", withTime = false) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Africa/Conakry",
  }).format(date);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 63);
}

export function initials(value: string, max = 3) {
  return value
    .split(/[\s-]+/)
    .filter((word) => word.length > 2 || /^[A-Z]/.test(word))
    .map((word) => word[0]!.toUpperCase())
    .join("")
    .slice(0, max);
}
