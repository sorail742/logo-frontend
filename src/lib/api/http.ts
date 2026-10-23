import type { ApiClient, ApiFeature, Session } from "./contract";
import { ApiError, problem, type ProblemDetails } from "./errors";
import { tokenStore } from "./token";
import { PLANS } from "@/lib/plans";
import type { GenerationJob, JobEvent, JobStatus, Plan, Website, WebsiteMessage } from "@/lib/types";

// Client de l'API NestJS (/api/v1). Le jeton d'accès vit en mémoire ;
// le jeton de rafraîchissement est un cookie httpOnly posé par l'API (§14.1).
// L'API renvoie les types de src/lib/types.ts : ce client ne gère que le transport
// (pagination, noms de paramètres) et les modules pas encore livrés.

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

/** Modules servis par l'API ; la phase 6 du planning (paiements) n'est pas encore livrée. */
const FEATURES: Record<ApiFeature, boolean> = {
  slogans: true,
  signatures: true,
  brandKits: true,
  comments: true,
  payments: false,
  moderation: true,
  smsLogin: false,
  googleLogin: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
  studioExport: true,
};

/** Action d'un module pas encore servi par l'API. */
function unavailable(): never {
  throw problem(501, "Bientôt disponible", "NOT_AVAILABLE", "Cette fonction arrive avec une prochaine version de la plateforme.");
}

/** Lecture d'un module pas encore servi : liste vide plutôt qu'une erreur à l'écran. */
const none = async <T>(): Promise<T[]> => [];

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  headers?: Record<string, string>;
  auth?: boolean;
  retry?: boolean;
  /** Fichier binaire plutôt que JSON. */
  blob?: boolean;
}

let refreshing: Promise<Session | null> | null = null;

async function refreshSession(): Promise<Session | null> {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!response.ok) return null;
      const session = (await response.json()) as Session;
      tokenStore.set(session.accessToken);
      return session;
    } catch {
      return null;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
  const token = tokenStore.get();
  if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
  });

  if (response.status === 401 && options.auth !== false && options.retry !== false) {
    const session = await refreshSession();
    if (session) return request<T>(path, { ...options, retry: false });
    tokenStore.set(null);
  }

  if (!response.ok) {
    let problem: ProblemDetails = { title: response.statusText, status: response.status };
    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      // Réponse non JSON
    }
    throw new ApiError(problem);
  }
  if (response.status === 204) return undefined as T;
  if (options.blob) return (await response.blob()) as T;
  return (await response.json()) as T;
}

const get = <T>(path: string) => request<T>(path);
/** Liste paginée par curseur (§13.1) : première page de 100 éléments. */
const items = async <T>(path: string) => (await request<{ items: T[] }>(`${path}${path.includes("?") ? "&" : "?"}limit=100`)).items;
const post = <T>(path: string, body?: unknown, idempotencyKey?: string) =>
  request<T>(path, { method: "POST", body: body ?? {}, idempotencyKey });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body });
const put = <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });
/** Route publique : ni jeton d'accès ni tentative de rafraîchissement. */
const publicPost = <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body, auth: false });

/** Session ouverte : le jeton d'accès reste en mémoire. */
function keep(session: Session) {
  tokenStore.set(session.accessToken);
  return session;
}

/** Progression affichée : l'API publie des états, pas de pourcentage. */
function progressOf(status: JobStatus) {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELED" ? 100 : status === "RUNNING" ? 50 : 5;
}

/** Offre telle que l'API la renvoie (montants en chaîne, droits en objet). */
interface ApiPlan {
  code: string;
  name: string;
  priceGnf: string;
  interval: Plan["interval"];
  monthlyCredits: number;
  maxMembers: number;
  features: { oneTimeCredits?: number };
}

/**
 * Prix et quotas viennent de l'API, argumentaire du catalogue du front. Un prix à 0 hors
 * offre gratuite n'est pas encore fixé (§15.4) ; les offres textiles n'ont pas encore d'écran.
 */
