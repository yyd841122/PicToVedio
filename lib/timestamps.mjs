export function parseTimestampMs(value) {
  const raw = String(value || "").trim();
  if (!raw) return Number.NaN;
  const normalized = raw
    .replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T")
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/([+-]\d{2})$/, "$1:00");
  return Date.parse(normalized);
}
