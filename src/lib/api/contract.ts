import type {
  AdminStats,
  AdminUser,
  AppNotification,
  AuditEntry,
  AvailabilityCheck,
  BrandKit,
  Brief,
  Comment,
  EntityType,
  GenerationJob,
  Invitation,
  Invoice,
  JobEvent,
  LedgerEntry,
  LibraryFont,
  Logo,
  LogoEngine,
  LogoSpec,
  LogoStyle,
  LogoType,
  LogoVersion,
  Member,
  ModerationItem,
  NameSuggestion,
  Payment,
  PaymentProvider,
  Plan,
  PlanCode,
  Project,
  ProjectStatus,
  PublicKit,
  Signature,
  SignatureKind,
  Slogan,
  SloganKind,
  SloganTone,
  User,
  Workspace,
  WorkspaceRole,
} from "@/lib/types";
import type { DesignDoc, StudioDesign, StudioDesignSummary } from "@/lib/studio/types";

// Contrat du client API : une méthode par route REST (§13). Deux implémentations :
// http.ts (API NestJS réelle) et mock/ (simulation locale).

export interface Session {
  accessToken: string;
  user: User;
}

/**
 * Modules susceptibles de ne pas être servis par l'API : en mode http, ceux des phases 4 à 6
 * (signatures, kit, collaboration, paiements) arrivent progressivement.
 */
export type ApiFeature =
  | "slogans"
  | "signatures"
  | "brandKits"
  | "comments"
  | "payments"
  | "moderation"
  | "smsLogin"
  | "googleLogin"
  /** Exports du Studio produits par le serveur : PDF d'impression, SVG au texte vectorisé. */
  | "studioExport";

export interface JobAccepted {
  jobId: string;
}

export interface ProjectFilters {
  q?: string;
  entityType?: EntityType | "";
  status?: ProjectStatus | "";
  trash?: boolean;
}

export interface NameGenerationInput {
  feedback?: string;
  referenceNameId?: string;
}

export interface PublicNameTryInput {
  entityType: EntityType;
  sector: string;
  keywords: string[];
}

export interface LogoGenerationInput {
  type: LogoType;
  style: LogoStyle;
  engine: Exclude<LogoEngine, "UPLOAD">;
  palette?: string[];
  feedback?: string;
  referenceLogoId?: string;
}

export interface SloganGenerationInput {
  tone: SloganTone;
  maxWords: number;
  language: "fr" | "en";
  kind: SloganKind;
}

export interface StudioDesignInput {
  name: string;
  /** Identifiant du format (src/lib/studio/formats.ts) ou « custom ». */
  format: string;
  doc: DesignDoc;
  /** Aperçu PNG (data URL, ~400 px). */
  thumbnail?: string;
}

export interface StudioExportInput {
  format: "pdf" | "svg";
  /** Indices des pages ; toutes par défaut. */
  pages?: number[];
  /** Traits de coupe (formats imprimés). */
  cropMarks?: boolean;
}

/** Déclinaison d'un logo produite par le serveur (texte vectorisé). */
export interface LogoVariantFile {
  id: string;
  file: string;
  dark: boolean;
  svg: string;
}

export interface CheckoutInput {
  planCode: PlanCode;
  interval?: "month" | "year";
  provider: PaymentProvider;
  phone?: string;
  promoCode?: string;
}

export interface CheckoutResult {
  paymentId: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  /** URL de redirection (carte) ou instructions (mobile money : valider sur le téléphone). */
  redirectUrl?: string;
  instructions?: string;
}

export interface ApiClient {
  readonly mode: "http" | "mock";
  /** Vrai si le module est disponible avec cette implémentation. */
  isAvailable(feature: ApiFeature): boolean;

  auth: {
    register(input: { fullName: string; email: string; password: string }): Promise<Session>;
    /** `totpCode` : code TOTP ou code de secours, exigé si la double authentification est active. */
    login(input: { email: string; password: string; totpCode?: string }): Promise<Session>;
    refresh(): Promise<Session | null>;
    logout(): Promise<void>;
    /** Connexion avec l'ID token de Google Identity Services. */
    google(idToken: string, totpCode?: string): Promise<Session>;
    verifyEmail(token: string): Promise<void>;
    requestOtp(phone: string): Promise<void>;
    verifyOtp(phone: string, code: string): Promise<Session>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    setup2fa(): Promise<{ otpauthUrl: string; secret: string }>;
    verify2fa(code: string): Promise<{ backupCodes: string[] }>;
  };

