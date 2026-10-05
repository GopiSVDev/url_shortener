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
};

export async function api<T extends z.ZodType>(
  path: string,
  schema: T,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<z.infer<T>> {
  const response = await fetch(new URL(path, env.apiUrl), {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
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
  return schema.parse(await response.json());
}
