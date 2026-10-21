# Marka — front-end (Next.js)

Front de la plateforme de création d'identité de marque décrite dans
[docs/cahier-des-charges.md](docs/cahier-des-charges.md) : nom, logo, signatures et kit de marque
pour associations, applications, plateformes et entreprises. « Marka » est un nom provisoire (§15.4).

Ce dépôt correspond à `apps/web` du monorepo prévu au §11.2. L'API NestJS et les workers sont
développés à part ([logo-backend](https://github.com/sorail742/logo-backend)). Le front fonctionne
avec l'API réelle ou avec une **API simulée** qui tourne dans le navigateur.

## Démarrage

```bash
pnpm install
cp .env.example .env.local   # déjà fait si le fichier existe
pnpm dev                     # http://localhost:3000
```

Comptes de démonstration (mode simulé) :

| E-mail | Mot de passe | Rôle |
| --- | --- | --- |
| `demo@exemple.gn` | `demo1234` | Utilisateur, offre gratuite, 20 crédits |
| `admin@exemple.gn` | `admin1234` | Super admin (accès `/admin`) |

Autres valeurs utiles en mode simulé : code SMS `123456`, code promo `BIENVENUE`, un numéro
Orange Money se terminant par `0000` simule un paiement refusé, un retour contenant `__echec__`
simule une génération échouée (crédits remboursés).

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de l'API NestJS, préfixe `/api/v1` compris |
| `NEXT_PUBLIC_API_MOCK` | `true` : API simulée (localStorage). `false` + URL renseignée : API réelle |
| `NEXT_PUBLIC_SITE_URL` | URL publique (Open Graph, sitemap, liens de partage) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Facultatif : affiche « Continuer avec Google » (même identifiant que `GOOGLE_CLIENT_ID` de l'API) |

## Brancher l'API réelle

```bash
# Dans logo-backend : docker compose up -d, migrations, seed, puis npm run dev et npm run dev:worker
printf 'NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1\nNEXT_PUBLIC_API_MOCK=false\n' > .env.local
pnpm dev
```

L'API renvoie directement les types de `src/lib/types.ts` ; `src/lib/api/http.ts` ne gère que
le transport (jeton en mémoire et cookie de rafraîchissement, pagination par curseur, flux SSE,
noms de paramètres). En mode API réelle :

- **Disponible** : inscription et connexion (2FA TOTP avec codes de secours, Google si configuré),
  vérification de l'adresse e-mail, profil et export des données, espaces, membres et invitations,
  projets et brief, noms et vérifications, logos (génération, import, éditeur, versions),
  export serveur (archive ZIP : SVG et PDF vectoriels, PNG, JPG, icônes d'app, réseaux sociaux),
  slogans et devises, signatures e-mail, paraphes et cachets (validation manuelle des cachets
  officiels), historique d'activité, crédits et grand livre, notifications, back-office
  (indicateurs, utilisateurs, crédits, modération, journal d'audit).
- **Bientôt disponible** (phases 5 et 6 de l'API) : kit de marque et partage, commentaires,
  paiements et factures, connexion par SMS. Ces écrans
  affichent « Bientôt disponible » ; `api.isAvailable(feature)` indique ce que l'API sert.
- L'offre gratuite exporte le PNG 512 px filigrané depuis le navigateur ; les offres payantes
  téléchargent l'archive produite par le serveur (dernière version enregistrée du logo).

## Pile technique

Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript strict, Tailwind CSS 4,
shadcn/ui (Base UI), next-intl (fr par défaut, en), TanStack Query, Zustand, react-hook-form + zod.

## Organisation

```text
src/
  app/[locale]/
    (marketing)/   accueil, tarifs, outils gratuits, kit partagé, invitation, pages légales
    (auth)/        connexion, inscription, mot de passe oublié / réinitialisation
    app/           application : projets, brief, noms, logos (+ éditeur), signatures, kit,
                   Studio (créations du projet), espace et membres, facturation, notifications,
                   profil, corbeille
    studio/[sdid]  éditeur plein écran du Studio de création
    admin/         back-office (Support, Admin, Super admin, 2FA obligatoire)
  components/      ui/ (shadcn), layout/, brand/, marketing/, projects/, names/, logos/, signatures/,
                   kit/, studio/ (canevas, panneaux, inspecteur, fenêtres), billing/, admin/
  hooks/           espace courant, projet courant, suivi des tâches (SSE), erreurs d'API
  i18n/            routage next-intl
  lib/
    api/           contrat du client (§13), implémentation HTTP et API simulée (mock/)
    render/        aperçu du futur packages/render : composition SVG des logos, variantes,
                   cachets, paraphes, signatures e-mail HTML, exports PNG/ICO/ZIP
    studio/        Studio de création : document, rendu SVG, mise en page du texte, géométrie,
                   formats, modèles à la marque, redimensionnement magique, variations,
                   contrôle qualité, couleurs (harmonies, écart perçu)
    types.ts       types alignés sur le schéma Prisma (§12)
    permissions.ts matrice des rôles (§3) — indicative, l'API fait foi
    credits.ts     coût des actions en crédits (§8.3)
  stores/          session, éditeur de logo, Studio (document, sélection, vue, historique)
messages/{fr,en}/  traductions par espace de noms
```

## Couverture du cahier des charges

- **Noms (§4)** : brief complet, lots de 10, relance avec retour, favoris, rejets, votes,
  comparaison de 4 favoris, vérifications domaine/réseaux/marques/phonétique (cache 24 h),
  nom final avec nouvelle version du kit.
- **Logos (§5)** : moteurs A et B, 4 types, 6 styles, palette libre ou proposée, 8 propositions
  en situation, relances, import SVG/PNG nettoyé avec extraction de palette, éditeur (texte,
  police, graisse, espacement, couleurs avec contrôle de contraste 4,5:1, icône, cadre, disposition,
  annuler/rétablir, versions nommées, aperçu 32 px), variantes automatiques, exports SVG/PNG/JPG,
  pack d'icônes d'app (favicon.ico 16/32/48, 180, 192, 512, 1024), formats réseaux sociaux,
  filigrane en offre gratuite.
- **Signatures (§6)** : slogans, devise et mission pour les associations, logo avec signature,
  signature e-mail (6 modèles, HTML tableaux + styles en ligne, texte brut, copie, guides, lot CSV),
  paraphe par police ou dessiné, cachet rond/ovale/rectangulaire, encres, attestation horodatée,
  validation manuelle des termes officiels.
- **Kit (§7)** : page du kit (contenu figé de chaque version), versions consultables et
  restaurables, charte graphique PDF et archive ZIP produites par l'API (liens signés relus avant
  expiration), lien de partage avec mot de passe et expiration, page publique avec
  téléchargements, espaces, invitations, commentaires avec mentions @ (projet, logo, kit, création du Studio),
  notifications, historique d'activité, corbeille 30 jours.
- **Comptes et paiements (§8)** : e-mail, Google, SMS, mot de passe oublié, 2FA TOTP, profil,
  export et suppression des données, offres, grand livre de crédits, paiement Orange Money
  idempotent, factures, codes promo, justificatif association.
- **Back-office (§9)** : indicateurs, utilisateurs, ajustement de crédits motivé, paiements et
  remboursements, export CSV, modération des cachets, bibliothèque, IA, paramètres, audit.

## Studio de création

Éditeur de supports à la marque, au-delà d'un éditeur généraliste : la marque du projet (logo,
couleurs, polices, nom, slogan) est le point de départ de chaque création.

- **Formats** : publications carrée et portrait, story, couvertures et bannières, miniature
  YouTube, flyers A5 et A4, affiche A3, carte de visite, invitation, diplôme, kakémono (en mm,
  fond perdu de 3 mm), présentation 16:9, bannière d'e-mail, taille libre.
- **Canevas** (`components/studio/canvas.tsx`) : sélection, lasso, déplacement aimanté avec guides
  (bords et centres de la page et des éléments), redimensionnement et rotation (aussi en groupe),
  Alt + glisser pour dupliquer, zoom à la molette et main (Espace), sur écran tactile pincement
  à deux doigts (zoom autour des doigts) et glisser sur le fond pour déplacer la vue, édition du
  texte en place, recadrage d'une photo dans son masque, cadres photo à remplir par dépôt,
  repères d'impression.
- **Éléments** : textes (47 polices, dégradés, contour, texte en arc, surlignage), formes
  (rectangle, cercle, polygone, étoile, forme organique, arche, trait, flèche), 1 890 icônes
  lucide (`public/studio/icons.json`, recherche en français), photos (import, collage, masques,
  filtres), logo du projet et ses déclinaisons ; ombres, opacité, modes de fusion, calques,
  verrouillage, alignement et répartition, pages multiples.
- **Fonctions à la marque** : modèles composés pour le format (`lib/studio/templates.ts`),
  application de la charte à une page, couleurs par défaut lisibles sur le fond, sélecteur de
  couleur avec pipette, dégradés et harmonies, redimensionnement magique (`lib/studio/smart.ts` :
  fonds étirés, décors ancrés, contenu regroupé en bandes et réparti), huit variations,
  contrôle qualité continu (`lib/studio/quality.ts` : contraste WCAG, corps minimal, zone de
  sécurité, fond perdu, résolution des photos, couleurs hors charte, polices) avec corrections.
- **Images et photos** : onglet « Générer » (4 visuels par lot aux couleurs de la marque, sept
  styles dont wax et bogolan, formats carré, portrait, paysage ; ajout sur la page ou en fond) et
  onglet « Photos » (banque Pexels relayée par l'API : recherche en français, orientation, crédit
  du photographe ; message explicatif si la plateforme n'a pas de clé). En mode simulé, les
  visuels sont produits dans le navigateur par le même moteur que l'API
  (`lib/render/artwork.ts`) et la banque de photos est indiquée comme non activée.
- **Avis épinglés** : touche C ou bouton « Commenter », clic sur la page pour poser une épingle,
  fils de réponses, résolution, onglet « Avis » ; les lecteurs voient et commentent sans modifier,
  et le lien d'une notification ouvre le fil (`?commentaire=`).
- **Exports** : PNG (×0,5 à ×3, fond transparent) et JPG dans le navigateur ; PDF d'impression et
  SVG au texte vectorisé par l'API (indisponibles en mode simulé, où le SVG est produit avec
  polices intégrées). Sauvegarde automatique avec aperçu ; raccourcis clavier (touche ?).
- Pour régénérer la bibliothèque d'icônes après une mise à jour de lucide-react :
  `node scripts/build-icons.mjs`.

## Ce qui revient au serveur

Le front ne contacte jamais directement l'IA ni le paiement (§11). Côté API/workers : génération
IA, conversion du texte en tracés et SVGO, exports des logos, charte graphique PDF, archive du kit
avec supports imprimables, URL signées, e-mails (déjà en place) ; webhooks de paiement (phase 6).
En mode simulé, les exports sont des aperçus fidèles assemblés dans le navigateur et la charte
s'enregistre en PDF via l'impression.

L'éditeur de logo est piloté par une spec déclarative (`LogoSpec`) rendue en SVG ; le cahier
prévoit Fabric.js, qui pourra s'y brancher pour la manipulation directe sur canevas.

## Polices

Les polices (interface et bibliothèque des logos, licence OFL) sont auto-hébergées dans
`src/fonts` et chargées avec `next/font/local` : le build ne dépend pas de Google Fonts.
Pour ajouter ou mettre à jour une police : modifier la liste dans `scripts/fetch-fonts.py`, puis
lancer `python scripts/fetch-fonts.py` (régénère aussi `src/app/fonts.ts`).

## Branches

| Branche | Rôle |
| --- | --- |
| `main` | Production : ne reçoit que des fusions depuis `develop` |
| `develop` | Développement : branche d'intégration, point de départ du travail |

Le travail se fait sur une branche créée depuis `develop` (par exemple `feat/kit-partage` ou
`fix/polices`), puis une pull request vers `develop`. Une mise en production est une pull request
de `develop` vers `main`. On ne pousse jamais directement sur `main`.

```bash
git switch develop && git pull
git switch -c feat/ma-fonctionnalite
# … commits …
git push -u origin feat/ma-fonctionnalite   # puis pull request vers develop
```

## Scripts

```bash
pnpm dev      # serveur de développement
pnpm build    # build de production
pnpm start    # serveur de production
pnpm lint     # ESLint
```
