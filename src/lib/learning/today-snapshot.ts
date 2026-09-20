type SnapshotStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type SnapshotEnvelope = {
  version: 1;
  savedAt: number;
  data: unknown;
};

const TODAY_SNAPSHOT_KEY = "hskkit_today_snapshot_v1";

export function writeTodaySnapshot(storage: SnapshotStorage, data: unknown, savedAt = Date.now()) {
  try {
    storage.setItem(TODAY_SNAPSHOT_KEY, JSON.stringify({ version: 1, savedAt, data } satisfies SnapshotEnvelope));
  } catch {
    // A full or restricted session store must never block live learning.
  }
}

export function readTodaySnapshot<T>(storage: SnapshotStorage, now = Date.now(), maxAgeMs = 30 * 60_000): T | null {
  try {
    const raw = storage.getItem(TODAY_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SnapshotEnvelope>;
    const valid = parsed.version === 1
      && typeof parsed.savedAt === "number"
      && parsed.savedAt <= now
      && now - parsed.savedAt <= maxAgeMs
      && typeof parsed.data === "object"
      && parsed.data !== null;
    if (valid) return parsed.data as T;
    storage.removeItem(TODAY_SNAPSHOT_KEY);
  } catch {
    try { storage.removeItem(TODAY_SNAPSHOT_KEY); } catch {}
  }
  return null;
}
