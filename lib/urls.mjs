export function safeSameOriginUrl(value, allowedBaseUrl, fallbackPath = "/") {
  const base = new URL(allowedBaseUrl);
  const fallback = new URL(fallbackPath, base);

  try {
    const candidate = new URL(String(value || fallback), base);
    if (!["http:", "https:"].includes(candidate.protocol)) return fallback.toString();
    if (candidate.origin !== base.origin) return fallback.toString();
    return candidate.toString();
  } catch {
    return fallback.toString();
  }
}
