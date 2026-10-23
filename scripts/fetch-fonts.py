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
    # Maillots et sport : numéros et noms de joueurs.
    ("graduate", "Graduate", "", "--font-graduate", False),
    ("big-shoulders", "Big Shoulders Display", "wght@400;700;900", "--font-big-shoulders", False),
    ("big-shoulders-inline", "Big Shoulders Inline Display", "wght@700;900", "--font-big-shoulders-inline", False),
    ("big-shoulders-stencil", "Big Shoulders Stencil Display", "wght@700;900", "--font-big-shoulders-stencil", False),
    ("bungee", "Bungee", "", "--font-bungee", False),
    ("bungee-inline", "Bungee Inline", "", "--font-bungee-inline", False),
    ("bungee-shade", "Bungee Shade", "", "--font-bungee-shade", False),
    ("russo-one", "Russo One", "", "--font-russo-one", False),
    ("squada-one", "Squada One", "", "--font-squada-one", False),
    ("staatliches", "Staatliches", "", "--font-staatliches", False),
    ("saira-condensed", "Saira Condensed", "wght@500;700;900", "--font-saira-condensed", False),
    ("saira-extra-condensed", "Saira Extra Condensed", "wght@500;700;900", "--font-saira-extra-condensed", False),
    ("saira-stencil", "Saira Stencil One", "", "--font-saira-stencil", False),
    ("chakra-petch", "Chakra Petch", "wght@500;700", "--font-chakra-petch", False),
    ("black-ops-one", "Black Ops One", "", "--font-black-ops-one", False),
    ("racing-sans-one", "Racing Sans One", "", "--font-racing-sans-one", False),
    ("orbitron", "Orbitron", "wght@500..900", "--font-orbitron", False),
    ("audiowide", "Audiowide", "", "--font-audiowide", False),
    ("kanit", "Kanit", "wght@500;700;900", "--font-kanit", False),
    ("rajdhani", "Rajdhani", "wght@500;700", "--font-rajdhani", False),
    ("exo-2", "Exo 2", "wght@500..900", "--font-exo-2", False),
    ("changa-one", "Changa One", "", "--font-changa-one", False),
    ("bowlby-one-sc", "Bowlby One SC", "", "--font-bowlby-one-sc", False),
    ("holtwood-one-sc", "Holtwood One SC", "", "--font-holtwood-one-sc", False),
    ("monoton", "Monoton", "", "--font-monoton", False),
    ("tourney", "Tourney", "wght@600..800", "--font-tourney", False),
    ("goldman", "Goldman", "wght@400;700", "--font-goldman", False),
    ("zen-dots", "Zen Dots", "", "--font-zen-dots", False),
    ("michroma", "Michroma", "", "--font-michroma", False),
    ("anta", "Anta", "", "--font-anta", False),
    ("oxanium", "Oxanium", "wght@500..800", "--font-oxanium", False),
    ("tektur", "Tektur", "wght@500..900", "--font-tektur", False),
    ("bevan", "Bevan", "", "--font-bevan", False),
    ("sarpanch", "Sarpanch", "wght@500;700;900", "--font-sarpanch", False),
    ("jockey-one", "Jockey One", "", "--font-jockey-one", False),
    ("passion-one", "Passion One", "wght@400;700;900", "--font-passion-one", False),
    ("fugaz-one", "Fugaz One", "", "--font-fugaz-one", False),
    ("days-one", "Days One", "", "--font-days-one", False),
    # Les plus utilisées au monde, fêtes et événements, manuscrites.
    ("roboto", "Roboto", "wght@400;500;700;900", "--font-roboto", False),
    ("open-sans", "Open Sans", "wght@400;600;700;800", "--font-open-sans", False),
    ("lato", "Lato", "wght@400;700;900", "--font-lato", False),
    ("roboto-condensed", "Roboto Condensed", "wght@400;700", "--font-roboto-condensed", False),
    ("noto-sans", "Noto Sans", "wght@400;700", "--font-noto-sans", False),
    ("source-sans-3", "Source Sans 3", "wght@400;600;700", "--font-source-sans-3", False),
    ("nunito-sans", "Nunito Sans", "wght@400;700;900", "--font-nunito-sans", False),
    ("pt-sans", "PT Sans", "wght@400;700", "--font-pt-sans", False),
    ("mukta", "Mukta", "wght@400;700", "--font-mukta", False),
    ("fira-sans", "Fira Sans", "wght@400;600;800", "--font-fira-sans", False),
    ("barlow", "Barlow", "wght@400;600;800", "--font-barlow", False),
    ("titillium-web", "Titillium Web", "wght@400;600;700", "--font-titillium-web", False),
    ("heebo", "Heebo", "wght@400;700;900", "--font-heebo", False),
    ("ibm-plex-sans", "IBM Plex Sans", "wght@400;600;700", "--font-ibm-plex-sans", False),
    ("karla", "Karla", "wght@400;700", "--font-karla", False),
    ("libre-franklin", "Libre Franklin", "wght@400;700;900", "--font-libre-franklin", False),
    ("mulish", "Mulish", "wght@400;700;900", "--font-mulish", False),
    ("hind", "Hind", "wght@400;600;700", "--font-hind", False),
    ("arimo", "Arimo", "wght@400;700", "--font-arimo", False),
    ("dosis", "Dosis", "wght@400;700", "--font-dosis", False),
    ("cabin", "Cabin", "wght@400;700", "--font-cabin", False),
    ("oxygen", "Oxygen", "wght@400;700", "--font-oxygen", False),
    ("lexend", "Lexend", "wght@400;700", "--font-lexend", False),
    ("abel", "Abel", "", "--font-abel", False),
    ("cairo", "Cairo", "wght@400;700", "--font-cairo", False),
    ("fjalla-one", "Fjalla One", "", "--font-fjalla-one", False),
    ("signika", "Signika", "wght@400;700", "--font-signika", False),
    ("prompt", "Prompt", "wght@400;700", "--font-prompt", False),
    ("varela-round", "Varela Round", "", "--font-varela-round", False),
    ("overpass", "Overpass", "wght@400;800", "--font-overpass", False),
    ("asap", "Asap", "wght@400;700", "--font-asap", False),
    ("maven-pro", "Maven Pro", "wght@400;700", "--font-maven-pro", False),
    ("questrial", "Questrial", "", "--font-questrial", False),
    ("sora", "Sora", "wght@400;700", "--font-sora", False),
    ("figtree", "Figtree", "wght@400;700;900", "--font-figtree", False),
    ("urbanist", "Urbanist", "wght@400;700;900", "--font-urbanist", False),
    ("jost", "Jost", "wght@400;700", "--font-jost", False),
    ("red-hat-display", "Red Hat Display", "wght@400;700;900", "--font-red-hat-display", False),
    ("archivo-narrow", "Archivo Narrow", "wght@400;700", "--font-archivo-narrow", False),
    ("pt-sans-narrow", "PT Sans Narrow", "wght@400;700", "--font-pt-sans-narrow", False),
    ("public-sans", "Public Sans", "wght@400;700", "--font-public-sans", False),
    ("noto-serif", "Noto Serif", "wght@400;700", "--font-noto-serif", False),
    ("pt-serif", "PT Serif", "wght@400;700", "--font-pt-serif", False),
    ("eb-garamond", "EB Garamond", "wght@400;700", "--font-eb-garamond", False),
    ("crimson-text", "Crimson Text", "wght@400;700", "--font-crimson-text", False),
    ("bitter", "Bitter", "wght@400;700", "--font-bitter", False),
    ("zilla-slab", "Zilla Slab", "wght@400;700", "--font-zilla-slab", False),
    ("alegreya", "Alegreya", "wght@400;700", "--font-alegreya", False),
    ("cinzel", "Cinzel", "wght@400;700;900", "--font-cinzel", False),
    ("arvo", "Arvo", "wght@400;700", "--font-arvo", False),
    ("domine", "Domine", "wght@400;700", "--font-domine", False),
    ("patua-one", "Patua One", "", "--font-patua-one", False),
    ("courier-prime", "Courier Prime", "wght@400;700", "--font-courier-prime", False),
    ("bangers", "Bangers", "", "--font-bangers", False),
    ("fredoka", "Fredoka", "wght@400;600;700", "--font-fredoka", False),
    ("lilita-one", "Lilita One", "", "--font-lilita-one", False),
    ("carter-one", "Carter One", "", "--font-carter-one", False),
    ("concert-one", "Concert One", "", "--font-concert-one", False),
    ("paytone-one", "Paytone One", "", "--font-paytone-one", False),
    ("bubblegum-sans", "Bubblegum Sans", "", "--font-bubblegum-sans", False),
    ("henny-penny", "Henny Penny", "", "--font-henny-penny", False),
    ("emilys-candy", "Emilys Candy", "", "--font-emilys-candy", False),
    ("press-start-2p", "Press Start 2P", "", "--font-press-start-2p", False),
    ("baloo-2", "Baloo 2", "wght@400;700;800", "--font-baloo-2", False),
    ("lobster-two", "Lobster Two", "wght@400;700", "--font-lobster-two", False),
    ("rye", "Rye", "", "--font-rye", False),
    ("cinzel-decorative", "Cinzel Decorative", "wght@400;700;900", "--font-cinzel-decorative", False),
    ("creepster", "Creepster", "", "--font-creepster", False),
    ("titan-one", "Titan One", "", "--font-titan-one", False),
    ("sniglet", "Sniglet", "wght@400;800", "--font-sniglet", False),
    ("berkshire-swash", "Berkshire Swash", "", "--font-berkshire-swash", False),
    ("bowlby-one", "Bowlby One", "", "--font-bowlby-one", False),
    ("shadows-into-light", "Shadows Into Light", "", "--font-shadows-into-light", False),
    ("indie-flower", "Indie Flower", "", "--font-indie-flower", False),
    ("amatic-sc", "Amatic SC", "wght@400;700", "--font-amatic-sc", False),
    ("kalam", "Kalam", "wght@400;700", "--font-kalam", False),
    ("courgette", "Courgette", "", "--font-courgette", False),
    ("damion", "Damion", "", "--font-damion", False),
    ("cookie", "Cookie", "", "--font-cookie", False),
    ("playball", "Playball", "", "--font-playball", False),
    ("parisienne", "Parisienne", "", "--font-parisienne", False),
    ("alex-brush", "Alex Brush", "", "--font-alex-brush", False),
    ("pinyon-script", "Pinyon Script", "", "--font-pinyon-script", False),
    ("tangerine", "Tangerine", "wght@400;700", "--font-tangerine", False),
    ("grand-hotel", "Grand Hotel", "", "--font-grand-hotel", False),
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
    # Réponse parfois incomplète (sans fichier woff2) : nouvel essai.
    for attempt in range(4):
        css = get(f"https://fonts.googleapis.com/css2?family={q}&display=swap").decode()
        blocks = re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
        if blocks and all(re.search(r"url\((https://[^)]+\.woff2)\)", body) for _, body in blocks):
            break
    else:
        raise SystemExit(f"Réponse inexploitable pour {family}")
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