function toPlan(plan: ApiPlan): Plan | null {
  const catalog = PLANS.find((p) => p.code === plan.code);
  if (!catalog) return null;
  return {
    ...catalog,
    name: plan.name,
    priceGnf: plan.code === "FREE" ? 0 : Number(plan.priceGnf) || null,
    interval: plan.interval,
    monthlyCredits: plan.monthlyCredits,
    includedCredits: plan.features.oneTimeCredits ?? catalog.includedCredits,
    maxMembers: plan.maxMembers,
  };
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== false) search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

/** Lecture du flux SSE via fetch, pour pouvoir envoyer l'en-tête Authorization. */
function subscribeSse(path: string, onEvent: (event: JobEvent) => void) {
  const controller = new AbortController();
  (async () => {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        headers: { Accept: "text/event-stream", Authorization: `Bearer ${tokenStore.get() ?? ""}` },
        credentials: "include",
        signal: controller.signal,
      });
      if (!response.body) return;
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const data = chunk
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("");
          if (data) {
            const event = JSON.parse(data) as Omit<JobEvent, "progress">;
            onEvent({ ...event, progress: progressOf(event.status) });
          }
        }
      }
    } catch {
      // Abandon ou coupure réseau : le hook useJob bascule sur une interrogation périodique
    }
  })();
  return () => controller.abort();
}

