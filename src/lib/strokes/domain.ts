import counts from "./supported.json" with { type: "json" };
export const STROKE_DATA_VERSION = "v1";
export const strokeCounts: Record<string, number> = counts;
export const starterCharacters = ["中", "人", "大", "三", "木", "水", "你", "好", "学", "习", "我", "爱"];
export function splitCharacters(input: string): string[] {
  return [...new Set(Array.from(input.trim()).filter(char => /\p{Script=Han}/u.test(char)))].slice(0, 12);
}
export function strokeDataPath(character: string): string | undefined {
  if (!Object.hasOwn(strokeCounts, character) || Array.from(character).length !== 1) return undefined;
  return `/stroke-data/${STROKE_DATA_VERSION}/${character.codePointAt(0)!.toString(16)}.json`;
}
export type StrokeData = { strokes: string[]; medians: number[][][]; radStrokes?: number[] };
export function validStrokeData(data: unknown, expectedCount: number): data is StrokeData {
  if (!data || typeof data !== "object") return false;
  const value = data as StrokeData;
  return Array.isArray(value.strokes) && value.strokes.length === expectedCount
    && value.strokes.every(path => typeof path === "string" && path.startsWith("M"))
    && Array.isArray(value.medians) && value.medians.length === expectedCount
    && value.medians.every(line => Array.isArray(line) && line.length >= 2 && line.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)));
}
