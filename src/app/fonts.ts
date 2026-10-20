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
const inter = localFont({
  src: [
    { path: "../fonts/inter-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const dmSans = localFont({
  src: [
    { path: "../fonts/dm-sans-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
});
const workSans = localFont({
  src: [
    { path: "../fonts/work-sans-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-work-sans",
  display: "swap",
  preload: false,
});
const rubik = localFont({
  src: [
    { path: "../fonts/rubik-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-rubik",
  display: "swap",
  preload: false,
});
const manrope = localFont({
  src: [
    { path: "../fonts/manrope-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});
const outfit = localFont({
  src: [
    { path: "../fonts/outfit-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
  preload: false,
});
const plusJakartaSans = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  preload: false,
});
const archivo = localFont({
  src: [
    { path: "../fonts/archivo-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
});
const josefinSans = localFont({
  src: [
    { path: "../fonts/josefin-sans-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-josefin-sans",
  display: "swap",
  preload: false,
});
const quicksand = localFont({
  src: [
    { path: "../fonts/quicksand-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-quicksand",
  display: "swap",
  preload: false,
});
const comfortaa = localFont({
  src: [
    { path: "../fonts/comfortaa-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-comfortaa",
  display: "swap",
  preload: false,
});
const ubuntu = localFont({
  src: [
    { path: "../fonts/ubuntu-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ubuntu-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ubuntu",
  display: "swap",
  preload: false,
});
const barlowCondensed = localFont({
  src: [
    { path: "../fonts/barlow-condensed-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/barlow-condensed-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-condensed-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-barlow-condensed",
  display: "swap",
  preload: false,
});
const anton = localFont({
  src: [
    { path: "../fonts/anton-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-anton",
  display: "swap",
  preload: false,
});
const archivoBlack = localFont({
  src: [
    { path: "../fonts/archivo-black-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-archivo-black",
  display: "swap",
  preload: false,
});
const righteous = localFont({
  src: [
    { path: "../fonts/righteous-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-righteous",
  display: "swap",
  preload: false,
});
const abrilFatface = localFont({
  src: [
    { path: "../fonts/abril-fatface-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-abril-fatface",
  display: "swap",
  preload: false,
});
const syne = localFont({
  src: [
    { path: "../fonts/syne-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-syne",
  display: "swap",
  preload: false,
});
const unbounded = localFont({
  src: [
    { path: "../fonts/unbounded-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-unbounded",
  display: "swap",
  preload: false,
});
const bricolageGrotesque = localFont({
  src: [
    { path: "../fonts/bricolage-grotesque-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-bricolage-grotesque",
  display: "swap",
  preload: false,
});
const teko = localFont({
  src: [
    { path: "../fonts/teko-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-teko",
  display: "swap",
  preload: false,
});
const alfaSlabOne = localFont({
  src: [
    { path: "../fonts/alfa-slab-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-alfa-slab-one",
  display: "swap",
  preload: false,
});
const lobster = localFont({
  src: [
    { path: "../fonts/lobster-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-lobster",
  display: "swap",
  preload: false,
});
const dmSerifDisplay = localFont({
  src: [
    { path: "../fonts/dm-serif-display-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-dm-serif-display",
  display: "swap",
  preload: false,
});
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});
const cormorantGaramond = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-cormorant-garamond",
  display: "swap",
  preload: false,
});
const libreBaskerville = localFont({
  src: [
    { path: "../fonts/libre-baskerville-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/libre-baskerville-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-libre-baskerville",
  display: "swap",
  preload: false,
});
const robotoSlab = localFont({
  src: [
    { path: "../fonts/roboto-slab-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-roboto-slab",
  display: "swap",
  preload: false,
});
const pacifico = localFont({
  src: [
    { path: "../fonts/pacifico-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-pacifico",
  display: "swap",
  preload: false,
});
const caveat = localFont({
  src: [
    { path: "../fonts/caveat-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});
const permanentMarker = localFont({
  src: [
    { path: "../fonts/permanent-marker-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-permanent-marker",
  display: "swap",
  preload: false,
});
const kaushanScript = localFont({
  src: [
    { path: "../fonts/kaushan-script-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-kaushan-script",
  display: "swap",
  preload: false,
});

export const fontVariables = [geist, geistMono, montserrat, poppins, spaceGrotesk, nunito, raleway, oswald, bebasNeue, playfair, lora, merriweather, greatVibes, dancingScript, allura, satisfy, sacramento, inter, dmSans, workSans, rubik, manrope, outfit, plusJakartaSans, archivo, josefinSans, quicksand, comfortaa, ubuntu, barlowCondensed, anton, archivoBlack, righteous, abrilFatface, syne, unbounded, bricolageGrotesque, teko, alfaSlabOne, lobster, dmSerifDisplay, fraunces, cormorantGaramond, libreBaskerville, robotoSlab, pacifico, caveat, permanentMarker, kaushanScript].map((font) => font.variable).join(" ");
