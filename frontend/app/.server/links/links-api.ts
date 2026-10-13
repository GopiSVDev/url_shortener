import { z } from "zod";
import { api } from "~/.server/api";

const linkSchema = z.object({
  shortCode: z.string(),
  shortUrl: z.string(),
  originalUrl: z.string(),
  createdAt: z.string(),
  expirationDate: z.string().nullable(),
  clickCount: z.number().optional(),
});

const namedCounts = z.array(z.object({ name: z.string(), clicks: z.number() }));

const analyticsSchema = z.object({
  shortCode: z.string(),
  originalUrl: z.string(),
  days: z.number(),
  totalClicks: z.number(),
  periodClicks: z.number(),
  uniqueVisitors: z.number(),
  botClicks: z.number(),
  lastClickedAt: z.string().nullable(),
  clicksPerDay: z.array(z.object({ date: z.string(), clicks: z.number() })),
  referrers: namedCounts,
  browsers: namedCounts,
  operatingSystems: namedCounts,
  devices: namedCounts,
});

export type Link = z.infer<typeof linkSchema>;
export type LinkAnalytics = z.infer<typeof analyticsSchema>;

export type LinkInput = {
  originalUrl: string;
  alias?: string;
  expirationDate?: string;
};

/** Anonymous when token is null; the link is then not tied to an account. */
export function createLink(
  input: LinkInput,
  token: string | null,
  from: Request,
) {
  return api("/api/urls", linkSchema, {
    method: "POST",
    body: input,
    token: token ?? undefined,
    from,
  });
}

export function listLinks(token: string) {
  return api("/api/urls", z.array(linkSchema), { token });
}

export function updateLink(
  code: string,
  input: Omit<LinkInput, "alias">,
  token: string,
) {
  return api(`/api/urls/${encodeURIComponent(code)}`, linkSchema, {
    method: "PUT",
    body: input,
    token,
  });
}

export function deleteLink(code: string, token: string) {
  return api(`/api/urls/${encodeURIComponent(code)}`, z.unknown(), {
    method: "DELETE",
    token,
  });
}

export function getAnalytics(code: string, days: number, token: string) {
  return api(
    `/api/urls/${encodeURIComponent(code)}/analytics?days=${days}`,
    analyticsSchema,
    { token },
  );
}
