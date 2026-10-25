import { randomId } from "@/lib/random";
import type { ApiClient } from "./contract";
import { httpClient } from "./http";
import { mockClient } from "./mock";

export const API_MODE: ApiClient["mode"] =
  process.env.NEXT_PUBLIC_API_MOCK === "false" && process.env.NEXT_PUBLIC_API_URL ? "http" : "mock";

export const api: ApiClient = API_MODE === "http" ? httpClient : mockClient;

export function newIdempotencyKey() {
  return randomId();
}

export type * from "./contract";
export { ApiError, errorMessage, fieldErrors } from "./errors";