  me: {
    get(): Promise<User>;
    update(patch: Partial<Pick<User, "fullName" | "locale" | "country" | "avatarUrl">>): Promise<User>;
    remove(): Promise<void>;
    exportData(): Promise<{ url: string }>;
  };

  workspaces: {
    list(): Promise<Workspace[]>;
    create(input: { name: string }): Promise<Workspace>;
    update(wid: string, patch: { name: string }): Promise<Workspace>;
    members(wid: string): Promise<Member[]>;
    invitations(wid: string): Promise<Invitation[]>;
    invite(wid: string, input: { email?: string; role: WorkspaceRole; asLink?: boolean }): Promise<Invitation>;
    updateMember(wid: string, uid: string, role: WorkspaceRole): Promise<void>;
    removeMember(wid: string, uid: string): Promise<void>;
    acceptInvitation(token: string): Promise<Workspace>;
  };

  projects: {
    list(wid: string, filters?: ProjectFilters): Promise<Project[]>;
    create(wid: string, input: { title: string; entityType: EntityType; existingName?: string }): Promise<Project>;
    get(pid: string): Promise<Project>;
    update(pid: string, patch: Partial<Pick<Project, "title" | "status" | "entityType">>): Promise<Project>;
    remove(pid: string): Promise<void>;
    restore(pid: string): Promise<Project>;
    duplicate(pid: string): Promise<Project>;
    saveBrief(pid: string, brief: Brief): Promise<Project>;
    activity(pid: string): Promise<{ id: string; actor: string; action: string; createdAt: string }[]>;
  };

  names: {
    generate(pid: string, input: NameGenerationInput, idempotencyKey: string): Promise<JobAccepted>;
    list(pid: string): Promise<NameSuggestion[]>;
    update(nid: string, patch: { isFavorite?: boolean; isRejected?: boolean }): Promise<NameSuggestion>;
    check(nid: string): Promise<AvailabilityCheck[]>;
    vote(nid: string, value: -1 | 1): Promise<NameSuggestion>;
    choose(pid: string, nid: string): Promise<Project>;
    tryPublic(input: PublicNameTryInput): Promise<{ names: Pick<NameSuggestion, "value" | "meaning" | "style">[]; remaining: number }>;
  };

  logos: {
    generate(pid: string, input: LogoGenerationInput, idempotencyKey: string): Promise<JobAccepted>;
    importLogo(pid: string, input: { svg?: string; pngDataUrl?: string; palette: string[] }): Promise<Logo>;
    list(pid: string): Promise<Logo[]>;
    get(lid: string): Promise<Logo>;
    update(lid: string, patch: { isFavorite?: boolean }): Promise<Logo>;
    versions(lid: string): Promise<LogoVersion[]>;
    saveVersion(lid: string, input: { spec: LogoSpec; label?: string }): Promise<LogoVersion>;
    /** Export serveur de la dernière version enregistrée (ZIP), suivi comme une tâche. */
    requestExport(
      lid: string,
      input: { formats: ("svg" | "pdf" | "png" | "jpg")[]; sizes?: number[]; iconPack: boolean; social?: boolean },
    ): Promise<JobAccepted & { restricted?: boolean }>;
    /** Déclinaisons (couleur, noir, blanc, icône, dispositions) de la dernière version. */
    variants(lid: string): Promise<{ versionId: string; variants: LogoVariantFile[] }>;
  };

  slogans: {
    generate(pid: string, input: SloganGenerationInput, idempotencyKey: string): Promise<JobAccepted>;
    list(pid: string): Promise<Slogan[]>;
    update(sid: string, patch: { isFavorite?: boolean; isChosen?: boolean; text?: string }): Promise<Slogan>;
  };

