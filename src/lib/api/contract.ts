import type {
  AdminStats,
  AdminUser,
  AppNotification,
  AuditEntry,
  AvailabilityCheck,
  BrandKit,
  Brief,
  Comment,
  CreditRequest,
  CommentAnchor,
  EntityType,
  GenerationJob,
  Invitation,
  Invoice,
  JobEvent,
  LedgerEntry,
  LibraryCapabilities,
  LibraryFont,
  PhotoOrientation,
  PhotoPage,
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
  Website,
  WebsiteBrand,
  WebsiteMedia,
  WebsiteMessage,
  Workspace,
  WorkspaceRole,
} from "@/lib/types";
import type { ArtworkStyle } from "@/lib/render/artwork";
import type { SiteContent } from "@/lib/render/site";
import type { DesignDoc, StudioDesign, StudioDesignSummary } from "@/lib/studio/types";
import type {
  ApparelCheck,
  ApparelDesign,
  ApparelDesignInput,
  ApparelDesignSummary,
  ApparelElement,
  ApparelRoster,
  ApparelStatus,
  ApparelTemplate,
  ProductionExportInput,
  PublicProof,
  RosterSummary,
  RulePreset,
} from "@/lib/apparel/types";

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
  | "studioExport"
  /** Pack atelier du textile (planches de transfert, découpe, films) produit par le serveur. */
  | "productionPack";

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

