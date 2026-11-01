const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join("");

export default {
  async fetch(request, env) {
    const expires = Number(env.EXPIRES_AT);
    if (!expires || Date.now() >= expires || !env.RUN_TOKEN_SHA256) return new Response("Forbidden", { status: 403 });
    const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!token || await digest(new TextEncoder().encode(token)) !== env.RUN_TOKEN_SHA256) return new Response("Forbidden", { status: 403 });
    let key;
    try { key = decodeURIComponent(new URL(request.url).pathname.slice(1)); } catch { return new Response("Not found", { status: 404 }); }
    const approved = JSON.parse(env.APPROVED_ARTIFACTS);
    if (!key.startsWith("system/artifacts/") || !Object.hasOwn(approved, key)) return new Response("Not found", { status: 404 });
    const file = approved[key];
    if (request.method === "PUT") {
      if (Number(request.headers.get("content-length")) !== file.bytes || file.bytes > 20_000_000) return new Response("Invalid length", { status: 413 });
      const bytes = await request.arrayBuffer();
      if (bytes.byteLength !== file.bytes || await digest(bytes) !== file.sha256) return new Response("Invalid checksum", { status: 422 });
      if (Date.now() >= expires) return new Response("Forbidden", { status: 403 });
      await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: file.contentType } });
      return Response.json({ sha256: file.sha256 }, { headers: { "cache-control": "no-store" } });
    }
    if (request.method === "GET") {
      const object = await env.BUCKET.get(key);
      if (!object) return new Response("Not found", { status: 404 });
      if (object.size !== file.bytes) return new Response("Invalid stored length", { status: 409 });
      return new Response(object.body, { headers: { "content-type": file.contentType, "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }
    return new Response("Method not allowed", { status: 405, headers: { allow: "PUT, GET" } });
  },
};
