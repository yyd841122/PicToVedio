import { parseTimestampMs } from "./timestamps.mjs";

export function isStalePendingJob(job, now = Date.now()) {
  if (!["queued", "processing", "in_progress"].includes(job?.status)) return false;
  const createdAt = parseTimestampMs(job.createdAt);
  return Number.isFinite(createdAt) && now - createdAt >= 30 * 60 * 1000;
}

export function formatJobAge(job, now = Date.now()) {
  const createdAt = parseTimestampMs(job?.createdAt);
  if (!Number.isFinite(createdAt)) return "Unknown age";
  const totalMinutes = Math.max(0, Math.floor((now - createdAt) / 60000));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 48) return `${totalHours}h`;
  return `${Math.floor(totalHours / 24)}d`;
}