  signatures: {
    list(pid: string): Promise<Signature[]>;
    create(pid: string, input: { kind: SignatureKind; templateId?: string; data: Signature["data"]; attested?: boolean }): Promise<Signature>;
    update(sid: string, patch: { templateId?: string; data?: Signature["data"]; attested?: boolean }): Promise<Signature>;
    html(sid: string): Promise<{ html: string; text: string }>;
    fileUrl(sid: string): Promise<{ url: string; expiresAt: string }>;
    batch(pid: string, csv: string, templateId: string): Promise<{ count: number; jobId: string }>;
  };

  brandKits: {
    list(pid: string): Promise<BrandKit[]>;
    create(pid: string): Promise<BrandKit>;
    /** Recopie une version sous un nouveau numéro, qui devient la version courante (KIT-06). */
    restore(kid: string): Promise<BrandKit>;
    generateGuide(kid: string, idempotencyKey: string): Promise<JobAccepted>;
    /** `restricted` : offre gratuite, archive réduite à des PNG 512 px filigranés. */
    generateZip(kid: string): Promise<JobAccepted & { restricted?: boolean }>;
    share(kid: string, input: { enabled: boolean; password?: string; expiresAt?: string | null }): Promise<BrandKit>;
    publicKit(token: string, password?: string): Promise<PublicKit>;
  };

  studio: {
    list(pid: string): Promise<StudioDesignSummary[]>;
    create(pid: string, input: StudioDesignInput): Promise<StudioDesign>;
    get(sdid: string): Promise<StudioDesign>;
    /** Sauvegarde (automatique) : nom, document, aperçu. */
    save(sdid: string, patch: Partial<Pick<StudioDesignInput, "name" | "doc" | "thumbnail">>): Promise<StudioDesignSummary>;
    duplicate(sdid: string): Promise<StudioDesign>;
    remove(sdid: string): Promise<void>;
    /** PDF d'impression ou SVG vectorisé produit par le worker (lien dans le résultat de la tâche). */
    requestExport(sdid: string, input: StudioExportInput, idempotencyKey: string): Promise<JobAccepted>;
  };

  jobs: {
    get(jid: string): Promise<GenerationJob>;
    /** Abonnement au flux SSE de la tâche ; renvoie une fonction de désabonnement. */
    subscribe(jid: string, onEvent: (event: JobEvent) => void): () => void;
  };

  comments: {
    list(pid: string): Promise<Comment[]>;
    create(pid: string, input: { targetType: Comment["targetType"]; targetId: string; body: string }): Promise<Comment>;
    /** Par son auteur ou un propriétaire de l'espace. */
    remove(cid: string): Promise<void>;
  };

  notifications: {
    list(): Promise<AppNotification[]>;
    markRead(id: string): Promise<void>;
  };

  billing: {
    plans(): Promise<Plan[]>;
    credits(wid: string): Promise<{ balance: number; planCode: PlanCode; renewsAt: string | null }>;
    ledger(wid: string): Promise<LedgerEntry[]>;
    checkout(wid: string, input: CheckoutInput, idempotencyKey: string): Promise<CheckoutResult>;
    payment(paymentId: string): Promise<Payment>;
    applyPromo(wid: string, code: string): Promise<{ credits: number }>;
    sendAssociationProof(wid: string, file: File): Promise<void>;
    cancelSubscription(wid: string): Promise<void>;
    invoices(wid: string): Promise<Invoice[]>;
  };

  library: {
    fonts(): Promise<LibraryFont[]>;
  };

  admin: {
    stats(): Promise<AdminStats>;
    users(q?: string): Promise<AdminUser[]>;
    updateUser(uid: string, patch: { suspended?: boolean; reset2fa?: boolean }): Promise<AdminUser>;
    adjustCredits(input: { workspaceId: string; delta: number; reason: string }): Promise<void>;
    payments(): Promise<Payment[]>;
    refund(paymentId: string): Promise<void>;
    moderation(): Promise<ModerationItem[]>;
    review(id: string, decision: "APPROVE" | "REJECT", note: string): Promise<void>;
    auditLogs(): Promise<AuditEntry[]>;
  };
}
