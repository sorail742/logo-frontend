/** Erreur au format application/problem+json (RFC 7807), renvoyée par l'API. */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.problem = problem;
  }
}

export function errorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function problem(status: number, title: string, code?: string, detail?: string): ApiError {
  return new ApiError({ status, title, code, detail });
}
