import localFont from "next/font/local";

// Polices auto-hébergées (licence OFL) dans src/fonts : le build ne télécharge rien depuis
// Google Fonts. Seule la police de l'interface est préchargée ; les polices des logos ne sont
// chargées par le navigateur que si un logo les utilise, et leur latin étendu (variable « -ext »)
// que si le texte en contient. Pour les régénérer : python scripts/fetch-fonts.py

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
  adjustFontFallback: false,
});
const montserratExt = localFont({
  src: [
    { path: "../fonts/montserrat-ext-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-montserrat-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
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
  adjustFontFallback: false,
});
const poppinsExt = localFont({
  src: [
    { path: "../fonts/poppins-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/poppins-ext-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const spaceGrotesk = localFont({
  src: [
    { path: "../fonts/space-grotesk-300-700.woff2", weight: "300 700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const spaceGroteskExt = localFont({
  src: [
    { path: "../fonts/space-grotesk-ext-300-700.woff2", weight: "300 700", style: "normal" },
  ],
  variable: "--font-space-grotesk-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const nunito = localFont({
  src: [
    { path: "../fonts/nunito-200-1000.woff2", weight: "200 1000", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const nunitoExt = localFont({
  src: [
    { path: "../fonts/nunito-ext-200-1000.woff2", weight: "200 1000", style: "normal" },
  ],
  variable: "--font-nunito-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const raleway = localFont({
  src: [
    { path: "../fonts/raleway-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-raleway",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ralewayExt = localFont({
  src: [
    { path: "../fonts/raleway-ext-100-900.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-raleway-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const oswald = localFont({
  src: [
    { path: "../fonts/oswald-200-700.woff2", weight: "200 700", style: "normal" },
  ],
  variable: "--font-oswald",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const oswaldExt = localFont({
  src: [
    { path: "../fonts/oswald-ext-200-700.woff2", weight: "200 700", style: "normal" },
  ],
  variable: "--font-oswald-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bebasNeue = localFont({
  src: [
    { path: "../fonts/bebas-neue-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bebas-neue",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bebasNeueExt = localFont({
  src: [
    { path: "../fonts/bebas-neue-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bebas-neue-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const playfair = localFont({
  src: [
    { path: "../fonts/playfair-400-900.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const playfairExt = localFont({
  src: [
    { path: "../fonts/playfair-ext-400-900.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-playfair-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const lora = localFont({
  src: [
    { path: "../fonts/lora-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-lora",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const loraExt = localFont({
  src: [
    { path: "../fonts/lora-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-lora-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
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
  adjustFontFallback: false,
});
const merriweatherExt = localFont({
  src: [
    { path: "../fonts/merriweather-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/merriweather-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/merriweather-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-merriweather-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const greatVibes = localFont({
  src: [
    { path: "../fonts/great-vibes-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const greatVibesExt = localFont({
  src: [
    { path: "../fonts/great-vibes-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-great-vibes-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const dancingScript = localFont({
  src: [
    { path: "../fonts/dancing-script-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-dancing-script",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const dancingScriptExt = localFont({
  src: [
    { path: "../fonts/dancing-script-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-dancing-script-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const allura = localFont({
  src: [
    { path: "../fonts/allura-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-allura",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const alluraExt = localFont({
  src: [
    { path: "../fonts/allura-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-allura-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const satisfy = localFont({
  src: [
    { path: "../fonts/satisfy-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-satisfy",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const sacramento = localFont({
  src: [
    { path: "../fonts/sacramento-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-sacramento",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const sacramentoExt = localFont({
  src: [
    { path: "../fonts/sacramento-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-sacramento-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const inter = localFont({
  src: [
    { path: "../fonts/inter-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const interExt = localFont({
  src: [
    { path: "../fonts/inter-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-inter-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const dmSans = localFont({
  src: [
    { path: "../fonts/dm-sans-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const dmSansExt = localFont({
  src: [
    { path: "../fonts/dm-sans-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-dm-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const workSans = localFont({
  src: [
    { path: "../fonts/work-sans-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-work-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const workSansExt = localFont({
  src: [
    { path: "../fonts/work-sans-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-work-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const rubik = localFont({
  src: [
    { path: "../fonts/rubik-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-rubik",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const rubikExt = localFont({
  src: [
    { path: "../fonts/rubik-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-rubik-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const manrope = localFont({
  src: [
    { path: "../fonts/manrope-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const manropeExt = localFont({
  src: [
    { path: "../fonts/manrope-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-manrope-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const outfit = localFont({
  src: [
    { path: "../fonts/outfit-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const outfitExt = localFont({
  src: [
    { path: "../fonts/outfit-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-outfit-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const plusJakartaSans = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const plusJakartaSansExt = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-plus-jakarta-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const archivo = localFont({
  src: [
    { path: "../fonts/archivo-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const archivoExt = localFont({
  src: [
    { path: "../fonts/archivo-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-archivo-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const josefinSans = localFont({
  src: [
    { path: "../fonts/josefin-sans-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-josefin-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const josefinSansExt = localFont({
  src: [
    { path: "../fonts/josefin-sans-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-josefin-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const quicksand = localFont({
  src: [
    { path: "../fonts/quicksand-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-quicksand",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const quicksandExt = localFont({
  src: [
    { path: "../fonts/quicksand-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-quicksand-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const comfortaa = localFont({
  src: [
    { path: "../fonts/comfortaa-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-comfortaa",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const comfortaaExt = localFont({
  src: [
    { path: "../fonts/comfortaa-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-comfortaa-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const ubuntu = localFont({
  src: [
    { path: "../fonts/ubuntu-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ubuntu-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ubuntu",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ubuntuExt = localFont({
  src: [
    { path: "../fonts/ubuntu-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ubuntu-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ubuntu-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
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
  adjustFontFallback: false,
});
const barlowCondensedExt = localFont({
  src: [
    { path: "../fonts/barlow-condensed-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/barlow-condensed-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-condensed-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-barlow-condensed-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const anton = localFont({
  src: [
    { path: "../fonts/anton-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-anton",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const antonExt = localFont({
  src: [
    { path: "../fonts/anton-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-anton-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const archivoBlack = localFont({
  src: [
    { path: "../fonts/archivo-black-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-archivo-black",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const archivoBlackExt = localFont({
  src: [
    { path: "../fonts/archivo-black-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-archivo-black-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const righteous = localFont({
  src: [
    { path: "../fonts/righteous-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-righteous",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const righteousExt = localFont({
  src: [
    { path: "../fonts/righteous-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-righteous-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const abrilFatface = localFont({
  src: [
    { path: "../fonts/abril-fatface-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-abril-fatface",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const abrilFatfaceExt = localFont({
  src: [
    { path: "../fonts/abril-fatface-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-abril-fatface-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const syne = localFont({
  src: [
    { path: "../fonts/syne-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-syne",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const syneExt = localFont({
  src: [
    { path: "../fonts/syne-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-syne-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const unbounded = localFont({
  src: [
    { path: "../fonts/unbounded-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-unbounded",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const unboundedExt = localFont({
  src: [
    { path: "../fonts/unbounded-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-unbounded-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bricolageGrotesque = localFont({
  src: [
    { path: "../fonts/bricolage-grotesque-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-bricolage-grotesque",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bricolageGrotesqueExt = localFont({
  src: [
    { path: "../fonts/bricolage-grotesque-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-bricolage-grotesque-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const teko = localFont({
  src: [
    { path: "../fonts/teko-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-teko",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const tekoExt = localFont({
  src: [
    { path: "../fonts/teko-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-teko-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const alfaSlabOne = localFont({
  src: [
    { path: "../fonts/alfa-slab-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-alfa-slab-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const alfaSlabOneExt = localFont({
  src: [
    { path: "../fonts/alfa-slab-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-alfa-slab-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const lobster = localFont({
  src: [
    { path: "../fonts/lobster-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-lobster",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const lobsterExt = localFont({
  src: [
    { path: "../fonts/lobster-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-lobster-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const dmSerifDisplay = localFont({
  src: [
    { path: "../fonts/dm-serif-display-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-dm-serif-display",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const dmSerifDisplayExt = localFont({
  src: [
    { path: "../fonts/dm-serif-display-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-dm-serif-display-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const frauncesExt = localFont({
  src: [
    { path: "../fonts/fraunces-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-fraunces-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const cormorantGaramond = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-cormorant-garamond",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const cormorantGaramondExt = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-cormorant-garamond-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const libreBaskerville = localFont({
  src: [
    { path: "../fonts/libre-baskerville-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/libre-baskerville-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-libre-baskerville",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const libreBaskervilleExt = localFont({
  src: [
    { path: "../fonts/libre-baskerville-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/libre-baskerville-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-libre-baskerville-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const robotoSlab = localFont({
  src: [
    { path: "../fonts/roboto-slab-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-roboto-slab",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const robotoSlabExt = localFont({
  src: [
    { path: "../fonts/roboto-slab-ext-400-800.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-roboto-slab-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const pacifico = localFont({
  src: [
    { path: "../fonts/pacifico-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-pacifico",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const pacificoExt = localFont({
  src: [
    { path: "../fonts/pacifico-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-pacifico-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const caveat = localFont({
  src: [
    { path: "../fonts/caveat-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const caveatExt = localFont({
  src: [
    { path: "../fonts/caveat-ext-400-700.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-caveat-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const permanentMarker = localFont({
  src: [
    { path: "../fonts/permanent-marker-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-permanent-marker",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const kaushanScript = localFont({
  src: [
    { path: "../fonts/kaushan-script-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-kaushan-script",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const kaushanScriptExt = localFont({
  src: [
    { path: "../fonts/kaushan-script-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-kaushan-script-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const notoSansNko = localFont({
  src: [
    { path: "../fonts/noto-sans-nko-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-nko",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+060C, U+061B, U+061F, U+066A, U+07C0-07FF, U+200C-200F, U+25CC, U+2E1C-2E1D, U+FD3E-FD3F" }],
  adjustFontFallback: false,
});

export const fontVariables = [geist, geistMono, montserrat, montserratExt, poppins, poppinsExt, spaceGrotesk, spaceGroteskExt, nunito, nunitoExt, raleway, ralewayExt, oswald, oswaldExt, bebasNeue, bebasNeueExt, playfair, playfairExt, lora, loraExt, merriweather, merriweatherExt, greatVibes, greatVibesExt, dancingScript, dancingScriptExt, allura, alluraExt, satisfy, sacramento, sacramentoExt, inter, interExt, dmSans, dmSansExt, workSans, workSansExt, rubik, rubikExt, manrope, manropeExt, outfit, outfitExt, plusJakartaSans, plusJakartaSansExt, archivo, archivoExt, josefinSans, josefinSansExt, quicksand, quicksandExt, comfortaa, comfortaaExt, ubuntu, ubuntuExt, barlowCondensed, barlowCondensedExt, anton, antonExt, archivoBlack, archivoBlackExt, righteous, righteousExt, abrilFatface, abrilFatfaceExt, syne, syneExt, unbounded, unboundedExt, bricolageGrotesque, bricolageGrotesqueExt, teko, tekoExt, alfaSlabOne, alfaSlabOneExt, lobster, lobsterExt, dmSerifDisplay, dmSerifDisplayExt, fraunces, frauncesExt, cormorantGaramond, cormorantGaramondExt, libreBaskerville, libreBaskervilleExt, robotoSlab, robotoSlabExt, pacifico, pacificoExt, caveat, caveatExt, permanentMarker, kaushanScript, kaushanScriptExt, notoSansNko].map((font) => font.variable).join(" ");
