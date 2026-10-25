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
const graduate = localFont({
  src: [
    { path: "../fonts/graduate-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-graduate",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bigShoulders = localFont({
  src: [
    { path: "../fonts/big-shoulders-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/big-shoulders-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/big-shoulders-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-big-shoulders",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bigShouldersExt = localFont({
  src: [
    { path: "../fonts/big-shoulders-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/big-shoulders-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/big-shoulders-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-big-shoulders-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bigShouldersInline = localFont({
  src: [
    { path: "../fonts/big-shoulders-inline-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/big-shoulders-inline-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-big-shoulders-inline",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bigShouldersInlineExt = localFont({
  src: [
    { path: "../fonts/big-shoulders-inline-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/big-shoulders-inline-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-big-shoulders-inline-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bigShouldersStencil = localFont({
  src: [
    { path: "../fonts/big-shoulders-stencil-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/big-shoulders-stencil-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-big-shoulders-stencil",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bigShouldersStencilExt = localFont({
  src: [
    { path: "../fonts/big-shoulders-stencil-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/big-shoulders-stencil-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-big-shoulders-stencil-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bungee = localFont({
  src: [
    { path: "../fonts/bungee-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bungee",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bungeeExt = localFont({
  src: [
    { path: "../fonts/bungee-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bungee-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bungeeInline = localFont({
  src: [
    { path: "../fonts/bungee-inline-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bungee-inline",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bungeeInlineExt = localFont({
  src: [
    { path: "../fonts/bungee-inline-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bungee-inline-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bungeeShade = localFont({
  src: [
    { path: "../fonts/bungee-shade-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bungee-shade",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bungeeShadeExt = localFont({
  src: [
    { path: "../fonts/bungee-shade-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bungee-shade-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const russoOne = localFont({
  src: [
    { path: "../fonts/russo-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-russo-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const russoOneExt = localFont({
  src: [
    { path: "../fonts/russo-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-russo-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const squadaOne = localFont({
  src: [
    { path: "../fonts/squada-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-squada-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const staatliches = localFont({
  src: [
    { path: "../fonts/staatliches-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-staatliches",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const staatlichesExt = localFont({
  src: [
    { path: "../fonts/staatliches-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-staatliches-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const sairaCondensed = localFont({
  src: [
    { path: "../fonts/saira-condensed-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/saira-condensed-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/saira-condensed-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-saira-condensed",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const sairaCondensedExt = localFont({
  src: [
    { path: "../fonts/saira-condensed-ext-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/saira-condensed-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/saira-condensed-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-saira-condensed-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const sairaExtraCondensed = localFont({
  src: [
    { path: "../fonts/saira-extra-condensed-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/saira-extra-condensed-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/saira-extra-condensed-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-saira-extra-condensed",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const sairaExtraCondensedExt = localFont({
  src: [
    { path: "../fonts/saira-extra-condensed-ext-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/saira-extra-condensed-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/saira-extra-condensed-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-saira-extra-condensed-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const sairaStencil = localFont({
  src: [
    { path: "../fonts/saira-stencil-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-saira-stencil",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const sairaStencilExt = localFont({
  src: [
    { path: "../fonts/saira-stencil-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-saira-stencil-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const chakraPetch = localFont({
  src: [
    { path: "../fonts/chakra-petch-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/chakra-petch-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-chakra-petch",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const chakraPetchExt = localFont({
  src: [
    { path: "../fonts/chakra-petch-ext-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/chakra-petch-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-chakra-petch-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const blackOpsOne = localFont({
  src: [
    { path: "../fonts/black-ops-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-black-ops-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const blackOpsOneExt = localFont({
  src: [
    { path: "../fonts/black-ops-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-black-ops-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const racingSansOne = localFont({
  src: [
    { path: "../fonts/racing-sans-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-racing-sans-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const racingSansOneExt = localFont({
  src: [
    { path: "../fonts/racing-sans-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-racing-sans-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const orbitron = localFont({
  src: [
    { path: "../fonts/orbitron-500-900.woff2", weight: "500 900", style: "normal" },
  ],
  variable: "--font-orbitron",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const audiowide = localFont({
  src: [
    { path: "../fonts/audiowide-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-audiowide",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const audiowideExt = localFont({
  src: [
    { path: "../fonts/audiowide-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-audiowide-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const kanit = localFont({
  src: [
    { path: "../fonts/kanit-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/kanit-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/kanit-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-kanit",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const kanitExt = localFont({
  src: [
    { path: "../fonts/kanit-ext-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/kanit-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/kanit-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-kanit-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const rajdhani = localFont({
  src: [
    { path: "../fonts/rajdhani-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/rajdhani-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-rajdhani",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const rajdhaniExt = localFont({
  src: [
    { path: "../fonts/rajdhani-ext-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/rajdhani-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-rajdhani-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const exo2 = localFont({
  src: [
    { path: "../fonts/exo-2-500-900.woff2", weight: "500 900", style: "normal" },
  ],
  variable: "--font-exo-2",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const exo2Ext = localFont({
  src: [
    { path: "../fonts/exo-2-ext-500-900.woff2", weight: "500 900", style: "normal" },
  ],
  variable: "--font-exo-2-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const changaOne = localFont({
  src: [
    { path: "../fonts/changa-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-changa-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bowlbyOneSc = localFont({
  src: [
    { path: "../fonts/bowlby-one-sc-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bowlby-one-sc",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bowlbyOneScExt = localFont({
  src: [
    { path: "../fonts/bowlby-one-sc-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bowlby-one-sc-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const holtwoodOneSc = localFont({
  src: [
    { path: "../fonts/holtwood-one-sc-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-holtwood-one-sc",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const holtwoodOneScExt = localFont({
  src: [
    { path: "../fonts/holtwood-one-sc-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-holtwood-one-sc-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const monoton = localFont({
  src: [
    { path: "../fonts/monoton-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-monoton",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const monotonExt = localFont({
  src: [
    { path: "../fonts/monoton-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-monoton-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const tourney = localFont({
  src: [
    { path: "../fonts/tourney-600-800.woff2", weight: "600 800", style: "normal" },
  ],
  variable: "--font-tourney",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const tourneyExt = localFont({
  src: [
    { path: "../fonts/tourney-ext-600-800.woff2", weight: "600 800", style: "normal" },
  ],
  variable: "--font-tourney-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const goldman = localFont({
  src: [
    { path: "../fonts/goldman-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/goldman-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-goldman",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const goldmanExt = localFont({
  src: [
    { path: "../fonts/goldman-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/goldman-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-goldman-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const zenDots = localFont({
  src: [
    { path: "../fonts/zen-dots-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-zen-dots",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const zenDotsExt = localFont({
  src: [
    { path: "../fonts/zen-dots-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-zen-dots-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const michroma = localFont({
  src: [
    { path: "../fonts/michroma-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-michroma",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const michromaExt = localFont({
  src: [
    { path: "../fonts/michroma-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-michroma-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const anta = localFont({
  src: [
    { path: "../fonts/anta-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-anta",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const antaExt = localFont({
  src: [
    { path: "../fonts/anta-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-anta-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const oxanium = localFont({
  src: [
    { path: "../fonts/oxanium-500-800.woff2", weight: "500 800", style: "normal" },
  ],
  variable: "--font-oxanium",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const oxaniumExt = localFont({
  src: [
    { path: "../fonts/oxanium-ext-500-800.woff2", weight: "500 800", style: "normal" },
  ],
  variable: "--font-oxanium-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const tektur = localFont({
  src: [
    { path: "../fonts/tektur-500-900.woff2", weight: "500 900", style: "normal" },
  ],
  variable: "--font-tektur",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const tekturExt = localFont({
  src: [
    { path: "../fonts/tektur-ext-500-900.woff2", weight: "500 900", style: "normal" },
  ],
  variable: "--font-tektur-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bevan = localFont({
  src: [
    { path: "../fonts/bevan-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bevan",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bevanExt = localFont({
  src: [
    { path: "../fonts/bevan-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bevan-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const sarpanch = localFont({
  src: [
    { path: "../fonts/sarpanch-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/sarpanch-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/sarpanch-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-sarpanch",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const sarpanchExt = localFont({
  src: [
    { path: "../fonts/sarpanch-ext-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/sarpanch-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/sarpanch-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-sarpanch-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const jockeyOne = localFont({
  src: [
    { path: "../fonts/jockey-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-jockey-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const jockeyOneExt = localFont({
  src: [
    { path: "../fonts/jockey-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-jockey-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const passionOne = localFont({
  src: [
    { path: "../fonts/passion-one-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/passion-one-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/passion-one-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-passion-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const passionOneExt = localFont({
  src: [
    { path: "../fonts/passion-one-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/passion-one-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/passion-one-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-passion-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const fugazOne = localFont({
  src: [
    { path: "../fonts/fugaz-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-fugaz-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const daysOne = localFont({
  src: [
    { path: "../fonts/days-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-days-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const roboto = localFont({
  src: [
    { path: "../fonts/roboto-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/roboto-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/roboto-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/roboto-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-roboto",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const robotoExt = localFont({
  src: [
    { path: "../fonts/roboto-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/roboto-ext-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/roboto-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/roboto-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-roboto-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const openSans = localFont({
  src: [
    { path: "../fonts/open-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/open-sans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/open-sans-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/open-sans-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-open-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const openSansExt = localFont({
  src: [
    { path: "../fonts/open-sans-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/open-sans-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/open-sans-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/open-sans-ext-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-open-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const lato = localFont({
  src: [
    { path: "../fonts/lato-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/lato-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/lato-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-lato",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const latoExt = localFont({
  src: [
    { path: "../fonts/lato-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/lato-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/lato-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-lato-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const robotoCondensed = localFont({
  src: [
    { path: "../fonts/roboto-condensed-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/roboto-condensed-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-roboto-condensed",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const robotoCondensedExt = localFont({
  src: [
    { path: "../fonts/roboto-condensed-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/roboto-condensed-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-roboto-condensed-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const notoSans = localFont({
  src: [
    { path: "../fonts/noto-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-sans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const notoSansExt = localFont({
  src: [
    { path: "../fonts/noto-sans-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-sans-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const sourceSans3 = localFont({
  src: [
    { path: "../fonts/source-sans-3-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/source-sans-3-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/source-sans-3-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-source-sans-3",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const sourceSans3Ext = localFont({
  src: [
    { path: "../fonts/source-sans-3-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/source-sans-3-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/source-sans-3-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-source-sans-3-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const nunitoSans = localFont({
  src: [
    { path: "../fonts/nunito-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/nunito-sans-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/nunito-sans-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-nunito-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const nunitoSansExt = localFont({
  src: [
    { path: "../fonts/nunito-sans-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/nunito-sans-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/nunito-sans-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-nunito-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const ptSans = localFont({
  src: [
    { path: "../fonts/pt-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/pt-sans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pt-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ptSansExt = localFont({
  src: [
    { path: "../fonts/pt-sans-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/pt-sans-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pt-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const mukta = localFont({
  src: [
    { path: "../fonts/mukta-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/mukta-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mukta",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const muktaExt = localFont({
  src: [
    { path: "../fonts/mukta-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/mukta-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mukta-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const firaSans = localFont({
  src: [
    { path: "../fonts/fira-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fira-sans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/fira-sans-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-fira-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const firaSansExt = localFont({
  src: [
    { path: "../fonts/fira-sans-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fira-sans-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/fira-sans-ext-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-fira-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const barlow = localFont({
  src: [
    { path: "../fonts/barlow-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/barlow-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const barlowExt = localFont({
  src: [
    { path: "../fonts/barlow-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/barlow-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-ext-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-barlow-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const titilliumWeb = localFont({
  src: [
    { path: "../fonts/titillium-web-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/titillium-web-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/titillium-web-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-titillium-web",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const titilliumWebExt = localFont({
  src: [
    { path: "../fonts/titillium-web-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/titillium-web-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/titillium-web-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-titillium-web-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const heebo = localFont({
  src: [
    { path: "../fonts/heebo-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/heebo-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/heebo-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-heebo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const heeboExt = localFont({
  src: [
    { path: "../fonts/heebo-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/heebo-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/heebo-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-heebo-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const ibmPlexSans = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ibmPlexSansExt = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ibm-plex-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const karla = localFont({
  src: [
    { path: "../fonts/karla-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/karla-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-karla",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const karlaExt = localFont({
  src: [
    { path: "../fonts/karla-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/karla-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-karla-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const libreFranklin = localFont({
  src: [
    { path: "../fonts/libre-franklin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/libre-franklin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/libre-franklin-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-libre-franklin",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const libreFranklinExt = localFont({
  src: [
    { path: "../fonts/libre-franklin-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/libre-franklin-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/libre-franklin-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-libre-franklin-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const mulish = localFont({
  src: [
    { path: "../fonts/mulish-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/mulish-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/mulish-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-mulish",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const mulishExt = localFont({
  src: [
    { path: "../fonts/mulish-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/mulish-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/mulish-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-mulish-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const hind = localFont({
  src: [
    { path: "../fonts/hind-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/hind-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/hind-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hind",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const hindExt = localFont({
  src: [
    { path: "../fonts/hind-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/hind-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/hind-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hind-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const arimo = localFont({
  src: [
    { path: "../fonts/arimo-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/arimo-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-arimo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const arimoExt = localFont({
  src: [
    { path: "../fonts/arimo-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/arimo-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-arimo-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const dosis = localFont({
  src: [
    { path: "../fonts/dosis-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/dosis-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dosis",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const dosisExt = localFont({
  src: [
    { path: "../fonts/dosis-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/dosis-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dosis-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const cabin = localFont({
  src: [
    { path: "../fonts/cabin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cabin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cabin",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const cabinExt = localFont({
  src: [
    { path: "../fonts/cabin-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cabin-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cabin-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const oxygen = localFont({
  src: [
    { path: "../fonts/oxygen-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/oxygen-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-oxygen",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const oxygenExt = localFont({
  src: [
    { path: "../fonts/oxygen-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/oxygen-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-oxygen-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const lexend = localFont({
  src: [
    { path: "../fonts/lexend-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/lexend-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lexend",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const lexendExt = localFont({
  src: [
    { path: "../fonts/lexend-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/lexend-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lexend-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const abel = localFont({
  src: [
    { path: "../fonts/abel-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-abel",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const cairo = localFont({
  src: [
    { path: "../fonts/cairo-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cairo-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const cairoExt = localFont({
  src: [
    { path: "../fonts/cairo-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cairo-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cairo-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const fjallaOne = localFont({
  src: [
    { path: "../fonts/fjalla-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-fjalla-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const fjallaOneExt = localFont({
  src: [
    { path: "../fonts/fjalla-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-fjalla-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const signika = localFont({
  src: [
    { path: "../fonts/signika-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/signika-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-signika",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const signikaExt = localFont({
  src: [
    { path: "../fonts/signika-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/signika-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-signika-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const prompt = localFont({
  src: [
    { path: "../fonts/prompt-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/prompt-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-prompt",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const promptExt = localFont({
  src: [
    { path: "../fonts/prompt-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/prompt-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-prompt-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const varelaRound = localFont({
  src: [
    { path: "../fonts/varela-round-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-varela-round",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const varelaRoundExt = localFont({
  src: [
    { path: "../fonts/varela-round-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-varela-round-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const overpass = localFont({
  src: [
    { path: "../fonts/overpass-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/overpass-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-overpass",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const overpassExt = localFont({
  src: [
    { path: "../fonts/overpass-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/overpass-ext-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-overpass-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const asap = localFont({
  src: [
    { path: "../fonts/asap-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/asap-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-asap",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const asapExt = localFont({
  src: [
    { path: "../fonts/asap-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/asap-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-asap-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const mavenPro = localFont({
  src: [
    { path: "../fonts/maven-pro-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/maven-pro-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-maven-pro",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const mavenProExt = localFont({
  src: [
    { path: "../fonts/maven-pro-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/maven-pro-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-maven-pro-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const questrial = localFont({
  src: [
    { path: "../fonts/questrial-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-questrial",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const questrialExt = localFont({
  src: [
    { path: "../fonts/questrial-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-questrial-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const sora = localFont({
  src: [
    { path: "../fonts/sora-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/sora-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sora",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const soraExt = localFont({
  src: [
    { path: "../fonts/sora-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/sora-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sora-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const figtree = localFont({
  src: [
    { path: "../fonts/figtree-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/figtree-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/figtree-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-figtree",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const figtreeExt = localFont({
  src: [
    { path: "../fonts/figtree-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/figtree-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/figtree-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-figtree-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const urbanist = localFont({
  src: [
    { path: "../fonts/urbanist-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/urbanist-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/urbanist-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-urbanist",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const urbanistExt = localFont({
  src: [
    { path: "../fonts/urbanist-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/urbanist-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/urbanist-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-urbanist-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const jost = localFont({
  src: [
    { path: "../fonts/jost-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jost-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jost",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const jostExt = localFont({
  src: [
    { path: "../fonts/jost-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jost-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jost-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const redHatDisplay = localFont({
  src: [
    { path: "../fonts/red-hat-display-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/red-hat-display-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/red-hat-display-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-red-hat-display",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const redHatDisplayExt = localFont({
  src: [
    { path: "../fonts/red-hat-display-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/red-hat-display-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/red-hat-display-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-red-hat-display-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const archivoNarrow = localFont({
  src: [
    { path: "../fonts/archivo-narrow-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/archivo-narrow-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-archivo-narrow",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const archivoNarrowExt = localFont({
  src: [
    { path: "../fonts/archivo-narrow-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/archivo-narrow-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-archivo-narrow-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const ptSansNarrow = localFont({
  src: [
    { path: "../fonts/pt-sans-narrow-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/pt-sans-narrow-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pt-sans-narrow",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ptSansNarrowExt = localFont({
  src: [
    { path: "../fonts/pt-sans-narrow-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/pt-sans-narrow-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pt-sans-narrow-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const publicSans = localFont({
  src: [
    { path: "../fonts/public-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/public-sans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-public-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const publicSansExt = localFont({
  src: [
    { path: "../fonts/public-sans-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/public-sans-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-public-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const notoSerif = localFont({
  src: [
    { path: "../fonts/noto-serif-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-serif-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-serif",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const notoSerifExt = localFont({
  src: [
    { path: "../fonts/noto-serif-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-serif-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-serif-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const ptSerif = localFont({
  src: [
    { path: "../fonts/pt-serif-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/pt-serif-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pt-serif",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ptSerifExt = localFont({
  src: [
    { path: "../fonts/pt-serif-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/pt-serif-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pt-serif-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const ebGaramond = localFont({
  src: [
    { path: "../fonts/eb-garamond-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/eb-garamond-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-eb-garamond",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ebGaramondExt = localFont({
  src: [
    { path: "../fonts/eb-garamond-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/eb-garamond-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-eb-garamond-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const crimsonText = localFont({
  src: [
    { path: "../fonts/crimson-text-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/crimson-text-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-crimson-text",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const crimsonTextExt = localFont({
  src: [
    { path: "../fonts/crimson-text-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/crimson-text-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-crimson-text-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bitter = localFont({
  src: [
    { path: "../fonts/bitter-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/bitter-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bitter",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bitterExt = localFont({
  src: [
    { path: "../fonts/bitter-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/bitter-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bitter-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const zillaSlab = localFont({
  src: [
    { path: "../fonts/zilla-slab-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/zilla-slab-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-zilla-slab",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const zillaSlabExt = localFont({
  src: [
    { path: "../fonts/zilla-slab-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/zilla-slab-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-zilla-slab-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const alegreya = localFont({
  src: [
    { path: "../fonts/alegreya-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/alegreya-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-alegreya",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const alegreyaExt = localFont({
  src: [
    { path: "../fonts/alegreya-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/alegreya-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-alegreya-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const cinzel = localFont({
  src: [
    { path: "../fonts/cinzel-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cinzel-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cinzel-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-cinzel",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const cinzelExt = localFont({
  src: [
    { path: "../fonts/cinzel-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cinzel-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cinzel-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-cinzel-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const arvo = localFont({
  src: [
    { path: "../fonts/arvo-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/arvo-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-arvo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const domine = localFont({
  src: [
    { path: "../fonts/domine-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/domine-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-domine",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const domineExt = localFont({
  src: [
    { path: "../fonts/domine-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/domine-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-domine-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const patuaOne = localFont({
  src: [
    { path: "../fonts/patua-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-patua-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const courierPrime = localFont({
  src: [
    { path: "../fonts/courier-prime-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/courier-prime-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-courier-prime",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const courierPrimeExt = localFont({
  src: [
    { path: "../fonts/courier-prime-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/courier-prime-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-courier-prime-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bangers = localFont({
  src: [
    { path: "../fonts/bangers-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bangers",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bangersExt = localFont({
  src: [
    { path: "../fonts/bangers-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bangers-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const fredoka = localFont({
  src: [
    { path: "../fonts/fredoka-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fredoka-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/fredoka-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-fredoka",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const fredokaExt = localFont({
  src: [
    { path: "../fonts/fredoka-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fredoka-ext-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/fredoka-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-fredoka-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const lilitaOne = localFont({
  src: [
    { path: "../fonts/lilita-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-lilita-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const lilitaOneExt = localFont({
  src: [
    { path: "../fonts/lilita-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-lilita-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const carterOne = localFont({
  src: [
    { path: "../fonts/carter-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-carter-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const concertOne = localFont({
  src: [
    { path: "../fonts/concert-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-concert-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const concertOneExt = localFont({
  src: [
    { path: "../fonts/concert-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-concert-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const paytoneOne = localFont({
  src: [
    { path: "../fonts/paytone-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-paytone-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const paytoneOneExt = localFont({
  src: [
    { path: "../fonts/paytone-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-paytone-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bubblegumSans = localFont({
  src: [
    { path: "../fonts/bubblegum-sans-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bubblegum-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const bubblegumSansExt = localFont({
  src: [
    { path: "../fonts/bubblegum-sans-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bubblegum-sans-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const hennyPenny = localFont({
  src: [
    { path: "../fonts/henny-penny-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-henny-penny",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const emilysCandy = localFont({
  src: [
    { path: "../fonts/emilys-candy-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-emilys-candy",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const emilysCandyExt = localFont({
  src: [
    { path: "../fonts/emilys-candy-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-emilys-candy-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const pressStart2p = localFont({
  src: [
    { path: "../fonts/press-start-2p-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-press-start-2p",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const pressStart2pExt = localFont({
  src: [
    { path: "../fonts/press-start-2p-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-press-start-2p-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const baloo2 = localFont({
  src: [
    { path: "../fonts/baloo-2-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/baloo-2-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/baloo-2-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-baloo-2",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const baloo2Ext = localFont({
  src: [
    { path: "../fonts/baloo-2-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/baloo-2-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/baloo-2-ext-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-baloo-2-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const lobsterTwo = localFont({
  src: [
    { path: "../fonts/lobster-two-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/lobster-two-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lobster-two",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const rye = localFont({
  src: [
    { path: "../fonts/rye-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-rye",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const ryeExt = localFont({
  src: [
    { path: "../fonts/rye-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-rye-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const cinzelDecorative = localFont({
  src: [
    { path: "../fonts/cinzel-decorative-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cinzel-decorative-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cinzel-decorative-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-cinzel-decorative",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const cinzelDecorativeExt = localFont({
  src: [
    { path: "../fonts/cinzel-decorative-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cinzel-decorative-ext-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cinzel-decorative-ext-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-cinzel-decorative-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const creepster = localFont({
  src: [
    { path: "../fonts/creepster-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-creepster",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const titanOne = localFont({
  src: [
    { path: "../fonts/titan-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-titan-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const titanOneExt = localFont({
  src: [
    { path: "../fonts/titan-one-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-titan-one-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const sniglet = localFont({
  src: [
    { path: "../fonts/sniglet-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/sniglet-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-sniglet",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const snigletExt = localFont({
  src: [
    { path: "../fonts/sniglet-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/sniglet-ext-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-sniglet-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const berkshireSwash = localFont({
  src: [
    { path: "../fonts/berkshire-swash-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-berkshire-swash",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const berkshireSwashExt = localFont({
  src: [
    { path: "../fonts/berkshire-swash-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-berkshire-swash-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const bowlbyOne = localFont({
  src: [
    { path: "../fonts/bowlby-one-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-bowlby-one",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const shadowsIntoLight = localFont({
  src: [
    { path: "../fonts/shadows-into-light-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-shadows-into-light",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const shadowsIntoLightExt = localFont({
  src: [
    { path: "../fonts/shadows-into-light-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-shadows-into-light-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const indieFlower = localFont({
  src: [
    { path: "../fonts/indie-flower-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-indie-flower",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const indieFlowerExt = localFont({
  src: [
    { path: "../fonts/indie-flower-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-indie-flower-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const amaticSc = localFont({
  src: [
    { path: "../fonts/amatic-sc-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/amatic-sc-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-amatic-sc",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const amaticScExt = localFont({
  src: [
    { path: "../fonts/amatic-sc-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/amatic-sc-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-amatic-sc-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const kalam = localFont({
  src: [
    { path: "../fonts/kalam-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/kalam-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-kalam",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const kalamExt = localFont({
  src: [
    { path: "../fonts/kalam-ext-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/kalam-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-kalam-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const courgette = localFont({
  src: [
    { path: "../fonts/courgette-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-courgette",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const courgetteExt = localFont({
  src: [
    { path: "../fonts/courgette-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-courgette-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const damion = localFont({
  src: [
    { path: "../fonts/damion-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-damion",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const damionExt = localFont({
  src: [
    { path: "../fonts/damion-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-damion-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const cookie = localFont({
  src: [
    { path: "../fonts/cookie-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-cookie",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const playball = localFont({
  src: [
    { path: "../fonts/playball-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-playball",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const playballExt = localFont({
  src: [
    { path: "../fonts/playball-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-playball-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const parisienne = localFont({
  src: [
    { path: "../fonts/parisienne-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-parisienne",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const parisienneExt = localFont({
  src: [
    { path: "../fonts/parisienne-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-parisienne-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const alexBrush = localFont({
  src: [
    { path: "../fonts/alex-brush-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-alex-brush",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const alexBrushExt = localFont({
  src: [
    { path: "../fonts/alex-brush-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-alex-brush-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const pinyonScript = localFont({
  src: [
    { path: "../fonts/pinyon-script-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-pinyon-script",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const pinyonScriptExt = localFont({
  src: [
    { path: "../fonts/pinyon-script-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-pinyon-script-ext",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  adjustFontFallback: false,
});
const tangerine = localFont({
  src: [
    { path: "../fonts/tangerine-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/tangerine-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-tangerine",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const grandHotel = localFont({
  src: [
    { path: "../fonts/grand-hotel-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-grand-hotel",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const grandHotelExt = localFont({
  src: [
    { path: "../fonts/grand-hotel-ext-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-grand-hotel-ext",
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

export const fontVariables = [geist, geistMono, montserrat, montserratExt, poppins, poppinsExt, spaceGrotesk, spaceGroteskExt, nunito, nunitoExt, raleway, ralewayExt, oswald, oswaldExt, bebasNeue, bebasNeueExt, playfair, playfairExt, lora, loraExt, merriweather, merriweatherExt, greatVibes, greatVibesExt, dancingScript, dancingScriptExt, allura, alluraExt, satisfy, sacramento, sacramentoExt, inter, interExt, dmSans, dmSansExt, workSans, workSansExt, rubik, rubikExt, manrope, manropeExt, outfit, outfitExt, plusJakartaSans, plusJakartaSansExt, archivo, archivoExt, josefinSans, josefinSansExt, quicksand, quicksandExt, comfortaa, comfortaaExt, ubuntu, ubuntuExt, barlowCondensed, barlowCondensedExt, anton, antonExt, archivoBlack, archivoBlackExt, righteous, righteousExt, abrilFatface, abrilFatfaceExt, syne, syneExt, unbounded, unboundedExt, bricolageGrotesque, bricolageGrotesqueExt, teko, tekoExt, alfaSlabOne, alfaSlabOneExt, lobster, lobsterExt, dmSerifDisplay, dmSerifDisplayExt, fraunces, frauncesExt, cormorantGaramond, cormorantGaramondExt, libreBaskerville, libreBaskervilleExt, robotoSlab, robotoSlabExt, pacifico, pacificoExt, caveat, caveatExt, permanentMarker, kaushanScript, kaushanScriptExt, graduate, bigShoulders, bigShouldersExt, bigShouldersInline, bigShouldersInlineExt, bigShouldersStencil, bigShouldersStencilExt, bungee, bungeeExt, bungeeInline, bungeeInlineExt, bungeeShade, bungeeShadeExt, russoOne, russoOneExt, squadaOne, staatliches, staatlichesExt, sairaCondensed, sairaCondensedExt, sairaExtraCondensed, sairaExtraCondensedExt, sairaStencil, sairaStencilExt, chakraPetch, chakraPetchExt, blackOpsOne, blackOpsOneExt, racingSansOne, racingSansOneExt, orbitron, audiowide, audiowideExt, kanit, kanitExt, rajdhani, rajdhaniExt, exo2, exo2Ext, changaOne, bowlbyOneSc, bowlbyOneScExt, holtwoodOneSc, holtwoodOneScExt, monoton, monotonExt, tourney, tourneyExt, goldman, goldmanExt, zenDots, zenDotsExt, michroma, michromaExt, anta, antaExt, oxanium, oxaniumExt, tektur, tekturExt, bevan, bevanExt, sarpanch, sarpanchExt, jockeyOne, jockeyOneExt, passionOne, passionOneExt, fugazOne, daysOne, roboto, robotoExt, openSans, openSansExt, lato, latoExt, robotoCondensed, robotoCondensedExt, notoSans, notoSansExt, sourceSans3, sourceSans3Ext, nunitoSans, nunitoSansExt, ptSans, ptSansExt, mukta, muktaExt, firaSans, firaSansExt, barlow, barlowExt, titilliumWeb, titilliumWebExt, heebo, heeboExt, ibmPlexSans, ibmPlexSansExt, karla, karlaExt, libreFranklin, libreFranklinExt, mulish, mulishExt, hind, hindExt, arimo, arimoExt, dosis, dosisExt, cabin, cabinExt, oxygen, oxygenExt, lexend, lexendExt, abel, cairo, cairoExt, fjallaOne, fjallaOneExt, signika, signikaExt, prompt, promptExt, varelaRound, varelaRoundExt, overpass, overpassExt, asap, asapExt, mavenPro, mavenProExt, questrial, questrialExt, sora, soraExt, figtree, figtreeExt, urbanist, urbanistExt, jost, jostExt, redHatDisplay, redHatDisplayExt, archivoNarrow, archivoNarrowExt, ptSansNarrow, ptSansNarrowExt, publicSans, publicSansExt, notoSerif, notoSerifExt, ptSerif, ptSerifExt, ebGaramond, ebGaramondExt, crimsonText, crimsonTextExt, bitter, bitterExt, zillaSlab, zillaSlabExt, alegreya, alegreyaExt, cinzel, cinzelExt, arvo, domine, domineExt, patuaOne, courierPrime, courierPrimeExt, bangers, bangersExt, fredoka, fredokaExt, lilitaOne, lilitaOneExt, carterOne, concertOne, concertOneExt, paytoneOne, paytoneOneExt, bubblegumSans, bubblegumSansExt, hennyPenny, emilysCandy, emilysCandyExt, pressStart2p, pressStart2pExt, baloo2, baloo2Ext, lobsterTwo, rye, ryeExt, cinzelDecorative, cinzelDecorativeExt, creepster, titanOne, titanOneExt, sniglet, snigletExt, berkshireSwash, berkshireSwashExt, bowlbyOne, shadowsIntoLight, shadowsIntoLightExt, indieFlower, indieFlowerExt, amaticSc, amaticScExt, kalam, kalamExt, courgette, courgetteExt, damion, damionExt, cookie, playball, playballExt, parisienne, parisienneExt, alexBrush, alexBrushExt, pinyonScript, pinyonScriptExt, tangerine, grandHotel, grandHotelExt, notoSansNko].map((font) => font.variable).join(" ");
