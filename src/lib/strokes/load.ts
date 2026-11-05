import { strokeCounts, strokeDataPath, validStrokeData, type StrokeData } from "./domain";
const cache = new Map<string, StrokeData>();
export async function loadStrokeData(character: string, signal: AbortSignal): Promise<StrokeData> {
  const path = strokeDataPath(character);
  if (!path) throw new Error("unsupported");
  const cached = cache.get(character);
  if (cached) return cached;
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 12000);
  try {
    if (signal.aborted) throw new Error("cancelled");
    const response = await fetch(path, { signal: timeout.signal, credentials: "omit", cache: "force-cache" });
    if (!response.ok) throw new Error("unavailable");
    const data: unknown = await response.json();
    if (!validStrokeData(data, strokeCounts[character])) throw new Error("invalid-data");
    if (cache.size >= 40) cache.delete(cache.keys().next().value!);
    cache.set(character, data);
    return data;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
