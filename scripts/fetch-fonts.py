# Télécharge une fois les polices (sous-ensemble latin) dans src/fonts et génère src/app/fonts.ts
# pour next/font/local : le build ne dépend plus du réseau.
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
]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def camel(s):
    parts = s.split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


decls = []
for fid, family, axis, var, preload in FONTS:
    q = family.replace(" ", "+") + (":" + axis if axis else "")
    css = get(f"https://fonts.googleapis.com/css2?family={q}&display=swap").decode()
    blocks = re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    srcs = []
    for subset, body in blocks:
        if subset != "latin":
            continue
        weight = re.search(r"font-weight:\s*([^;]+);", body).group(1).strip()
        style = re.search(r"font-style:\s*([^;]+);", body).group(1).strip()
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        name = f"{fid}-{weight.replace(' ', '-')}{'' if style == 'normal' else '-' + style}.woff2"
        path = os.path.join(OUT, name)
        if not os.path.exists(path):
            open(path, "wb").write(get(url))
        srcs.append((name, weight, style))
    if not srcs:
        raise SystemExit(f"Aucun fichier latin pour {family}")
    print(f"{family}: {len(srcs)} fichier(s)")
    entries = ",\n".join(f'    {{ path: "../fonts/{n}", weight: "{w}", style: "{s}" }}' for n, w, s in srcs)
    decls.append(
        f'const {camel(fid)} = localFont({{\n  src: [\n{entries},\n  ],\n  variable: "{var}",\n  display: "swap",\n  preload: {"true" if preload else "false"},\n}});'
    )

names = ", ".join(camel(f[0]) for f in FONTS)
ts = f'''import localFont from "next/font/local";

// Polices auto-hébergées (sous-ensemble latin, licence OFL) dans src/fonts :
// le build ne télécharge rien depuis Google Fonts. Seule la police de l'interface est préchargée ;
// les polices des logos ne sont chargées par le navigateur que si un logo les utilise.
// Pour les régénérer : python scripts/fetch-fonts.py

{chr(10).join(decls)}

export const fontVariables = [{names}].map((font) => font.variable).join(" ");
'''
open(os.path.join(ROOT, "src", "app", "fonts.ts"), "w", encoding="utf8").write(ts)
print("fonts.ts généré")
