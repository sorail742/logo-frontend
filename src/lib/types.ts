// Types côté front, alignés sur le schéma Prisma du cahier des charges (§12).
// À terme, ils seront importés depuis packages/shared.

export type PlatformRole = "USER" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN";
export type WorkspaceRole = "OWNER" | "EDITOR" | "VIEWER";
export type WorkspaceKind = "PERSONAL" | "ORGANIZATION";
export type EntityType = "ASSOCIATION" | "APPLICATION" | "PLATFORM" | "COMPANY" | "EVENT" | "OTHER";
export type ProjectStatus = "DRAFT" | "IN_PROGRESS" | "FINALIZED" | "ARCHIVED";
export type NameStyle = "DESCRIPTIVE" | "INVENTED" | "COMPOUND" | "METAPHORICAL" | "ACRONYM" | "PROPER";
export type CheckKind = "DOMAIN" | "SOCIAL" | "APP_STORE" | "TRADEMARK" | "PHONETIC";
export type CheckStatus = "AVAILABLE" | "TAKEN" | "UNKNOWN";
export type LogoType = "WORDMARK" | "MONOGRAM" | "ICON_TEXT" | "EMBLEM";
export type LogoEngine = "SVG_COMPOSER" | "IMAGE_VECTORIZE" | "UPLOAD";
export type LogoStyle = "MINIMAL" | "MODERN" | "CLASSIC" | "INSTITUTIONAL" | "PLAYFUL" | "AFRICAN";
export type SignatureKind = "EMAIL" | "HANDWRITTEN" | "STAMP";
export type SignatureStatus = "ACTIVE" | "PENDING_REVIEW" | "REJECTED";
export type JobKind = "NAMES" | "LOGOS" | "LOGO_EXPORT" | "SLOGANS" | "SIGNATURE" | "BRAND_GUIDE" | "EXPORT_ZIP";
export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
export type LedgerReason = "PURCHASE" | "SUBSCRIPTION_GRANT" | "GENERATION" | "REFUND" | "ADMIN_ADJUSTMENT" | "PROMO";
export type PaymentProvider = "ORANGE_MONEY" | "MOBILE_MONEY_AGGREGATOR" | "CARD";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type PlanCode = "FREE" | "PACK" | "ASSOCIATION" | "PRO" | "AGENCY";
export type SloganKind = "SLOGAN" | "DEVISE" | "MISSION";
export type SloganTone = "INSPIRING" | "INSTITUTIONAL" | "CATCHY" | "ENGAGED";

export const ENTITY_TYPES: EntityType[] = ["ASSOCIATION", "APPLICATION", "PLATFORM", "COMPANY", "EVENT", "OTHER"];
export const PROJECT_STATUSES: ProjectStatus[] = ["DRAFT", "IN_PROGRESS", "FINALIZED", "ARCHIVED"];
export const NAME_STYLES: NameStyle[] = ["DESCRIPTIVE", "INVENTED", "COMPOUND", "METAPHORICAL", "ACRONYM", "PROPER"];
export const LOGO_TYPES: LogoType[] = ["WORDMARK", "MONOGRAM", "ICON_TEXT", "EMBLEM"];
export const LOGO_STYLES: LogoStyle[] = ["MINIMAL", "MODERN", "CLASSIC", "INSTITUTIONAL", "PLAYFUL", "AFRICAN"];
export const SLOGAN_TONES: SloganTone[] = ["INSPIRING", "INSTITUTIONAL", "CATCHY", "ENGAGED"];

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  locale: string;
  country: string;
  role: PlatformRole;
  emailVerifiedAt: string | null;
  totpEnabled: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  kind: WorkspaceKind;
  creditBalance: number;
  role: WorkspaceRole; // rôle de l'utilisateur courant dans l'espace
  planCode: PlanCode;
}

export interface Member {
  userId: string;
  fullName: string;
  email: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  /** Vide pour une invitation par lien. */
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  /** Donné à la création seulement (le jeton n'est pas conservé en clair). */
  link?: string;
}

