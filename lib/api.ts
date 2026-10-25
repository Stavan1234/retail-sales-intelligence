import type { Filters } from "@/types/analytics";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function toQuery(filters: Filters = {}): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, value);
  }
  return query;
}

export async function apiFetch<T>(path: string, filters: Filters = {}, signal?: AbortSignal): Promise<T> {
  const query = toQuery(filters);
  const url = `${path}${query.toString() ? `?${query.toString()}` : ""}`;
  return apiFetchUrl<T>(url, signal);
}

export async function apiFetchUrl<T>(pathWithQuery: string, signal?: AbortSignal): Promise<T> {
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  const url = `${API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new Error(
      "The analytics service could not be reached. Locally, start it with run.bat. Online, a free server may need up to a minute to wake up, so wait and refresh.",
    );
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new ApiError(detail || `Request failed (${response.status})`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The analytics service returned an invalid JSON response.");
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

async function readErrorDetail(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text().catch(() => "");

  if (contentType.includes("application/json") && bodyText) {
    try {
      const body: unknown = JSON.parse(bodyText);
      if (typeof body === "object" && body !== null && "detail" in body) {
        const detail: unknown = body.detail;
        if (typeof detail === "string") return detail;
        if (Array.isArray(detail)) {
          const messages = detail.flatMap((item: unknown) => {
            if (typeof item === "string") return [item];
            if (typeof item === "object" && item !== null && "msg" in item) {
              const message = item.msg;
              return typeof message === "string" ? [message] : [];
            }
            return [];
          });
          if (messages.length) return messages.join("; ");
        }
      }
    } catch {
      // Fall back to the raw response body below.
    }
  }

  return bodyText.slice(0, 600).trim();
}