export const httpClient: ApiClient = {
  mode: "http",
  isAvailable: (feature) => FEATURES[feature],

  auth: {
    register: async (input) => keep(await publicPost<Session>("/auth/register", input)),
    login: async (input) => keep(await publicPost<Session>("/auth/login", input)),
    refresh: refreshSession,
    logout: async () => {
      await post("/auth/logout").catch(() => undefined);
      tokenStore.set(null);
    },
    google: async (idToken, totpCode) => keep(await publicPost<Session>("/auth/google", { idToken, totpCode })),
    verifyEmail: (token) => publicPost("/auth/email/verify", { token }),
    requestOtp: (phone) => publicPost("/auth/otp/request", { phone }),
    verifyOtp: async (phone, code) => keep(await publicPost<Session>("/auth/otp/verify", { phone, code })),
    forgotPassword: (email) => publicPost("/auth/password/forgot", { email }),
    resetPassword: (token, password) => publicPost("/auth/password/reset", { token, password }),
    setup2fa: () => post("/auth/2fa/setup"),
    // L'activation ouvre une session marquée 2FA : le nouveau jeton remplace l'ancien.
    verify2fa: async (code) => {
      const { backupCodes, ...session } = await post<Session & { backupCodes: string[] }>("/auth/2fa/verify", { code });
      keep(session);
      return { backupCodes };
    },
  },

  me: {
    get: () => get("/me"),
    update: (body) => patch("/me", body),
    remove: () => del("/me"),
    // L'API renvoie les données en JSON : elles sont proposées au téléchargement telles quelles.
    exportData: async () => {
      const data = await get<unknown>("/me/export");
      return { url: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })) };
    },
  },

  workspaces: {
    list: () => get("/workspaces"),
    create: (input) => post("/workspaces", input),
    update: (wid, body) => patch(`/workspaces/${wid}`, body),
    remove: (wid, confirm) => request<void>(`/workspaces/${wid}`, { method: "DELETE", body: { confirm } }),
    members: (wid) => get(`/workspaces/${wid}/members`),
    invitations: (wid) => get(`/workspaces/${wid}/invitations`),
    invite: (wid, input) => post(`/workspaces/${wid}/invitations`, input),
    updateMember: (wid, uid, role) => patch(`/workspaces/${wid}/members/${uid}`, { role }),
    removeMember: (wid, uid) => del(`/workspaces/${wid}/members/${uid}`),
    acceptInvitation: (token) => post(`/invitations/${token}/accept`),
  },

  projects: {
    list: (wid, filters = {}) =>
      items(`/workspaces/${wid}/projects${qs({ q: filters.q, type: filters.entityType, status: filters.status, trash: filters.trash })}`),
    create: (wid, input) => post(`/workspaces/${wid}/projects`, input),
    get: (pid) => get(`/projects/${pid}`),
    update: (pid, body) => patch(`/projects/${pid}`, body),
    remove: (pid) => del(`/projects/${pid}`),
    restore: (pid) => post(`/projects/${pid}/restore`),
    duplicate: (pid) => post(`/projects/${pid}/duplicate`),
    saveBrief: (pid, brief) => put(`/projects/${pid}/brief`, brief),
    activity: (pid) => get(`/projects/${pid}/activity`),
  },

  names: {
    generate: (pid, input, key) => post(`/projects/${pid}/names/generate`, input, key),
    list: (pid) => get(`/projects/${pid}/names`),
    update: (nid, body) => patch(`/names/${nid}`, body),
    check: async (nid) => (await post<{ checks: Awaited<ReturnType<ApiClient["names"]["check"]>> }>(`/names/${nid}/checks`)).checks,
    vote: (nid, value) => post(`/names/${nid}/votes`, { value }),
    choose: (pid, nameId) => post(`/projects/${pid}/chosen-name`, { nameId }),
    tryPublic: (input) => publicPost("/public/names/try", input),
  },

  logos: {
    generate: (pid, input, key) => post(`/projects/${pid}/logos/generate`, input, key),
    importLogo: (pid, input) => post(`/projects/${pid}/logos/import`, input),
    list: (pid) => get(`/projects/${pid}/logos`),
    get: (lid) => get(`/logos/${lid}`),
    update: (lid, body) => patch(`/logos/${lid}`, body),
    versions: (lid) => get(`/logos/${lid}/versions`),
    saveVersion: (lid, input) => post(`/logos/${lid}/versions`, input),
    requestExport: (lid, input) => post(`/logos/${lid}/export`, input),
    variants: (lid, options) => post(`/logos/${lid}/variants`, { transparent: options?.transparent }),
  },

  slogans: {
    generate: (pid, input, key) => post(`/projects/${pid}/slogans/generate`, input, key),
    list: (pid) => get(`/projects/${pid}/slogans`),
    update: (sid, body) => patch(`/slogans/${sid}`, body),
  },

  signatures: {
    list: (pid) => get(`/projects/${pid}/signatures`),
    create: (pid, input) => post(`/projects/${pid}/signatures`, input),
    update: (sid, body) => patch(`/signatures/${sid}`, body),
    html: (sid) => get(`/signatures/${sid}/html`),
    fileUrl: (sid) => get(`/signatures/${sid}/file`),
    batch: (pid, csv, templateId) => post(`/projects/${pid}/signatures/batch`, { csv, templateId }),
  },

  brandKits: {
    list: (pid) => get(`/projects/${pid}/brand-kits`),
    create: (pid) => post(`/projects/${pid}/brand-kits`),
    restore: (kid) => post(`/brand-kits/${kid}/restore`),
    generateGuide: (kid, key) => post(`/brand-kits/${kid}/guide`, {}, key),
    generateZip: (kid) => post(`/brand-kits/${kid}/zip`),
    share: (kid, input) => post(`/brand-kits/${kid}/share`, input),
    // Mot de passe en en-tête : il n'apparaît ni dans l'URL ni dans les journaux.
    publicKit: (token, password) =>
      request(`/public/kits/${encodeURIComponent(token)}`, { auth: false, headers: password ? { "X-Kit-Password": password } : {} }),
  },

  studio: {
    list: (pid) => get(`/projects/${pid}/studio-designs`),
    create: (pid, input) => post(`/projects/${pid}/studio-designs`, input),
    get: (sdid) => get(`/studio-designs/${sdid}`),
    save: (sdid, patch) => put(`/studio-designs/${sdid}`, patch),
    duplicate: (sdid) => post(`/studio-designs/${sdid}/duplicate`),
    remove: (sdid) => del(`/studio-designs/${sdid}`),
    requestExport: (sdid, input, key) => post(`/studio-designs/${sdid}/export`, input, key),
    generateImages: (pid, input, key) => post(`/projects/${pid}/studio-images`, input, key),
  },

  websites: {
    get: async (pid) => (await get<{ website: Website | null }>(`/projects/${pid}/website`)).website,
    create: (pid) => post(`/projects/${pid}/website`),
    update: (webid, input) => patch(`/websites/${webid}`, input),
    brand: (webid) => get(`/websites/${webid}/brand`),
    publish: (webid) => post(`/websites/${webid}/publish`),
    unpublish: (webid) => post(`/websites/${webid}/unpublish`),
    remove: (webid) => del(`/websites/${webid}`),
    addMedia: (webid, input) => post(`/websites/${webid}/media`, input),
    removeMedia: (webid, mid) => del(`/websites/${webid}/media/${mid}`),
    messages: async (webid) => (await get<{ items: WebsiteMessage[] }>(`/websites/${webid}/messages`)).items,
    markMessage: (webid, msgid, read) => patch(`/websites/${webid}/messages/${msgid}`, { read }),
    removeMessage: (webid, msgid) => del(`/websites/${webid}/messages/${msgid}`),
    exportZip: (webid) => post(`/websites/${webid}/export`),
  },

  jobs: {
    get: async (jid) => {
      const job = await get<Omit<GenerationJob, "progress">>(`/jobs/${jid}`);
      return { ...job, progress: progressOf(job.status) };
    },
    subscribe: (jid, onEvent) => subscribeSse(`/jobs/${jid}/events`, onEvent),
  },

  comments: {
    list: (pid, filter) => get(`/projects/${pid}/comments${filter ? `?targetType=${filter.targetType}&targetId=${filter.targetId}` : ""}`),
    create: (pid, input) => post(`/projects/${pid}/comments`, input),
    resolve: (cid, resolved) => patch(`/comments/${cid}`, { resolved }),
    remove: (cid) => del(`/comments/${cid}`),
  },

  notifications: {
    list: () => items("/notifications"),
    markRead: (id) => patch(`/notifications/${id}/read`, {}),
  },

  billing: {
    plans: async () => (await request<ApiPlan[]>("/plans", { auth: false })).map(toPlan).filter((plan): plan is Plan => plan !== null),
    credits: (wid) => get(`/workspaces/${wid}/credits`),
    ledger: (wid) => items(`/workspaces/${wid}/ledger`),
    // Phase 6 : paiements, codes promo, justificatifs et factures.
    checkout: unavailable,
    payment: unavailable,
    applyPromo: unavailable,
    sendAssociationProof: unavailable,
    cancelSubscription: unavailable,
    invoices: none,
  },

  library: {
    fonts: () => get("/library/fonts"),
    capabilities: () => get("/library/capabilities"),
    photos: ({ q, page, orientation, locale }) => get(`/library/photos${qs({ q, page, orientation, locale })}`),
    photoFile: (id) => request<Blob>(`/library/photos/${encodeURIComponent(id)}/file`, { blob: true, headers: { Accept: "image/*" } }),
  },

  admin: {
    stats: () => get("/admin/stats"),
    users: (q) => items(`/admin/users${qs({ q })}`),
    updateUser: (uid, { suspended, reset2fa }) => patch(`/admin/users/${uid}`, { suspended, resetTwoFactor: reset2fa }),
    adjustCredits: (input) => post("/admin/credits/adjust", input),
    requestCredits: (input) => post("/admin/credits/requests", input),
    creditRequests: (status) => get(`/admin/credits/requests${qs({ status })}`),
    decideCreditRequest: (id, approve, note) => patch(`/admin/credits/requests/${id}`, { approve, note }),
    payments: none,
    refund: unavailable,
    moderation: () => get("/admin/moderation"),
    review: (id, decision, note) => patch(`/admin/signatures/${id}/review`, { decision, note: note || undefined }),
    auditLogs: () => items("/admin/audit-logs"),
  },
};
