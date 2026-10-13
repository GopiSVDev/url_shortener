import type { z } from "zod";
import { env } from "~/.server/env";

type ApiErrorBody = {
  status: number;
  error: string;
  message: string | Record<string, string>;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | null,
  ) {
    super(`API request failed with status ${status}`);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  from?: Request;
};

// Behind a reverse proxy the incoming request carries the browser's IP in X-Forwarded-For; pass it on.
// Without a proxy there is none, and the backend sees this server's IP.
function forwardedFor(request: Request | undefined): Record<string, string> {
  const value = request?.headers.get("X-Forwarded-For");
  return value ? { "X-Forwarded-For": value } : {};
}

export async function api<T extends z.ZodType>(
  path: string,
  schema: T,
  { method = "GET", body, token, from }: RequestOptions = {},
): Promise<z.infer<T>> {
  const response = await fetch(new URL(path, env.apiUrl), {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...forwardedFor(from),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await response.json().catch(() => null),
    );
  }
  // 204 No Content
  return schema.parse(
    response.status === 204 ? undefined : await response.json(),
  );
}
