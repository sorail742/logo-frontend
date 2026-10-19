import {
  Allura,
  Bebas_Neue,
  Dancing_Script,
  Geist,
  Geist_Mono,
  Great_Vibes,
  Lora,
  Merriweather,
  Montserrat,
  Nunito,
  Oswald,
  Playfair_Display,
  Poppins,
  Raleway,
  Sacramento,
  Satisfy,
  Space_Grotesk,
} from "next/font/google";

// Police de l'interface, préchargée.
const geist = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });

// Bibliothèque de polices des logos (OFL) : non préchargées, téléchargées seulement si un logo les utilise.
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-montserrat" });
const poppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-poppins", weight: ["400", "600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-space-grotesk" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-nunito" });
const raleway = Raleway({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-raleway" });
const oswald = Oswald({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-oswald" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-bebas-neue", weight: "400" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-playfair" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-lora" });
const merriweather = Merriweather({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-merriweather", weight: ["400", "700", "900"] });
const greatVibes = Great_Vibes({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-great-vibes", weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dancing-script" });
const allura = Allura({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-allura", weight: "400" });
const satisfy = Satisfy({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-satisfy", weight: "400" });
const sacramento = Sacramento({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-sacramento", weight: "400" });

export const fontVariables = [
  geist,
  geistMono,
  montserrat,
  poppins,
  spaceGrotesk,
  nunito,
  raleway,
  oswald,
  bebasNeue,
  playfair,
  lora,
  merriweather,
  greatVibes,
  dancingScript,
  allura,
  satisfy,
  sacramento,
]
  .map((font) => font.variable)
  .join(" ");
