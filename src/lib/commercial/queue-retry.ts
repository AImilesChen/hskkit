export function retryDelaySeconds(leaseExpiresAt: string | null | undefined, now = Date.now()) {
  const leaseMs = Date.parse(leaseExpiresAt ?? "");
  return Number.isFinite(leaseMs)
    ? Math.min(43_200, Math.max(5, Math.ceil((leaseMs - now) / 1000) + 5))
    : 60;
}
