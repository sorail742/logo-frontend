# CAHIER DES CHARGES TECHNIQUE & PROMPT D'EXÉCUTION BACKEND (MARKA)
> **Destinataire :** Agent Gemini 3.8 Flash High sur le projet `C:\Users\keith\logo-backend`  
> **Stack :** NestJS 10+, Prisma ORM, PostgreSQL, TypeScript, BullMQ/Workers, Sharp (100% local)  
> **Périmètre révisé :** La partie « Création de sites web / web apps » a été **COMPLÈTEMENT SUPPRIMÉE** du projet.  
> **Règle absolue :** ZÉRO API EXTERNE DE TRAITEMENT D'IMAGE (aucun SaaS tiers). Tout le traitement s'exécute en local via `sharp`.

---

## 1. PROMPT CLÉ EN MAIN POUR L'AGENT BACKEND

Copie et colle le bloc ci-dessous dans la session de ton agent Gemini sur `logo-backend` :

```markdown
Tu es un architecte et développeur back-end senior expert NestJS, Prisma, PostgreSQL et TypeScript.
Nous développons la plateforme "Marka" (plateforme tout-en-un de création de marques : nom, logo, signatures, kit de marque, textile).
Le front-end Next.js est déjà entièrement développé et configuré sur nos routes REST.

NOTE IMPORTANTE : La création de sites web / web apps a été COMPLÈTEMENT RETIRÉE du périmètre du projet. Aucun modèle, contrôleur ou table Website ne doit être créé.

## RÈGLE ABSOLUE
AUCUNE API EXTERNE DE TRAITEMENT D'IMAGE (ni remove.bg, ni Cloudinary, ni Photoroom, etc.). Tout le traitement serveur doit s'exécuter 100% en local via la bibliothèque `sharp`.

---

## 1. MODÈLES PRISMA À AJOUTER DANS `prisma/schema.prisma`

Ajoute et migre (`npx prisma migrate dev --name add_apparel_module`) :

```prisma
enum PrintTechnique {
  DTF                  // Transfert numérique direct sur film (polyvalent, sous-couche blanche chokée)
  SCREEN_PRINT         // Sérigraphie (tons directs, typons séparés 1 à 6 couleurs)
  EMBROIDERY           // Broderie (fils Madeira/Gunold, estimation de points)
  HEAT_TRANSFER_VINYL  // Flex / Vinyle thermocollant (découpe plotter vectorielle)
  FLOCK                // Flocage velours
  SUBLIMATION          // Sublimation (polyester clair/blanc)
  DTG                  // Impression directe jet d'encre sur textile
}

enum ApparelDesignStatus {
  DRAFT         // En cours d'édition
  PROOF_SENT    // BAT envoyé au client
  APPROVED      // Validé et signé par le client
  IN_PRODUCTION // En cours de fabrication atelier
}

enum GarmentCategory {
  T_SHIRT
  POLO
  FOOTBALL_JERSEY
  BASKETBALL_JERSEY
  SHORTS
  HOODIE
  CAP
}

enum GarmentView {
  FRONT
  BACK
  LEFT_SLEEVE
  RIGHT_SLEEVE
  SHORTS_FRONT
  SHORTS_BACK
}

enum DesignElementKind {
  LOGO
  SPONSOR
  TEXT
  PLAYER_NAME
  PLAYER_NUMBER
  IMAGE
  PATTERN
}

