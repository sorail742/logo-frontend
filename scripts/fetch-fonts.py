# Télécharge une fois les polices dans src/fonts et génère src/app/fonts.ts pour next/font/local :
# le build ne dépend plus du réseau. Polices des logos : sous-ensemble latin, plus le latin étendu
# (lettres pular ɓ ɗ ŋ ƴ…) dans une famille à part limitée par unicode-range, téléchargée par le
# navigateur seulement si le texte en contient. Noto Sans NKo : écriture N'Ko (police de secours).
import os, re, sys, urllib.request

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "fonts")
os.makedirs(OUT, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# (identifiant, famille Google, axe demandé, variable CSS, préchargée)
FONTS = [
    ("geist", "Geist", "wght@100..900", "--font-sans", True),
    ("geist-mono", "Geist Mono", "wght@100..900", "--font-geist-mono", False),
    ("montserrat", "Montserrat", "wght@100..900", "--font-montserrat", False),
    ("poppins", "Poppins", "wght@400;600;700;800", "--font-poppins", False),
    ("space-grotesk", "Space Grotesk", "wght@300..700", "--font-space-grotesk", False),
    ("nunito", "Nunito", "wght@200..1000", "--font-nunito", False),
    ("raleway", "Raleway", "wght@100..900", "--font-raleway", False),
    ("oswald", "Oswald", "wght@200..700", "--font-oswald", False),
    ("bebas-neue", "Bebas Neue", "", "--font-bebas-neue", False),
    ("playfair", "Playfair Display", "wght@400..900", "--font-playfair", False),
    ("lora", "Lora", "wght@400..700", "--font-lora", False),
    ("merriweather", "Merriweather", "wght@400;700;900", "--font-merriweather", False),
    ("great-vibes", "Great Vibes", "", "--font-great-vibes", False),
    ("dancing-script", "Dancing Script", "wght@400..700", "--font-dancing-script", False),
    ("allura", "Allura", "", "--font-allura", False),
    ("satisfy", "Satisfy", "", "--font-satisfy", False),
    ("sacramento", "Sacramento", "", "--font-sacramento", False),
    # Studio de création : bibliothèque élargie
    ("inter", "Inter", "wght@400..800", "--font-inter", False),
    ("dm-sans", "DM Sans", "wght@400..700", "--font-dm-sans", False),
    ("work-sans", "Work Sans", "wght@400..800", "--font-work-sans", False),
    ("rubik", "Rubik", "wght@400..800", "--font-rubik", False),
    ("manrope", "Manrope", "wght@400..800", "--font-manrope", False),
    ("outfit", "Outfit", "wght@400..800", "--font-outfit", False),
    ("plus-jakarta-sans", "Plus Jakarta Sans", "wght@400..800", "--font-plus-jakarta-sans", False),
    ("archivo", "Archivo", "wght@400..800", "--font-archivo", False),
    ("josefin-sans", "Josefin Sans", "wght@400..700", "--font-josefin-sans", False),
    ("quicksand", "Quicksand", "wght@400..700", "--font-quicksand", False),
    ("comfortaa", "Comfortaa", "wght@400..700", "--font-comfortaa", False),
    ("ubuntu", "Ubuntu", "wght@400;700", "--font-ubuntu", False),
    ("barlow-condensed", "Barlow Condensed", "wght@400;600;700", "--font-barlow-condensed", False),
    ("anton", "Anton", "", "--font-anton", False),
    ("archivo-black", "Archivo Black", "", "--font-archivo-black", False),
    ("righteous", "Righteous", "", "--font-righteous", False),
    ("abril-fatface", "Abril Fatface", "", "--font-abril-fatface", False),
    ("syne", "Syne", "wght@400..800", "--font-syne", False),
    ("unbounded", "Unbounded", "wght@400..800", "--font-unbounded", False),
    ("bricolage-grotesque", "Bricolage Grotesque", "wght@400..800", "--font-bricolage-grotesque", False),
    ("teko", "Teko", "wght@400..700", "--font-teko", False),
    ("alfa-slab-one", "Alfa Slab One", "", "--font-alfa-slab-one", False),
    ("lobster", "Lobster", "", "--font-lobster", False),
    ("dm-serif-display", "DM Serif Display", "", "--font-dm-serif-display", False),
    ("fraunces", "Fraunces", "wght@400..800", "--font-fraunces", False),
    ("cormorant-garamond", "Cormorant Garamond", "wght@400..700", "--font-cormorant-garamond", False),
    ("libre-baskerville", "Libre Baskerville", "wght@400;700", "--font-libre-baskerville", False),
    ("roboto-slab", "Roboto Slab", "wght@400..800", "--font-roboto-slab", False),
    ("pacifico", "Pacifico", "", "--font-pacifico", False),
    ("caveat", "Caveat", "wght@400..700", "--font-caveat", False),
    ("permanent-marker", "Permanent Marker", "", "--font-permanent-marker", False),
    ("kaushan-script", "Kaushan Script", "", "--font-kaushan-script", False),
    ("noto-sans-nko", "Noto Sans NKo", "", "--font-nko", False),
]

# Police de l'interface : sous-ensemble latin seul, repli métrique sur Arial (next/font).
UI_FONTS = {"geist", "geist-mono"}
# Sous-ensemble principal quand ce n'est pas le latin.
MAIN_SUBSET = {"noto-sans-nko": "nko"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def camel(s):
    parts = s.split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def download(fid, blocks, wanted, suffix=""):
    """Fichiers du sous-ensemble demandé : (nom, graisse, style), et son unicode-range."""
    srcs, ranges = [], None
    for subset, body in blocks:
        if subset != wanted:
            continue
        weight = re.search(r"font-weight:\s*([^;]+);", body).group(1).strip()
        style = re.search(r"font-style:\s*([^;]+);", body).group(1).strip()
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        found = re.search(r"unicode-range:\s*([^;]+);", body)
        ranges = found.group(1).strip() if found else ranges
        name = f"{fid}{suffix}-{weight.replace(' ', '-')}{'' if style == 'normal' else '-' + style}.woff2"
        path = os.path.join(OUT, name)
        if not os.path.exists(path):
            open(path, "wb").write(get(url))
        srcs.append((name, weight, style))
    return srcs, ranges


def declaration(const, srcs, var, preload, logo, ranges=None):
    entries = ",\n".join(f'    {{ path: "../fonts/{n}", weight: "{w}", style: "{s}" }}' for n, w, s in srcs)
    extra = ""
    if ranges:
        extra += f'\n  declarations: [{{ prop: "unicode-range", value: "{ranges}" }}],'
    if logo:
        # Pas de repli métrique (Arial) : les lettres absentes passent à la famille suivante.
        extra += "\n  adjustFontFallback: false,"
    return (
        f'const {const} = localFont({{\n  src: [\n{entries},\n  ],\n  variable: "{var}",\n  display: "swap",\n'
        f'  preload: {"true" if preload else "false"},{extra}\n}});'
    )


decls, consts = [], []
for fid, family, axis, var, preload in FONTS:
    q = family.replace(" ", "+") + (":" + axis if axis else "")
    css = get(f"https://fonts.googleapis.com/css2?family={q}&display=swap").decode()
    blocks = re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    logo = fid not in UI_FONTS
    main = MAIN_SUBSET.get(fid, "latin")
    srcs, ranges = download(fid, blocks, main)
    if not srcs:
        raise SystemExit(f"Aucun fichier {main} pour {family}")
    decls.append(declaration(camel(fid), srcs, var, preload, logo, ranges if main != "latin" else None))
    consts.append(camel(fid))
    count = len(srcs)
    if logo and main == "latin":
        ext, ext_ranges = download(fid, blocks, "latin-ext", "-ext")
        if ext:
            decls.append(declaration(camel(fid) + "Ext", ext, var + "-ext", False, True, ext_ranges))
            consts.append(camel(fid) + "Ext")
            count += len(ext)
    print(f"{family}: {count} fichier(s)")

names = ", ".join(consts)
ts = f'''import localFont from "next/font/local";

// Polices auto-hébergées (licence OFL) dans src/fonts : le build ne télécharge rien depuis
// Google Fonts. Seule la police de l'interface est préchargée ; les polices des logos ne sont
// chargées par le navigateur que si un logo les utilise, et leur latin étendu (variable « -ext »)
// que si le texte en contient. Pour les régénérer : python scripts/fetch-fonts.py

{chr(10).join(decls)}

export const fontVariables = [{names}].map((font) => font.variable).join(" ");
'''
open(os.path.join(ROOT, "src", "app", "fonts.ts"), "w", encoding="utf8").write(ts)
print("fonts.ts généré")
