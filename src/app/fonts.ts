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

export const fontVariables = [geist, geistMono, montserrat, montserratExt, poppins, poppinsExt, spaceGrotesk, spaceGroteskExt, nunito, nunitoExt, raleway, ralewayExt, oswald, oswaldExt, bebasNeue, bebasNeueExt, playfair, playfairExt, lora, loraExt, merriweather, merriweatherExt, greatVibes, greatVibesExt, dancingScript, dancingScriptExt, allura, alluraExt, satisfy, sacramento, sacramentoExt, inter, interExt, dmSans, dmSansExt, workSans, workSansExt, rubik, rubikExt, manrope, manropeExt, outfit, outfitExt, plusJakartaSans, plusJakartaSansExt, archivo, archivoExt, josefinSans, josefinSansExt, quicksand, quicksandExt, comfortaa, comfortaaExt, ubuntu, ubuntuExt, barlowCondensed, barlowCondensedExt, anton, antonExt, archivoBlack, archivoBlackExt, righteous, righteousExt, abrilFatface, abrilFatfaceExt, syne, syneExt, unbounded, unboundedExt, bricolageGrotesque, bricolageGrotesqueExt, teko, tekoExt, alfaSlabOne, alfaSlabOneExt, lobster, lobsterExt, dmSerifDisplay, dmSerifDisplayExt, fraunces, frauncesExt, cormorantGaramond, cormorantGaramondExt, libreBaskerville, libreBaskervilleExt, robotoSlab, robotoSlabExt, pacifico, pacificoExt, caveat, caveatExt, permanentMarker, kaushanScript, kaushanScriptExt, graduate, bigShoulders, bigShouldersExt, bigShouldersInline, bigShouldersInlineExt, bigShouldersStencil, bigShouldersStencilExt, bungee, bungeeExt, bungeeInline, bungeeInlineExt, bungeeShade, bungeeShadeExt, russoOne, russoOneExt, squadaOne, staatliches, staatlichesExt, sairaCondensed, sairaCondensedExt, sairaExtraCondensed, sairaExtraCondensedExt, sairaStencil, sairaStencilExt, chakraPetch, chakraPetchExt, blackOpsOne, blackOpsOneExt, racingSansOne, racingSansOneExt, orbitron, audiowide, audiowideExt, kanit, kanitExt, rajdhani, rajdhaniExt, exo2, exo2Ext, changaOne, bowlbyOneSc, bowlbyOneScExt, holtwoodOneSc, holtwoodOneScExt, monoton, monotonExt, tourney, tourneyExt, goldman, goldmanExt, zenDots, zenDotsExt, michroma, michromaExt, anta, antaExt, oxanium, oxaniumExt, tektur, tekturExt, bevan, bevanExt, sarpanch, sarpanchExt, jockeyOne, jockeyOneExt, passionOne, passionOneExt, fugazOne, daysOne, notoSansNko].map((font) => font.variable).join(" ");
