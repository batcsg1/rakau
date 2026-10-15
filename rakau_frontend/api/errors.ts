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

// Turns a failed response into an ApiError, keeping DRF's per-field messages for forms
export async function toApiError(response: Response, fallback: string): Promise<ApiError> {
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