model ApparelTemplate {
  id          String            @id @default(uuid())
  category    GarmentCategory
  name        String
  description String?
  material    String?           // ex: "100% Coton peigné 180g" ou "100% Polyester respirant"
  sizes       Json              // [{ label: "S", chestWidthMm: 480, heightMm: 700 }, ...]
  zones       Json              // [{ key: "chest_left", name: "Cœur", view: "FRONT", maxWidthMm: 90, maxHeightMm: 90, ... }]
  designs     ApparelDesign[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model RulePreset {
  id          String          @id @default(uuid())
  code        String          @unique // FOOTBALL_MEN, FOOTBALL_WOMEN, FIBA, FFF, NBA, FREE
  name        String
  rules       Json            // Règles d'interdiction, dimensions min/max des numéros, zones protégées
  designs     ApparelDesign[]
}

model ApparelDesign {
  id           String              @id @default(uuid())
  projectId    String
  templateId   String
  rulePresetId String?
  name         String
  technique    PrintTechnique      @default(DTF)
  garmentColor String              // Code HEX (ex: "#0D6E5F")
  status       ApparelDesignStatus @default(DRAFT)
  proofToken   String?             @unique // Token aléatoire 32 caractères pour le BAT public
  approvedAt   DateTime?
  approverName String?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  project      Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  template     ApparelTemplate     @relation(fields: [templateId], references: [id])
  rulePreset   RulePreset?         @relation(fields: [rulePresetId], references: [id])
  elements     ApparelElement[]
  roster       TeamRoster?
  exports      ProductionExport[]

  @@index([projectId])
}

model ApparelElement {
  id          String            @id @default(uuid())
  designId    String
  zoneKey     String            // ex: "chest_left", "front_full", "back_full"
  kind        DesignElementKind
  content     Json              // photo: { src, naturalWidth, naturalHeight }, text, fontId
  widthMm     Float
  heightMm    Float
  offsetXMm   Float             @default(0)
  offsetYMm   Float             @default(0)
  rotationDeg Float             @default(0)
  zIndex      Int               @default(0)

  design      ApparelDesign     @relation(fields: [designId], references: [id], onDelete: Cascade)

  @@index([designId])
}

model TeamRoster {
  id       String        @id @default(uuid())
  designId String        @unique
  name     String        @default("Effectif")
  entries  RosterEntry[]

  design   ApparelDesign @relation(fields: [designId], references: [id], onDelete: Cascade)
}

model RosterEntry {
  id          String     @id @default(uuid())
  rosterId    String
  playerName  String
  displayName String     // Nom imprimé au dos (ex: "CAMARA")
  number      String?    // Floqué (ex: "10", "07", "00")
  size        String     // S, M, L, XL...
  quantity    Int        @default(1)
  role        String?    // Joueur, Gardien, Staff

  roster      TeamRoster @relation(fields: [rosterId], references: [id], onDelete: Cascade)

  @@index([rosterId])
}

model ProductionExport {
  id          String         @id @default(uuid())
  designId    String
  technique   PrintTechnique
  mirrored    Boolean        @default(false)
  status      JobStatus      @default(QUEUED)
  zipUrl      String?
  techPackUrl String?
  createdAt   DateTime       @default(now())

  design      ApparelDesign  @relation(fields: [designId], references: [id], onDelete: Cascade)

  @@index([designId])
}
```

---

## 2. ROUTES REST NESTJS DU MODULE TEXTILE

### `ApparelController` (`/apparel`, `/apparel-designs`, `/public/proofs`)

- `GET /apparel/templates` : Renvoie les 5 gabarits par défaut (T-shirt, Polo, Maillot Football, Maillot Basket, Short) avec zones d'impression et tailles en millimètres.
- `GET /apparel/rule-presets` : Renvoie les préréglages sportifs (FIFA, FIBA, FFF, NBA, Libre) et disclaimer légal.
- `GET /projects/:pid/apparel-designs` : Liste des tenues créées pour le projet.
- `POST /projects/:pid/apparel-designs` : Création d'une tenue (`templateId`, `name`, `technique`, `garmentColor`, `rulePresetId?`).
- `GET /apparel-designs/:did` : Détail complet d'une tenue (gabarit, éléments, effectif).
- `PATCH /apparel-designs/:did` : Modification (nom, technique, couleur). **RÈGLE CRUCIALE :** si `proofToken` existait, le révoquer et repasser la tenue au statut `DRAFT` (toute modification invalide un BAT déjà envoyé).
- `DELETE /apparel-designs/:did` : Suppression d'une tenue.
- `POST /apparel-designs/:did/duplicate` : Duplication complète de la tenue avec éléments et effectif.
- `PUT /apparel-designs/:did/elements` : Remplacement atomique de tous les éléments d'une tenue (sauvegarde auto du Studio). Valider que chaque `zoneKey` appartient au template.
- `POST /apparel-designs/:did/check` : Audit de conformité complet :
  1. Dépassement des dimensions par rapport à la zone max (`maxWidthMm`, `maxHeightMm`).
  2. Résolution / DPI (alerte si < 200 DPI, erreur si < 150 DPI).
  3. Contraste entre la couleur du tissu et celle des graphismes.
  4. Règlements sportifs (ex: en football, numéro dos minimum 250 mm et maximum 350 mm).
- `POST /apparel-designs/:did/roster/import` : Parse CSV d'effectif (`nom,nom_imprime,numero,taille,poste,quantite`), vérifie que les tailles existent dans le gabarit et enregistre le `TeamRoster`.
- `POST /apparel-designs/:did/proof` : Génère le token public de BAT (32 caractères hex) et passe à `PROOF_SENT`. Rejette avec code HTTP 422 si l'audit `check` a des erreurs bloquantes. Si `{ revoke: true }`, annule le token.
- `GET /public/proofs/:token` : **Route publique (sans auth)** pour consultation du BAT client avec rendu des faces et tableau d'effectif.
- `POST /public/proofs/:token/approve` : **Route publique (sans auth)** : Validation et signature par le client (`approverName`). Statut -> `APPROVED`, horodatage `approvedAt`.
- `POST /apparel-designs/:did/production-export` : Déclenche la tâche BullMQ de génération du pack atelier (2 crédits).

---

## 3. TRAITEMENT D'IMAGES SHARP SERVEUR (100% LOCAL & IN-HOUSE)

Installe `sharp` et implémente le service local pour la production atelier :

### 3.1 Sous-couche blanche DTF chokée (White Underbase with Choke)
```typescript
import sharp from 'sharp';

export async function generateDtfWhiteUnderbase(imageBuffer: Buffer, chokePixels = 1): Promise<Buffer> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  const mask = new Uint8Array(totalPixels);

  // 1. Détection présence d'encre (alpha > 40)
  for (let i = 0; i < totalPixels; i++) {
    if (data[i * 4 + 3] > 40) mask[i] = 255;
  }

  // 2. Choke morphologique (érosion) de 1 à 2 pixels pour éviter les débordements blancs
  let current = mask;
  for (let step = 0; step < chokePixels; step++) {
    const eroded = new Uint8Array(totalPixels);
    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const idx = y * info.width + x;
        if (current[idx] === 0) continue;
        if (
          current[idx - 1] === 0 ||
          current[idx + 1] === 0 ||
          current[idx - info.width] === 0 ||
          current[idx + info.width] === 0
        ) {
          eroded[idx] = 0;
        } else {
          eroded[idx] = 255;
        }
      }
    }
    current = eroded;
  }

  // 3. Rendu du masque PNG
  const outData = Buffer.alloc(totalPixels * 4);
  for (let i = 0; i < totalPixels; i++) {
    if (current[i] === 255) {
      outData[i * 4] = 255;
      outData[i * 4 + 1] = 255;
      outData[i * 4 + 2] = 255;
      outData[i * 4 + 3] = 255;
    }
  }

  return sharp(outData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}
