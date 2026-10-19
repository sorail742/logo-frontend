import type { ApiClient, Session } from "./contract";
import { ApiError, type ProblemDetails } from "./errors";
import { tokenStore } from "./token";
import type { JobEvent } from "@/lib/types";

// Client de l'API NestJS (/api/v1). Le jeton d'accès vit en mémoire ;
// le jeton de rafraîchissement est un cookie httpOnly posé par l'API (§14.1).

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  auth?: boolean;
  retry?: boolean;
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
  const headers: Record<string, string> = { Accept: "application/json" };
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
  return (await response.json()) as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown, idempotencyKey?: string) =>
  request<T>(path, { method: "POST", body: body ?? {}, idempotencyKey });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body });
const put = <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

function qs(params: Record<string, string | boolean | undefined>) {
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
          if (data) onEvent(JSON.parse(data) as JobEvent);
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

  auth: {
    register: async (input) => {
      const session = await request<Session>("/auth/register", { method: "POST", body: input, auth: false });
      tokenStore.set(session.accessToken);
      return session;
    },
    login: async (input) => {
      const session = await request<Session>("/auth/login", { method: "POST", body: input, auth: false });
      tokenStore.set(session.accessToken);
      return session;
    },
    refresh: refreshSession,
    logout: async () => {
      await post("/auth/logout").catch(() => undefined);
      tokenStore.set(null);
    },
    googleUrl: () => `${BASE_URL}/auth/google`,
    requestOtp: (phone) => post("/auth/otp/request", { phone }),
    verifyOtp: async (phone, code) => {
      const session = await post<Session>("/auth/otp/verify", { phone, code });
      tokenStore.set(session.accessToken);
      return session;
    },
    forgotPassword: (email) => post("/auth/password/forgot", { email }),
    resetPassword: (token, password) => post("/auth/password/reset", { token, password }),
    setup2fa: () => post("/auth/2fa/setup"),
    verify2fa: (code) => post("/auth/2fa/verify", { code }),
  },

  me: {
    get: () => get("/me"),
    update: (body) => patch("/me", body),
    remove: () => del("/me"),
    exportData: () => get("/me/export"),
  },

  workspaces: {
    list: () => get("/workspaces"),
    create: (input) => post("/workspaces", input),
    update: (wid, body) => patch(`/workspaces/${wid}`, body),
    members: (wid) => get(`/workspaces/${wid}/members`),
    invitations: (wid) => get(`/workspaces/${wid}/invitations`),
    invite: (wid, input) => post(`/workspaces/${wid}/invitations`, input),
    updateMember: (wid, uid, role) => patch(`/workspaces/${wid}/members/${uid}`, { role }),
    removeMember: (wid, uid) => del(`/workspaces/${wid}/members/${uid}`),
    acceptInvitation: (token) => post(`/invitations/${token}/accept`),
  },

  projects: {
    list: (wid, filters = {}) =>
      get(`/workspaces/${wid}/projects${qs({ q: filters.q, entityType: filters.entityType, status: filters.status, trash: filters.trash })}`),
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
    check: (nid) => post(`/names/${nid}/checks`),
    vote: (nid, value) => post(`/names/${nid}/votes`, { value }),
    choose: (pid, nameId) => post(`/projects/${pid}/chosen-name`, { nameId }),
    tryPublic: (input) => request("/public/names/try", { method: "POST", body: input, auth: false }),
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
    generateGuide: (kid) => post(`/brand-kits/${kid}/guide`),
    generateZip: (kid) => post(`/brand-kits/${kid}/zip`),
    share: (kid, input) => post(`/brand-kits/${kid}/share`, input),
    publicKit: (token, password) =>
      request(`/public/kits/${token}${qs({ password })}`, { auth: false }),
  },

  jobs: {
    get: (jid) => get(`/jobs/${jid}`),
    subscribe: (jid, onEvent) => subscribeSse(`/jobs/${jid}/events`, onEvent),
  },

  comments: {
    list: (pid) => get(`/projects/${pid}/comments`),
    create: (pid, input) => post(`/projects/${pid}/comments`, input),
  },

  notifications: {
    list: () => get("/notifications"),
    markRead: (id) => patch(`/notifications/${id}/read`, {}),
  },

  billing: {
    plans: () => request("/plans", { auth: false }),
    credits: (wid) => get(`/workspaces/${wid}/credits`),
    ledger: (wid) => get(`/workspaces/${wid}/ledger`),
    checkout: (wid, input, key) => post(`/workspaces/${wid}/checkout`, input, key),
    payment: (id) => get(`/payments/${id}`),
    applyPromo: (wid, code) => post(`/workspaces/${wid}/promo`, { code }),
    sendAssociationProof: (wid, file) => {
      const form = new FormData();
      form.append("file", file);
      return request(`/workspaces/${wid}/association-proof`, { method: "POST", body: form });
    },
    cancelSubscription: (wid) => post(`/workspaces/${wid}/subscription/cancel`),
    invoices: (wid) => get(`/workspaces/${wid}/invoices`),
  },

  library: {
    fonts: () => get("/library/fonts"),
  },

  admin: {
    stats: () => get("/admin/stats"),
    users: (q) => get(`/admin/users${qs({ q })}`),
    updateUser: (uid, body) => patch(`/admin/users/${uid}`, body),
    adjustCredits: (input) => post("/admin/credits/adjust", input),
    payments: () => get("/admin/payments"),
    refund: (id) => post(`/admin/payments/${id}/refund`),
    moderation: () => get("/admin/moderation"),
    review: (id, decision, note) => patch(`/admin/moderation/${id}`, { decision, note }),
    auditLogs: () => get("/admin/audit-logs"),
  },
};