export interface StudioImagesInput {
  /** Description libre (donnée, jamais instruction pour le fournisseur). */
  prompt: string;
  style: "auto" | ArtworkStyle;
  aspect: "square" | "portrait" | "landscape";
  /** Couleurs #rrggbb ; par défaut, celles du logo favori. */
  palette?: string[];
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
    update(wid: string, patch: { name?: string; viewerDownloads?: boolean }): Promise<Workspace>;
    /** Espace d'organisation : confirmé par son nom exact (propriétaire, ou admin). */
    remove(wid: string, confirm: string): Promise<void>;
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
    /**
     * Déclinaisons (couleur, noir, blanc, icône, dispositions) de la dernière version ;
     * `transparent` : version blanche sans fond, pour la poser sur une création.
     */
    variants(lid: string, options?: { transparent?: boolean }): Promise<{ versionId: string; variants: LogoVariantFile[] }>;
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
    /** Lot de 4 images (1 crédit), produit par le worker ; URL dans le résultat de la tâche. */
    generateImages(pid: string, input: StudioImagesInput, idempotencyKey: string): Promise<JobAccepted>;
    /** Détourage par IA (1 crédit) : masque PNG en niveaux de gris, blanc = sujet conservé. */
    cutout(pid: string, input: { image: string }, idempotencyKey: string): Promise<{ mask: string; costCredits: number }>;
  };

  /** Textile (Module 5) : t-shirts, polos, maillots ; BAT validé par le client sans compte. */
  apparel: {
    templates(): Promise<ApparelTemplate[]>;
    rulePresets(): Promise<{ disclaimer: string; presets: RulePreset[] }>;
    list(pid: string): Promise<ApparelDesignSummary[]>;
    create(pid: string, input: ApparelDesignInput): Promise<ApparelDesign>;
    get(did: string): Promise<ApparelDesign>;
    /** Toute modification après l'envoi du BAT le révoque (nouvelle validation nécessaire). */
    update(did: string, patch: Partial<Omit<ApparelDesignInput, "templateId">>): Promise<ApparelDesign>;
    remove(did: string): Promise<void>;
    /** Copie en brouillon (impressions et effectif) : variante, nouvelle saison, fête suivante. */
    duplicate(did: string): Promise<ApparelDesign>;
    /** Remplace tous les éléments (sauvegarde automatique de l'éditeur). */
    saveElements(did: string, elements: ApparelElement[]): Promise<ApparelDesign>;
    /** Contrôle complet : zones, technique, règlement sportif, effectif. */
    check(did: string, input?: { printShopId?: string }): Promise<ApparelCheck>;
    /** Effectif importé d'un CSV (nom, nom_imprime, numero, taille, poste, quantite). */
    importRoster(did: string, csv: string, name?: string): Promise<{ roster: ApparelRoster; summary: RosterSummary }>;
    /** Lien de BAT à envoyer au client (422 tant que des erreurs subsistent). */
    proof(did: string): Promise<{ token: string; url: string }>;
    revokeProof(did: string): Promise<{ revoked: true }>;
    publicProof(token: string): Promise<PublicProof>;
    approveProof(token: string, approverName: string): Promise<{ status: ApparelStatus; approvedAt: string | null }>;
    /** Pack atelier : fichiers du support d'impression, un par joueur, fiche technique (tâche). */
    productionExport(did: string, input: ProductionExportInput, idempotencyKey?: string): Promise<{ jobId: string; costCredits: number }>;
  };

  websites: {
    /** Site du projet, ou null s'il n'a pas encore été créé. */
    get(pid: string): Promise<Website | null>;
    /** Site de départ tiré du projet (nom, brief, slogan, logo, signature e-mail). 400 NO_LOGO sans logo. */
    create(pid: string): Promise<Website>;
    /** Sauvegarde (automatique) : contenu, adresse publique, logo affiché. */
    update(webid: string, patch: { content?: SiteContent; slug?: string; logoId?: string | null }): Promise<Website>;
    /** Logo et symbole pour l'aperçu de l'éditeur. */
    brand(webid: string): Promise<WebsiteBrand>;
    /** Publication ou republication des modifications. */
    publish(webid: string): Promise<Website>;
    unpublish(webid: string): Promise<Website>;
    remove(webid: string): Promise<void>;
    addMedia(webid: string, input: { dataUrl: string; alt?: string }): Promise<Pick<WebsiteMedia, "id" | "url" | "alt">>;
    /** Retire aussi l'image des sections qui l'utilisent. */
    removeMedia(webid: string, mid: string): Promise<Website>;
    messages(webid: string): Promise<WebsiteMessage[]>;
    markMessage(webid: string, msgid: string, read: boolean): Promise<WebsiteMessage>;
    removeMessage(webid: string, msgid: string): Promise<void>;
    /** Archive autonome du site (offres payantes) : URL signée de téléchargement. */
    exportZip(webid: string): Promise<{ url: string }>;
  };

  jobs: {
    get(jid: string): Promise<GenerationJob>;
    /** Abonnement au flux SSE de la tâche ; renvoie une fonction de désabonnement. */
    subscribe(jid: string, onEvent: (event: JobEvent) => void): () => void;
  };

  comments: {
    list(pid: string, filter?: { targetType: Comment["targetType"]; targetId: string }): Promise<Comment[]>;
    create(
      pid: string,
      input: { targetType: Comment["targetType"]; targetId: string; body: string; anchor?: CommentAnchor; parentId?: string },
    ): Promise<Comment>;
    /** Fil résolu ou rouvert (premier message) : son auteur, un éditeur ou un propriétaire. */
    resolve(cid: string, resolved: boolean): Promise<Comment>;
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
    capabilities(): Promise<LibraryCapabilities>;
    /** Banque de photos : 501 NOT_AVAILABLE si elle n'est pas activée. */
    photos(input: { q?: string; page?: number; orientation?: PhotoOrientation; locale?: string }): Promise<PhotoPage>;
    photoFile(id: string): Promise<Blob>;
  };

  admin: {
    stats(): Promise<AdminStats>;
    users(q?: string): Promise<AdminUser[]>;
    updateUser(uid: string, patch: { suspended?: boolean; reset2fa?: boolean }): Promise<AdminUser>;
    adjustCredits(input: { workspaceId: string; delta: number; reason: string }): Promise<void>;
    /** Support : propose un ajustement, appliqué après validation d'un admin. */
    requestCredits(input: { workspaceId: string; delta: number; reason: string }): Promise<CreditRequest>;
    creditRequests(status?: CreditRequest["status"]): Promise<CreditRequest[]>;
    decideCreditRequest(id: string, approve: boolean, note?: string): Promise<CreditRequest>;
    payments(): Promise<Payment[]>;
    refund(paymentId: string): Promise<void>;
    moderation(): Promise<ModerationItem[]>;
    review(id: string, decision: "APPROVE" | "REJECT", note: string): Promise<void>;
    auditLogs(): Promise<AuditEntry[]>;
  };
}
