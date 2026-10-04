const encoder = new TextEncoder();
const base64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};
const decode64 = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};
async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
export async function sha256Hex(value: string | Uint8Array) {
  const source = typeof value === "string" ? encoder.encode(value) : value;
  // R2 arrayBuffer() returns an exact, owned ArrayBuffer. Avoid duplicating a
  // 60–70 MB product ZIP while the export worker or download handler hashes it.
  const buffer = source.buffer instanceof ArrayBuffer && source.byteOffset === 0 && source.byteLength === source.buffer.byteLength
    ? source.buffer
    : source.slice().buffer;
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
export type DownloadTokenPayload = { jobId: string; userId: string; jti: string; exp: number };
export async function signDownloadToken(payload: DownloadTokenPayload, secret: string) {
  const body = base64Url(encoder.encode(JSON.stringify(payload)));
  const signature = base64Url(await hmac(secret, body));
  return `${body}.${signature}`;
}
export async function verifyDownloadToken(token: string, secret: string, now = Date.now()) {
  const [body, supplied, extra] = token.split(".");
  if (!body || !supplied || extra) throw new Error("INVALID_DOWNLOAD_TOKEN");
  const expected = await hmac(secret, body);
  const actual = decode64(supplied);
  if (actual.length !== expected.length) throw new Error("INVALID_DOWNLOAD_TOKEN");
  let different = 0;
  for (let index = 0; index < expected.length; index++) different |= expected[index] ^ actual[index];
  if (different !== 0) throw new Error("INVALID_DOWNLOAD_TOKEN");
  const payload = JSON.parse(new TextDecoder().decode(decode64(body))) as DownloadTokenPayload;
  if (!payload.jobId || !payload.userId || !payload.jti || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(now / 1000)) throw new Error("DOWNLOAD_TOKEN_EXPIRED");
  return payload;
}
