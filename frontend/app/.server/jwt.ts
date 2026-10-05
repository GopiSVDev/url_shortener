type JwtPayload = { sub?: string; exp?: number };

export function decodeJwt(token: string): JwtPayload | null {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  } catch {
    return null;
  }
}

/** True when the token expires within `skewMs`, or can't be read. */
export function isExpired(token: string, skewMs = 30_000) {
  const exp = decodeJwt(token)?.exp;
  return !exp || exp * 1000 - skewMs <= Date.now();
}
