// Aléa issu du générateur cryptographique du navigateur (ou de Node) : identifiants, codes de
// secours, graines de formes. Jamais Math.random, prévisible.

/** Identifiant unique (UUID v4 si disponible, sinon 16 octets aléatoires en hexadécimal). */
export function randomId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Entier aléatoire de 0 à `max` exclu. */
export function randomInt(max: number) {
  return crypto.getRandomValues(new Uint32Array(1))[0]! % max;
}

/** Chaîne aléatoire de `length` caractères parmi `alphabet`. */
export function randomString(length: number, alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") {
  return Array.from(crypto.getRandomValues(new Uint32Array(length)), (n) => alphabet[n % alphabet.length]).join("");
}