export interface Brief {
  sector: string;
  mission: string;
  values: string[];
  audience: string;
  languages: string[];
  nameStyles: NameStyle[];
  maxLength: number | null;
  mustInclude: string[];
  mustAvoid: string[];
  tone: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  entityType: EntityType;
  status: ProjectStatus;
  title: string;
  chosenName: NameSuggestion | null;
  brief: Brief | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Avancement du parcours (calculé par l'API)
  progress: { brief: boolean; name: boolean; logo: boolean; signatures: boolean; kit: boolean };
  previewSpec?: LogoSpec | null;
}

export interface AvailabilityCheck {
  kind: CheckKind;
  target: string;
  status: CheckStatus;
  url?: string;
  checkedAt: string;
}

export interface NameSuggestion {
  id: string;
  projectId: string;
  value: string;
  acronym: string | null;
  meaning: string;
  style: NameStyle;
  pronunciation: string | null;
  score: number | null;
  isFavorite: boolean;
  isRejected: boolean;
  votes: number;
  myVote: -1 | 0 | 1;
  checks: AvailabilityCheck[];
  createdAt: string;
}

export interface LogoColors {
  primary: string;
  secondary: string;
  text: string;
  background: string;
}

export type LogoLayout = "horizontal" | "vertical" | "icon" | "text";
export type IconFrame = "none" | "circle" | "rounded" | "hexagon";

/** Description déclarative d'un logo : le SVG en est dérivé (packages/render). */
export interface LogoSpec {
  type: LogoType;
  text: string;
  tagline: string;
  fontId: string;
  fontWeight: number;
  letterSpacing: number; // en em
  uppercase: boolean;
  iconId: string | null;
  iconScale: number; // 0.5 – 1.5
  iconFrame: IconFrame;
  layout: LogoLayout;
  colors: LogoColors;
}

export interface LogoVersion {
  id: string;
  number: number;
  label: string | null;
  spec: LogoSpec;
  /** SVG produit par le serveur ; dans les listes, seulement pour un logo importé non retravaillé. */
  svg?: string;
  createdAt: string;
}

export interface Logo {
  id: string;
  projectId: string;
  type: LogoType;
  engine: LogoEngine;
  style: LogoStyle;
  isFavorite: boolean;
  isExclusive: boolean;
  current: LogoVersion;
  createdAt: string;
}

export interface Slogan {
  id: string;
  projectId: string;
  text: string;
  kind: SloganKind;
  tone: SloganTone | null;
  isFavorite: boolean;
  isChosen: boolean;
  createdAt: string;
}

export interface EmailSignatureData {
  fullName: string;
  jobTitle: string;
  phones: string[];
  email: string;
  website: string;
  address: string;
  socials: { network: string; url: string }[];
  photoUrl: string;
  legal: string;
  bannerUrl?: string;
  bannerLink?: string;
}

export type StampShape = "round" | "oval" | "rectangle";
export type InkColor = "blue" | "violet" | "red" | "black";

export interface StampData {
  shape: StampShape;
  ringText: string;
  bottomText: string;
  centerText: string;
  centerMode: "acronym" | "title" | "logo";
  ink: InkColor;
  inkEffect: boolean;
}

export interface HandwrittenData {
  text: string;
  fontId: string;
  ink: InkColor;
  strokes?: string; // tracé dessiné (path d)
}

export interface Signature {
  id: string;
  projectId: string;
  kind: SignatureKind;
  status: SignatureStatus;
  templateId: string | null;
  data: EmailSignatureData | StampData | HandwrittenData;
  html: string | null;
  isPrivate: boolean;
  attestedAt: string | null;
  createdAt: string;
}

export interface PaletteColor {
  hex: string;
  rgb: string;
  cmyk: string;
  role: string;
}

export interface BrandKit {
  id: string;
  projectId: string;
  version: number;
  /** Contenu figé de la version (null : reprendre celui du projet). */
  name: string | null;
  acronym: string | null;
  meaning: string | null;
  devise: string | null;
  mission: string | null;
  palette: PaletteColor[];
  fonts: { id: string; name: string; license: string }[];
  logoSpec: LogoSpec | null;
  /** SVG d'origine d'un logo importé non retravaillé (la spec n'en est qu'une approximation). */
  logoSvg: string | null;
  slogan: string | null;
  shareToken: string | null;
  shareExpiresAt: string | null;
  hasPassword: boolean;
  /** Liens de téléchargement signés, valables 15 min (null : à générer ou non autorisé). */
  guidePdfUrl: string | null;
  zipUrl: string | null;
  /** Coût de la charte : 0 si elle a déjà été produite pour cette version. */
  guideCost: number;
  /** Version restaurée (KIT-06). */
  restoredFrom: number | null;
  createdAt: string;
}

export interface PublicKit extends BrandKit {
  projectName: string;
  acronym: string | null;
  meaning: string | null;
  entityType: EntityType;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  kind: JobKind;
  status: JobStatus;
  progress: number;
  costCredits: number;
  error: string | null;
  /** Sortie d'une tâche d'export : lien signé de l'archive tant qu'elle est conservée. */
  result?: { downloadUrl?: string; fileName?: string; files?: number; restricted?: boolean; expired?: boolean } | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface JobEvent {
  jobId: string;
  status: JobStatus;
  progress: number;
  error?: string | null;
}

export interface Plan {
  code: PlanCode;
  name: string;
  priceGnf: number | null; // null = prix à définir
  interval: "month" | "year" | null;
  monthlyCredits: number;
  includedCredits: number;
  maxMembers: number;
  features: string[];
  highlighted?: boolean;
}

export interface LedgerEntry {
  id: string;
  delta: number;
  reason: LedgerReason;
  note: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  provider: PaymentProvider;
  amountGnf: number;
  status: PaymentStatus;
  planCode: PlanCode | null;
  createdAt: string;
  workspaceName?: string;
}

export interface Invoice {
  id: string;
  number: string;
  amountGnf: number;
  taxGnf: number;
  issuedAt: string;
  pdfUrl: string | null;
}

export interface AppNotification {
  id: string;
  type: "INVITATION" | "COMMENT" | "EXPORT_READY" | "LOW_CREDITS" | "PAYMENT";
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export type CommentTarget = "PROJECT" | "NAME" | "LOGO" | "SIGNATURE" | "SLOGAN" | "KIT";

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  targetType: CommentTarget;
  targetId: string;
  body: string;
  /** Membres mentionnés avec @ (COL-02). */
  mentions: { userId: string; fullName: string }[];
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

// ─── Back-office ───
export interface AdminStats {
  signups: number;
  activeUsers: number;
  generations: Record<JobKind, number>;
  conversionRate: number;
  revenueGnf: number;
  aiCostUsd: number;
  daily: { date: string; revenueGnf: number; aiCostUsd: number; generations: number }[];
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string | null;
  role: PlatformRole;
  createdAt: string;
  suspendedAt: string | null;
  totpEnabled: boolean;
  workspaces: number;
}

export interface ModerationItem {
  id: string;
  kind: "STAMP" | "REPORT" | "ASSOCIATION_PROOF";
  title: string;
  reason: string;
  workspaceName: string;
  createdAt: string;
  previewSvg?: string;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  ip: string | null;
  createdAt: string;
}

export interface LibraryFont {
  id: string;
  name: string;
  category: "sans" | "serif" | "display" | "script";
  license: "OFL";
  isActive: boolean;
}