```

### 3.2 Séparation de typons sérigraphie (Screen Printing Films)
Générer pour chaque couleur de ton direct un film positif noir opaque 100% UV.

### 3.3 Pack Atelier PDF 300 DPI (Production Tech Pack)
Générer une fiche technique vectorielle A4 paysage contenant :
- Mockup du vêtement avec cotes à l'échelle en mm.
- Tableau récapitulatif des effectifs par taille ($S, M, L, XL, XXL$) et total de pièces.
- Mentions légales du BAT, date d'approbation et nom du signataire.
- QR Code vers le BAT public en ligne.
```

---

## 2. SEED INITIAL DES GABARITS TEXTILE (APPAREL TEMPLATES)

Créer un script de seed `prisma/seed-apparel.ts` pour insérer les 5 supports de référence :
1. **T-shirt Col Rond** (`T_SHIRT`) : Zones Cœur (90x90 mm), Poitrine droite (90x90 mm), Sponsor (250x100 mm), Devant plein (300x380 mm), Dos plein (300x400 mm), Manche gauche (80x80 mm), Manche droite (80x80 mm).
2. **Polo Piqué** (`POLO`) : Zones Cœur (80x80 mm), Poitrine droite (80x80 mm), Haut du dos (250x80 mm), Manches (70x70 mm). Technique par défaut : `EMBROIDERY`.
3. **Maillot Football** (`FOOTBALL_JERSEY`) : Zones Écusson Cœur (85x85 mm), Sponsor ventral (280x120 mm), Numéro devant (100x100 mm), Nom dos (280x75 mm), Numéro dos (220x260 mm), Badges manches (75x75 mm). Technique par défaut : `HEAT_TRANSFER_VINYL` ou `SUBLIMATION`.
4. **Maillot Basketball** (`BASKETBALL_JERSEY`) : Torse équipe (260x100 mm), Numéro avant (140x140 mm), Nom dos (260x70 mm), Numéro dos (200x260 mm).
5. **Short Sport** (`SHORTS`) : Écusson bas cuisse gauche (75x75 mm), Numéro bas cuisse droite (60x60 mm).
