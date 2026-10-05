import { router } from "expo-router";
import { clearToken, getToken } from "./auth";
import { BASE_URL } from "./config";

// DRF validation errors arrive as { field: ["message", ...] }; other errors as { detail: "..." }
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// Base HTTP helper: attaches auth, resolves the URL, handles 401s
export async function request(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Clear the token once it expires
  if (response.status === 401) {
    await clearToken();
    router.replace("/login");
  }

  return response;
}

// Turns a failed response into an ApiError, keeping DRF's per-field messages for forms
export async function toApiError(
  response: Response,
  fallback: string,
): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body (e.g. Django's HTML error page) — fall back to the generic message
  }

  if (body && typeof body === "object") {
    const { detail, ...rest } = body as Record<string, unknown>;
    const fieldErrors: FieldErrors = {};
    for (const [field, value] of Object.entries(rest)) {
      fieldErrors[field] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
    const message = typeof detail === "string" ? detail : fallback;
    return new ApiError(message, response.status, fieldErrors);
  }

  return new ApiError(fallback, response.status);
}
