// Bibliothèque interne de polices (toutes sous licence OFL, servies par next/font).
// Le rendu utilise la variable CSS de chaque police ; l'export la résout en nom réel.
// Lettres absentes d'une police : même repli que le rendu serveur (assets/fonts du back) — le
// latin étendu de la police, puis Montserrat, puis Noto Sans NKo pour l'écriture N'Ko.

export type FontCategory = "sans" | "serif" | "display" | "script" | "sport" | "festive";

export interface LibraryFontDef {
  id: string;
  name: string;
  cssVar: string;
  category: FontCategory;
  license: "OFL";
  weights: number[];
  /** Largeur moyenne d'un caractère, en em, pour estimer la taille du texte. */
  widthFactor: number;
  /** Hauteurs au-dessus et au-dessous de la ligne de base, en em (mêmes valeurs que l'API). */
  ascent: number;
  descent: number;
}

export const FONTS: LibraryFontDef[] = [
  { id: "montserrat", name: "Montserrat", cssVar: "--font-montserrat", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.66, ascent: 0.968, descent: 0.251 },
  { id: "poppins", name: "Poppins", cssVar: "--font-poppins", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.64, ascent: 1.05, descent: 0.35 },
  { id: "space-grotesk", name: "Space Grotesk", cssVar: "--font-space-grotesk", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.6, ascent: 0.984, descent: 0.292 },
  { id: "nunito", name: "Nunito", cssVar: "--font-nunito", category: "sans", license: "OFL", weights: [400, 700, 800], widthFactor: 0.58, ascent: 1.011, descent: 0.353 },
  { id: "raleway", name: "Raleway", cssVar: "--font-raleway", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.62, ascent: 0.94, descent: 0.234 },
  { id: "oswald", name: "Oswald", cssVar: "--font-oswald", category: "display", license: "OFL", weights: [400, 600, 700], widthFactor: 0.46, ascent: 1.193, descent: 0.289 },
  { id: "bebas-neue", name: "Bebas Neue", cssVar: "--font-bebas-neue", category: "display", license: "OFL", weights: [400], widthFactor: 0.42, ascent: 0.9, descent: 0.3 },
  { id: "playfair", name: "Playfair Display", cssVar: "--font-playfair", category: "serif", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.6, ascent: 1.082, descent: 0.251 },
  { id: "lora", name: "Lora", cssVar: "--font-lora", category: "serif", license: "OFL", weights: [400, 600, 700], widthFactor: 0.58, ascent: 1.006, descent: 0.274 },
  { id: "merriweather", name: "Merriweather", cssVar: "--font-merriweather", category: "serif", license: "OFL", weights: [400, 700, 900], widthFactor: 0.66, ascent: 0.984, descent: 0.273 },
  { id: "great-vibes", name: "Great Vibes", cssVar: "--font-great-vibes", category: "script", license: "OFL", weights: [400], widthFactor: 0.46, ascent: 0.851, descent: 0.401 },
  { id: "dancing-script", name: "Dancing Script", cssVar: "--font-dancing-script", category: "script", license: "OFL", weights: [400, 700], widthFactor: 0.48, ascent: 0.92, descent: 0.28 },
  { id: "allura", name: "Allura", cssVar: "--font-allura", category: "script", license: "OFL", weights: [400], widthFactor: 0.42, ascent: 0.8, descent: 0.45 },
  { id: "satisfy", name: "Satisfy", cssVar: "--font-satisfy", category: "script", license: "OFL", weights: [400], widthFactor: 0.5, ascent: 0.935, descent: 0.489 },
  { id: "sacramento", name: "Sacramento", cssVar: "--font-sacramento", category: "script", license: "OFL", weights: [400], widthFactor: 0.4, ascent: 0.93, descent: 0.529 },
  // Studio de création : bibliothèque élargie
  { id: "inter", name: "Inter", cssVar: "--font-inter", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.6, ascent: 0.969, descent: 0.241 },
  { id: "dm-sans", name: "DM Sans", cssVar: "--font-dm-sans", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.61, ascent: 0.992, descent: 0.31 },
  { id: "work-sans", name: "Work Sans", cssVar: "--font-work-sans", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.61, ascent: 0.93, descent: 0.243 },
  { id: "rubik", name: "Rubik", cssVar: "--font-rubik", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.61, ascent: 0.935, descent: 0.25 },
  { id: "manrope", name: "Manrope", cssVar: "--font-manrope", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.6, ascent: 1.066, descent: 0.3 },
  { id: "outfit", name: "Outfit", cssVar: "--font-outfit", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.56, ascent: 1, descent: 0.26 },
  { id: "plus-jakarta-sans", name: "Plus Jakarta Sans", cssVar: "--font-plus-jakarta-sans", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.6, ascent: 1.038, descent: 0.222 },
  { id: "archivo", name: "Archivo", cssVar: "--font-archivo", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.59, ascent: 0.878, descent: 0.21 },
  { id: "josefin-sans", name: "Josefin Sans", cssVar: "--font-josefin-sans", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.6, ascent: 0.75, descent: 0.25 },
  { id: "quicksand", name: "Quicksand", cssVar: "--font-quicksand", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.6, ascent: 1, descent: 0.25 },
  { id: "comfortaa", name: "Comfortaa", cssVar: "--font-comfortaa", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.65, ascent: 0.881, descent: 0.234 },
  { id: "ubuntu", name: "Ubuntu", cssVar: "--font-ubuntu", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.59, ascent: 0.932, descent: 0.189 },
  { id: "barlow-condensed", name: "Barlow Condensed", cssVar: "--font-barlow-condensed", category: "display", license: "OFL", weights: [400, 600, 700], widthFactor: 0.44, ascent: 1, descent: 0.2 },
  { id: "anton", name: "Anton", cssVar: "--font-anton", category: "display", license: "OFL", weights: [400], widthFactor: 0.49, ascent: 1.176, descent: 0.329 },
  { id: "archivo-black", name: "Archivo Black", cssVar: "--font-archivo-black", category: "display", license: "OFL", weights: [400], widthFactor: 0.68, ascent: 0.878, descent: 0.21 },
  { id: "righteous", name: "Righteous", cssVar: "--font-righteous", category: "display", license: "OFL", weights: [400], widthFactor: 0.58, ascent: 0.985, descent: 0.257 },
  { id: "abril-fatface", name: "Abril Fatface", cssVar: "--font-abril-fatface", category: "display", license: "OFL", weights: [400], widthFactor: 0.58, ascent: 1.058, descent: 0.291 },
  { id: "syne", name: "Syne", cssVar: "--font-syne", category: "display", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.68, ascent: 0.925, descent: 0.275 },
  { id: "unbounded", name: "Unbounded", cssVar: "--font-unbounded", category: "display", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.78, ascent: 0.995, descent: 0.245 },
  { id: "bricolage-grotesque", name: "Bricolage Grotesque", cssVar: "--font-bricolage-grotesque", category: "display", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.6, ascent: 0.93, descent: 0.27 },
  { id: "teko", name: "Teko", cssVar: "--font-teko", category: "display", license: "OFL", weights: [400, 600, 700], widthFactor: 0.48, ascent: 0.958, descent: 0.475 },
  { id: "alfa-slab-one", name: "Alfa Slab One", cssVar: "--font-alfa-slab-one", category: "display", license: "OFL", weights: [400], widthFactor: 0.66, ascent: 1.036, descent: 0.333 },
  { id: "lobster", name: "Lobster", cssVar: "--font-lobster", category: "display", license: "OFL", weights: [400], widthFactor: 0.48, ascent: 1, descent: 0.25 },
  { id: "dm-serif-display", name: "DM Serif Display", cssVar: "--font-dm-serif-display", category: "serif", license: "OFL", weights: [400], widthFactor: 0.55, ascent: 1.036, descent: 0.335 },
  { id: "fraunces", name: "Fraunces", cssVar: "--font-fraunces", category: "serif", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.62, ascent: 0.978, descent: 0.255 },
  { id: "cormorant-garamond", name: "Cormorant Garamond", cssVar: "--font-cormorant-garamond", category: "serif", license: "OFL", weights: [400, 600, 700], widthFactor: 0.5, ascent: 0.924, descent: 0.287 },
  { id: "libre-baskerville", name: "Libre Baskerville", cssVar: "--font-libre-baskerville", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.66, ascent: 0.97, descent: 0.27 },
  { id: "roboto-slab", name: "Roboto Slab", cssVar: "--font-roboto-slab", category: "serif", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.59, ascent: 1.048, descent: 0.271 },
  { id: "pacifico", name: "Pacifico", cssVar: "--font-pacifico", category: "script", license: "OFL", weights: [400], widthFactor: 0.54, ascent: 1.303, descent: 0.453 },
  { id: "caveat", name: "Caveat", cssVar: "--font-caveat", category: "script", license: "OFL", weights: [400, 700], widthFactor: 0.42, ascent: 0.96, descent: 0.3 },
  { id: "permanent-marker", name: "Permanent Marker", cssVar: "--font-permanent-marker", category: "script", license: "OFL", weights: [400], widthFactor: 0.62, ascent: 1.109, descent: 0.317 },
  { id: "kaushan-script", name: "Kaushan Script", cssVar: "--font-kaushan-script", category: "script", license: "OFL", weights: [400], widthFactor: 0.49, ascent: 1.084, descent: 0.367 },
  // Maillots et sport : numéros et noms de joueurs (collège, condensées, liseré, pochoir, relief).
  { id: "graduate", name: "Graduate", cssVar: "--font-graduate", category: "sport", license: "OFL", weights: [400], widthFactor: 0.66, ascent: 0.953, descent: 0.186 },
  { id: "big-shoulders", name: "Big Shoulders", cssVar: "--font-big-shoulders", category: "sport", license: "OFL", weights: [400, 700, 900], widthFactor: 0.4, ascent: 0.984, descent: 0.213 },
  { id: "big-shoulders-inline", name: "Big Shoulders Inline", cssVar: "--font-big-shoulders-inline", category: "sport", license: "OFL", weights: [700, 900], widthFactor: 0.41, ascent: 0.984, descent: 0.213 },
  { id: "big-shoulders-stencil", name: "Big Shoulders Stencil", cssVar: "--font-big-shoulders-stencil", category: "sport", license: "OFL", weights: [700, 900], widthFactor: 0.41, ascent: 0.984, descent: 0.213 },
  { id: "bungee", name: "Bungee", cssVar: "--font-bungee", category: "sport", license: "OFL", weights: [400], widthFactor: 0.71, ascent: 1.02, descent: 0.3 },
  { id: "bungee-inline", name: "Bungee Inline", cssVar: "--font-bungee-inline", category: "sport", license: "OFL", weights: [400], widthFactor: 0.71, ascent: 1.02, descent: 0.3 },
  { id: "bungee-shade", name: "Bungee Shade", cssVar: "--font-bungee-shade", category: "sport", license: "OFL", weights: [400], widthFactor: 0.81, ascent: 1.02, descent: 0.3 },
  { id: "russo-one", name: "Russo One", cssVar: "--font-russo-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.63, ascent: 0.926, descent: 0.279 },
  { id: "squada-one", name: "Squada One", cssVar: "--font-squada-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.44, ascent: 0.861, descent: 0.196 },
  { id: "staatliches", name: "Staatliches", cssVar: "--font-staatliches", category: "sport", license: "OFL", weights: [400], widthFactor: 0.44, ascent: 0.95, descent: 0.3 },
  { id: "saira-condensed", name: "Saira Condensed", cssVar: "--font-saira-condensed", category: "sport", license: "OFL", weights: [500, 700, 900], widthFactor: 0.44, ascent: 1.135, descent: 0.439 },
  { id: "saira-extra-condensed", name: "Saira Extra Condensed", cssVar: "--font-saira-extra-condensed", category: "sport", license: "OFL", weights: [500, 700, 900], widthFactor: 0.38, ascent: 1.135, descent: 0.439 },
  { id: "saira-stencil", name: "Saira Stencil One", cssVar: "--font-saira-stencil", category: "sport", license: "OFL", weights: [400], widthFactor: 0.6, ascent: 1.135, descent: 0.439 },
  { id: "chakra-petch", name: "Chakra Petch", cssVar: "--font-chakra-petch", category: "sport", license: "OFL", weights: [500, 700], widthFactor: 0.59, ascent: 0.992, descent: 0.308 },
  { id: "black-ops-one", name: "Black Ops One", cssVar: "--font-black-ops-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.66, ascent: 0.914, descent: 0.336 },
  { id: "racing-sans-one", name: "Racing Sans One", cssVar: "--font-racing-sans-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.57, ascent: 0.976, descent: 0.284 },
  { id: "orbitron", name: "Orbitron", cssVar: "--font-orbitron", category: "sport", license: "OFL", weights: [500, 700, 900], widthFactor: 0.73, ascent: 1.011, descent: 0.243 },
  { id: "audiowide", name: "Audiowide", cssVar: "--font-audiowide", category: "sport", license: "OFL", weights: [400], widthFactor: 0.71, ascent: 0.99, descent: 0.285 },
  { id: "kanit", name: "Kanit", cssVar: "--font-kanit", category: "sport", license: "OFL", weights: [500, 700, 900], widthFactor: 0.59, ascent: 1.1, descent: 0.395 },
  { id: "rajdhani", name: "Rajdhani", cssVar: "--font-rajdhani", category: "sport", license: "OFL", weights: [500, 700], widthFactor: 0.5, ascent: 0.93, descent: 0.346 },
  { id: "exo-2", name: "Exo 2", cssVar: "--font-exo-2", category: "sport", license: "OFL", weights: [500, 700, 900], widthFactor: 0.59, ascent: 0.999, descent: 0.201 },
  { id: "changa-one", name: "Changa One", cssVar: "--font-changa-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.56, ascent: 0.882, descent: 0.18 },
  { id: "bowlby-one-sc", name: "Bowlby One SC", cssVar: "--font-bowlby-one-sc", category: "sport", license: "OFL", weights: [400], widthFactor: 0.72, ascent: 1.098, descent: 0.428 },
  { id: "holtwood-one-sc", name: "Holtwood One SC", cssVar: "--font-holtwood-one-sc", category: "sport", license: "OFL", weights: [400], widthFactor: 0.83, ascent: 1.2, descent: 0.428 },
  { id: "monoton", name: "Monoton", cssVar: "--font-monoton", category: "sport", license: "OFL", weights: [400], widthFactor: 0.77, ascent: 1.155, descent: 0.401 },
  { id: "tourney", name: "Tourney", cssVar: "--font-tourney", category: "sport", license: "OFL", weights: [600, 800], widthFactor: 0.6, ascent: 0.9, descent: 0.2 },
  { id: "goldman", name: "Goldman", cssVar: "--font-goldman", category: "sport", license: "OFL", weights: [400, 700], widthFactor: 0.72, ascent: 0.9, descent: 0.3 },
  { id: "zen-dots", name: "Zen Dots", cssVar: "--font-zen-dots", category: "sport", license: "OFL", weights: [400], widthFactor: 0.81, ascent: 0.93, descent: 0.27 },
  { id: "michroma", name: "Michroma", cssVar: "--font-michroma", category: "sport", license: "OFL", weights: [400], widthFactor: 0.88, ascent: 1.156, descent: 0.266 },
  { id: "anta", name: "Anta", cssVar: "--font-anta", category: "sport", license: "OFL", weights: [400], widthFactor: 0.59, ascent: 0.96, descent: 0.261 },
  { id: "oxanium", name: "Oxanium", cssVar: "--font-oxanium", category: "sport", license: "OFL", weights: [500, 700, 800], widthFactor: 0.6, ascent: 0.79, descent: 0.21 },
  { id: "tektur", name: "Tektur", cssVar: "--font-tektur", category: "sport", license: "OFL", weights: [500, 700, 900], widthFactor: 0.6, ascent: 1.0, descent: 0.3 },
  { id: "bevan", name: "Bevan", cssVar: "--font-bevan", category: "sport", license: "OFL", weights: [400], widthFactor: 0.73, ascent: 1.155, descent: 0.452 },
  { id: "sarpanch", name: "Sarpanch", cssVar: "--font-sarpanch", category: "sport", license: "OFL", weights: [500, 700, 900], widthFactor: 0.64, ascent: 1.05, descent: 0.35 },
  { id: "jockey-one", name: "Jockey One", cssVar: "--font-jockey-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.45, ascent: 1.079, descent: 0.319 },
  { id: "passion-one", name: "Passion One", cssVar: "--font-passion-one", category: "sport", license: "OFL", weights: [400, 700, 900], widthFactor: 0.5, ascent: 0.835, descent: 0.266 },
  { id: "fugaz-one", name: "Fugaz One", cssVar: "--font-fugaz-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.61, ascent: 1.046, descent: 0.422 },
  { id: "days-one", name: "Days One", cssVar: "--font-days-one", category: "sport", license: "OFL", weights: [400], widthFactor: 0.7, ascent: 0.996, descent: 0.277 },
  // Les plus utilisées au monde (vues Google Fonts), fêtes et événements, manuscrites.
  { id: "roboto", name: "Roboto", cssVar: "--font-roboto", category: "sans", license: "OFL", weights: [400, 500, 700, 900], widthFactor: 0.57, ascent: 0.928, descent: 0.244 },
  { id: "open-sans", name: "Open Sans", cssVar: "--font-open-sans", category: "sans", license: "OFL", weights: [400, 600, 700, 800], widthFactor: 0.61, ascent: 1.069, descent: 0.293 },
  { id: "lato", name: "Lato", cssVar: "--font-lato", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.59, ascent: 0.987, descent: 0.213 },
  { id: "roboto-condensed", name: "Roboto Condensed", cssVar: "--font-roboto-condensed", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.5, ascent: 0.928, descent: 0.244 },
  { id: "noto-sans", name: "Noto Sans", cssVar: "--font-noto-sans", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.61, ascent: 1.069, descent: 0.293 },
  { id: "source-sans-3", name: "Source Sans 3", cssVar: "--font-source-sans-3", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.55, ascent: 1.024, descent: 0.4 },
  { id: "nunito-sans", name: "Nunito Sans", cssVar: "--font-nunito-sans", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.6, ascent: 1.011, descent: 0.353 },
  { id: "pt-sans", name: "PT Sans", cssVar: "--font-pt-sans", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.54, ascent: 1.018, descent: 0.276 },
  { id: "mukta", name: "Mukta", cssVar: "--font-mukta", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.54, ascent: 1.13, descent: 0.532 },
  { id: "fira-sans", name: "Fira Sans", cssVar: "--font-fira-sans", category: "sans", license: "OFL", weights: [400, 600, 800], widthFactor: 0.56, ascent: 0.935, descent: 0.265 },
  { id: "barlow", name: "Barlow", cssVar: "--font-barlow", category: "sans", license: "OFL", weights: [400, 600, 800], widthFactor: 0.56, ascent: 1, descent: 0.2 },
  { id: "titillium-web", name: "Titillium Web", cssVar: "--font-titillium-web", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.54, ascent: 1.133, descent: 0.388 },
  { id: "heebo", name: "Heebo", cssVar: "--font-heebo", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.57, ascent: 1.048, descent: 0.421 },
  { id: "ibm-plex-sans", name: "IBM Plex Sans", cssVar: "--font-ibm-plex-sans", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.6, ascent: 1.025, descent: 0.275 },
  { id: "karla", name: "Karla", cssVar: "--font-karla", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.59, ascent: 0.917, descent: 0.252 },
  { id: "libre-franklin", name: "Libre Franklin", cssVar: "--font-libre-franklin", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.64, ascent: 0.966, descent: 0.246 },
  { id: "mulish", name: "Mulish", cssVar: "--font-mulish", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.61, ascent: 1.005, descent: 0.25 },
  { id: "hind", name: "Hind", cssVar: "--font-hind", category: "sans", license: "OFL", weights: [400, 600, 700], widthFactor: 0.56, ascent: 1.055, descent: 0.546 },
  { id: "arimo", name: "Arimo", cssVar: "--font-arimo", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.6, ascent: 0.905, descent: 0.212 },
  { id: "dosis", name: "Dosis", cssVar: "--font-dosis", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.51, ascent: 1.027, descent: 0.237 },
  { id: "cabin", name: "Cabin", cssVar: "--font-cabin", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.56, ascent: 0.965, descent: 0.25 },
  { id: "oxygen", name: "Oxygen", cssVar: "--font-oxygen", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.59, ascent: 1.027, descent: 0.236 },
  { id: "lexend", name: "Lexend", cssVar: "--font-lexend", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.64, ascent: 1, descent: 0.25 },
  { id: "abel", name: "Abel", cssVar: "--font-abel", category: "sans", license: "OFL", weights: [400], widthFactor: 0.47, ascent: 0.979, descent: 0.295 },
  { id: "cairo", name: "Cairo", cssVar: "--font-cairo", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.54, ascent: 1.303, descent: 0.571 },
  { id: "fjalla-one", name: "Fjalla One", cssVar: "--font-fjalla-one", category: "display", license: "OFL", weights: [400], widthFactor: 0.46, ascent: 1.009, descent: 0.248 },
  { id: "signika", name: "Signika", cssVar: "--font-signika", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.55, ascent: 0.94, descent: 0.292 },
  { id: "prompt", name: "Prompt", cssVar: "--font-prompt", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.62, ascent: 1.09, descent: 0.422 },
  { id: "varela-round", name: "Varela Round", cssVar: "--font-varela-round", category: "sans", license: "OFL", weights: [400], widthFactor: 0.62, ascent: 0.918, descent: 0.286 },
  { id: "overpass", name: "Overpass", cssVar: "--font-overpass", category: "sans", license: "OFL", weights: [400, 800], widthFactor: 0.6, ascent: 0.883, descent: 0.383 },
  { id: "asap", name: "Asap", cssVar: "--font-asap", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.55, ascent: 0.934, descent: 0.212 },
  { id: "maven-pro", name: "Maven Pro", cssVar: "--font-maven-pro", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.61, ascent: 0.965, descent: 0.21 },
  { id: "questrial", name: "Questrial", cssVar: "--font-questrial", category: "sans", license: "OFL", weights: [400], widthFactor: 0.57, ascent: 0.82, descent: 0.21 },
  { id: "sora", name: "Sora", cssVar: "--font-sora", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.66, ascent: 0.97, descent: 0.29 },
  { id: "figtree", name: "Figtree", cssVar: "--font-figtree", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.6, ascent: 0.95, descent: 0.25 },
  { id: "urbanist", name: "Urbanist", cssVar: "--font-urbanist", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.58, ascent: 0.95, descent: 0.25 },
  { id: "jost", name: "Jost", cssVar: "--font-jost", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.61, ascent: 1.07, descent: 0.375 },
  { id: "red-hat-display", name: "Red Hat Display", cssVar: "--font-red-hat-display", category: "sans", license: "OFL", weights: [400, 700, 900], widthFactor: 0.61, ascent: 1.018, descent: 0.305 },
  { id: "archivo-narrow", name: "Archivo Narrow", cssVar: "--font-archivo-narrow", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.5, ascent: 1.035, descent: 0.312 },
  { id: "pt-sans-narrow", name: "PT Sans Narrow", cssVar: "--font-pt-sans-narrow", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.45, ascent: 1.018, descent: 0.276 },
  { id: "public-sans", name: "Public Sans", cssVar: "--font-public-sans", category: "sans", license: "OFL", weights: [400, 700], widthFactor: 0.62, ascent: 0.95, descent: 0.225 },
  { id: "noto-serif", name: "Noto Serif", cssVar: "--font-noto-serif", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.63, ascent: 1.069, descent: 0.293 },
  { id: "pt-serif", name: "PT Serif", cssVar: "--font-pt-serif", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.6, ascent: 1.039, descent: 0.286 },
  { id: "eb-garamond", name: "EB Garamond", cssVar: "--font-eb-garamond", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.57, ascent: 1.007, descent: 0.298 },
  { id: "crimson-text", name: "Crimson Text", cssVar: "--font-crimson-text", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.56, ascent: 0.949, descent: 0.351 },
  { id: "bitter", name: "Bitter", cssVar: "--font-bitter", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.6, ascent: 0.935, descent: 0.265 },
  { id: "zilla-slab", name: "Zilla Slab", cssVar: "--font-zilla-slab", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.58, ascent: 0.944, descent: 0.256 },
  { id: "alegreya", name: "Alegreya", cssVar: "--font-alegreya", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.54, ascent: 1.016, descent: 0.345 },
  { id: "cinzel", name: "Cinzel", cssVar: "--font-cinzel", category: "serif", license: "OFL", weights: [400, 700, 900], widthFactor: 0.67, ascent: 0.976, descent: 0.372 },
  { id: "arvo", name: "Arvo", cssVar: "--font-arvo", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.65, ascent: 0.961, descent: 0.247 },
  { id: "domine", name: "Domine", cssVar: "--font-domine", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.64, ascent: 0.9, descent: 0.24 },
  { id: "patua-one", name: "Patua One", cssVar: "--font-patua-one", category: "serif", license: "OFL", weights: [400], widthFactor: 0.55, ascent: 0.972, descent: 0.247 },
  { id: "courier-prime", name: "Courier Prime", cssVar: "--font-courier-prime", category: "serif", license: "OFL", weights: [400, 700], widthFactor: 0.6, ascent: 0.781, descent: 0.342 },
  { id: "bangers", name: "Bangers", cssVar: "--font-bangers", category: "festive", license: "OFL", weights: [400], widthFactor: 0.42, ascent: 0.883, descent: 0.181 },
  { id: "fredoka", name: "Fredoka", cssVar: "--font-fredoka", category: "festive", license: "OFL", weights: [400, 600, 700], widthFactor: 0.57, ascent: 0.974, descent: 0.236 },
  { id: "lilita-one", name: "Lilita One", cssVar: "--font-lilita-one", category: "festive", license: "OFL", weights: [400], widthFactor: 0.55, ascent: 0.923, descent: 0.22 },
  { id: "carter-one", name: "Carter One", cssVar: "--font-carter-one", category: "festive", license: "OFL", weights: [400], widthFactor: 0.6, ascent: 1.105, descent: 0.435 },
  { id: "concert-one", name: "Concert One", cssVar: "--font-concert-one", category: "festive", license: "OFL", weights: [400], widthFactor: 0.51, ascent: 0.979, descent: 0.2 },
  { id: "paytone-one", name: "Paytone One", cssVar: "--font-paytone-one", category: "festive", license: "OFL", weights: [400], widthFactor: 0.62, ascent: 1.113, descent: 0.283 },
  { id: "bubblegum-sans", name: "Bubblegum Sans", cssVar: "--font-bubblegum-sans", category: "festive", license: "OFL", weights: [400], widthFactor: 0.51, ascent: 0.852, descent: 0.311 },
  { id: "henny-penny", name: "Henny Penny", cssVar: "--font-henny-penny", category: "festive", license: "OFL", weights: [400], widthFactor: 0.62, ascent: 1.135, descent: 0.637 },
  { id: "emilys-candy", name: "Emilys Candy", cssVar: "--font-emilys-candy", category: "festive", license: "OFL", weights: [400], widthFactor: 0.57, ascent: 0.973, descent: 0.279 },
  { id: "press-start-2p", name: "Press Start 2P", cssVar: "--font-press-start-2p", category: "festive", license: "OFL", weights: [400], widthFactor: 1, ascent: 1, descent: 0 },
  { id: "baloo-2", name: "Baloo 2", cssVar: "--font-baloo-2", category: "festive", license: "OFL", weights: [400, 700, 800], widthFactor: 0.56, ascent: 1.078, descent: 0.524 },
  { id: "lobster-two", name: "Lobster Two", cssVar: "--font-lobster-two", category: "festive", license: "OFL", weights: [400, 700], widthFactor: 0.53, ascent: 1, descent: 0.25 },
  { id: "rye", name: "Rye", cssVar: "--font-rye", category: "festive", license: "OFL", weights: [400], widthFactor: 0.66, ascent: 0.986, descent: 0.264 },
  { id: "cinzel-decorative", name: "Cinzel Decorative", cssVar: "--font-cinzel-decorative", category: "festive", license: "OFL", weights: [400, 700, 900], widthFactor: 0.71, ascent: 0.976, descent: 0.372 },
  { id: "creepster", name: "Creepster", cssVar: "--font-creepster", category: "festive", license: "OFL", weights: [400], widthFactor: 0.44, ascent: 0.951, descent: 0.218 },
  { id: "titan-one", name: "Titan One", cssVar: "--font-titan-one", category: "festive", license: "OFL", weights: [400], widthFactor: 0.65, ascent: 0.97, descent: 0.175 },
  { id: "sniglet", name: "Sniglet", cssVar: "--font-sniglet", category: "festive", license: "OFL", weights: [400, 800], widthFactor: 0.67, ascent: 0.956, descent: 0.289 },
  { id: "berkshire-swash", name: "Berkshire Swash", cssVar: "--font-berkshire-swash", category: "festive", license: "OFL", weights: [400], widthFactor: 0.58, ascent: 0.98, descent: 0.262 },
  { id: "bowlby-one", name: "Bowlby One", cssVar: "--font-bowlby-one", category: "festive", license: "OFL", weights: [400], widthFactor: 0.73, ascent: 1.111, descent: 0.455 },
  { id: "shadows-into-light", name: "Shadows Into Light", cssVar: "--font-shadows-into-light", category: "script", license: "OFL", weights: [400], widthFactor: 0.44, ascent: 1.175, descent: 0.432 },
  { id: "indie-flower", name: "Indie Flower", cssVar: "--font-indie-flower", category: "script", license: "OFL", weights: [400], widthFactor: 0.48, ascent: 0.971, descent: 0.488 },
  { id: "amatic-sc", name: "Amatic SC", cssVar: "--font-amatic-sc", category: "script", license: "OFL", weights: [400, 700], widthFactor: 0.32, ascent: 1.016, descent: 0.245 },
  { id: "kalam", name: "Kalam", cssVar: "--font-kalam", category: "script", license: "OFL", weights: [400, 700], widthFactor: 0.53, ascent: 1.063, descent: 0.531 },
  { id: "courgette", name: "Courgette", cssVar: "--font-courgette", category: "script", license: "OFL", weights: [400], widthFactor: 0.54, ascent: 0.977, descent: 0.273 },
  { id: "damion", name: "Damion", cssVar: "--font-damion", category: "script", license: "OFL", weights: [400], widthFactor: 0.5, ascent: 1.01, descent: 0.364 },
  { id: "cookie", name: "Cookie", cssVar: "--font-cookie", category: "script", license: "OFL", weights: [400], widthFactor: 0.42, ascent: 0.789, descent: 0.32 },
  { id: "playball", name: "Playball", cssVar: "--font-playball", category: "script", license: "OFL", weights: [400], widthFactor: 0.52, ascent: 0.95, descent: 0.3 },
  { id: "parisienne", name: "Parisienne", cssVar: "--font-parisienne", category: "script", license: "OFL", weights: [400], widthFactor: 0.65, ascent: 0.916, descent: 0.447 },
  { id: "alex-brush", name: "Alex Brush", cssVar: "--font-alex-brush", category: "script", license: "OFL", weights: [400], widthFactor: 0.59, ascent: 0.825, descent: 0.425 },
  { id: "pinyon-script", name: "Pinyon Script", cssVar: "--font-pinyon-script", category: "script", license: "OFL", weights: [400], widthFactor: 0.54, ascent: 0.863, descent: 0.384 },
  { id: "tangerine", name: "Tangerine", cssVar: "--font-tangerine", category: "script", license: "OFL", weights: [400, 700], widthFactor: 0.48, ascent: 0.75, descent: 0.25 },
  { id: "grand-hotel", name: "Grand Hotel", cssVar: "--font-grand-hotel", category: "script", license: "OFL", weights: [400], widthFactor: 0.42, ascent: 0.946, descent: 0.412 },
];

/** Polices qui écrivent tout le pular (ɓ ɗ ŋ ƴ et capitales), d'après le manifeste de l'API. */
export const PULAR_FONTS = new Set(["montserrat", "nunito", "merriweather", "great-vibes", "inter", "anton", "unbounded", "libre-baskerville", "tektur", "noto-sans", "nunito-sans", "fira-sans", "mulish", "arimo", "overpass", "questrial", "noto-serif", "eb-garamond", "pinyon-script"]);
/** Polices sans sous-ensemble latin étendu (pas de variable « -ext »). */
const LATIN_ONLY = new Set(["satisfy", "permanent-marker", "graduate", "squada-one", "orbitron", "changa-one", "fugaz-one", "days-one", "abel", "arvo", "patua-one", "carter-one", "henny-penny", "lobster-two", "creepster", "bowlby-one", "cookie", "tangerine"]);

/** Lettres pular (fula) hors de l'alphabet latin de base. */
export const PULAR_LETTERS = /[ɓɗŋƴƁƊŊƳ]/gu;
const NKO_LETTERS = /[\u07C0-\u07FF]/u;

/** Polices de secours, dans l'ordre (variable CSS posée sur :root dans globals.css). */
export const FALLBACK_FONTS = [
  { cssVar: "--font-montserrat-ext", name: "Montserrat" },
  { cssVar: "--font-nko", name: "Noto Sans NKo" },
];

/** Variables CSS d'une police : sous-ensemble latin, puis latin étendu s'il existe. */
export function fontVars(id: string) {
  const font = getFont(id);
  return LATIN_ONLY.has(font.id) ? [font.cssVar] : [font.cssVar, `${font.cssVar}-ext`];
}

/**
 * Lettres d'un texte que la police n'a pas : elles seront dessinées avec la police de secours
 * (Montserrat, Noto Sans NKo), dans l'éditeur comme dans les exports.
 */
export function fallbackLetters(text: string, id: string) {
  const letters = PULAR_FONTS.has(getFont(id).id) ? [] : [...new Set(text.match(PULAR_LETTERS) ?? [])];
  return { letters, nko: NKO_LETTERS.test(text) };
}

export const LOGO_FONTS = FONTS.filter((font) => font.category !== "script");
export const SCRIPT_FONTS = FONTS.filter((font) => font.category === "script");

export function getFont(id: string): LibraryFontDef {
  return FONTS.find((font) => font.id === id) ?? FONTS[0]!;
}

/** Valeur font-family utilisable dans un attribut style d'un SVG inséré dans la page. */
export function cssFontFamily(id: string) {
  const font = getFont(id);
  const fallback = font.category === "serif" ? "serif" : font.category === "script" ? "cursive" : "sans-serif";
  const vars = fontVars(font.id).map((v) => `var(${v})`).join(", ");
  return `${vars}, var(--logo-font-fallbacks), '${font.name}', ${fallback}`;
}

/** Plus proche graisse disponible. */
export function closestWeight(id: string, weight: number) {
  const { weights } = getFont(id);
  return weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), weights[0]!);
}

export function estimateTextWidth(text: string, fontId: string, fontSize: number, letterSpacingEm = 0) {
  const font = getFont(fontId);
  return text.length * fontSize * (font.widthFactor + letterSpacingEm);
}
