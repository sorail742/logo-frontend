import localFont from "next/font/local";

// Polices auto-hébergées (sous-ensemble latin, licence OFL) dans src/fonts :
// le build ne télécharge rien depuis Google Fonts. Seule la police de l'interface est préchargée ;
// les polices des logos ne sont chargées par le navigateur que si un logo les utilise.
// Pour les régénérer : python scripts/fetch-fonts.py

const geist = localFont({
  src: [
    { path: "../fonts/geist-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});
const geistMono = localFont({
  src: [
    { path: "../fonts/geist-mono-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});
const montserrat = localFont({
  src: [
    { path: "../fonts/montserrat-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});
const poppins = localFont({
  src: [
    { path: "../fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/poppins-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});
const spaceGrotesk = localFont({
  src: [
    { path: "../fonts/space-grotesk-300-700.woff2", weight: "300 700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});
const nunito = localFont({
  src: [
    { path: "../fonts/nunito-200-1000.woff2", weight: "200 1000", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
  preload: false,
});
const raleway = localFont({
  src: [
    { path: "../fonts/raleway-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-raleway",
  display: "swap",
  preload: false,
});
const oswald = localFont({
  src: [
    { path: "../fonts/oswald-200-700.woff2", weight: "200 700", style: "normal" },
  ],
  variable: "--font-oswald",
  display: "swap",
  preload: false,
});
const bebasNeue = localFont({
  src: [
    { path: "../fonts/bebas-neue-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bebas-neue",
  display: "swap",
  preload: false,
});
const playfair = localFont({
  src: [
    { path: "../fonts/playfair-400-900.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});
const lora = localFont({
  src: [
    { path: "../fonts/lora-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});
const merriweather = localFont({
  src: [
    { path: "../fonts/merriweather-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/merriweather-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/merriweather-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-merriweather",
  display: "swap",
  preload: false,
});
const greatVibes = localFont({
  src: [
    { path: "../fonts/great-vibes-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});
const dancingScript = localFont({
  src: [
    { path: "../fonts/dancing-script-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-dancing-script",
  display: "swap",
  preload: false,
});
const allura = localFont({
  src: [
    { path: "../fonts/allura-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-allura",
  display: "swap",
  preload: false,
});
const satisfy = localFont({
  src: [
    { path: "../fonts/satisfy-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-satisfy",
  display: "swap",
  preload: false,
});
const sacramento = localFont({
  src: [
    { path: "../fonts/sacramento-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-sacramento",
  display: "swap",
  preload: false,
});

export const fontVariables = [geist, geistMono, montserrat, poppins, spaceGrotesk, nunito, raleway, oswald, bebasNeue, playfair, lora, merriweather, greatVibes, dancingScript, allura, satisfy, sacramento].map((font) => font.variable).join(" ");
