/** Erreur au format application/problem+json (RFC 7807), renvoyée par l'API. */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
  /** Détail des champs refusés : liste de messages (API NestJS) ou messages par champ. */
  errors?: string[] | Record<string, string[]>;
  /** Messages par champ (« email », « elements.2.widthMm »), pour les afficher sous le champ. */
  fields?: Record<string, string[]>;
  /** Anomalies bloquantes d'un contrôle (BAT textile refusé, effectif non conforme). */
  issues?: unknown[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problemMessage(problem));
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.problem = problem;
  }
}

function problemMessage(problem: ProblemDetails) {
  const message = problem.detail ?? problem.title;
  const first =
    Object.values(problem.fields ?? {})[0]?.[0] ??
    (Array.isArray(problem.errors) ? problem.errors[0] : Object.values(problem.errors ?? {})[0]?.[0]);
  return first && first !== message ? `${message} : ${first}` : message;
}

/**
 * Premier message de chaque champ refusé par l'API, rattaché au champ de premier niveau
 * (« values.2 » → « values »).
 */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const fields: Record<string, string> = {};
  for (const [path, messages] of Object.entries(error.problem.fields ?? {})) {
    const key = path.split(".")[0] ?? path;
    if (messages[0] && !fields[key]) fields[key] = messages[0];
  }
  return fields;
}

export function errorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function problem(status: number, title: string, code?: string, detail?: string): ApiError {
  return new ApiError({ status, title, code, detail });
}
