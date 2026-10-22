export function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return null;
  return { offset: start, length: end - start + 1 };
}

async function serveMedia(request, bucket, key) {
  const metadata = await bucket.head(key);
  if (!metadata) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  metadata.writeHttpMetadata(headers);
  headers.set("Content-Type", "video/mp4");
  headers.set("ETag", metadata.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Last-Modified", metadata.uploaded.toUTCString());
  const etags = request.headers.get("If-None-Match")?.split(",").map((tag) => tag.trim().replace(/^W\//, ""));
  if (etags?.includes(metadata.httpEtag) || etags?.includes("*")) {
    return new Response(null, { status: 304, headers });
  }
  const rangeHeader = request.headers.get("Range");
  const ifRange = request.headers.get("If-Range");
  let range;
  // Range applies to GET; HEAD reports the complete representation.
  if (request.method === "GET" && rangeHeader && (!ifRange || ifRange === metadata.httpEtag || ifRange === metadata.uploaded.toUTCString())) {
    range = parseRange(rangeHeader, metadata.size);
    if (!range) {
      headers.set("Content-Range", `bytes */${metadata.size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
  }
  headers.set("Content-Length", String(range ? range.length : metadata.size));
  if (request.method === "HEAD") return new Response(null, { headers });
  const object = await bucket.get(key, range ? { range } : {});
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { status: range ? 206 : 200, headers });
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const url = new URL(request.url);
    if (url.pathname.endsWith(".mp4")) {
      return serveMedia(request, env.MEDIA, decodeURIComponent(url.pathname.slice(1)));
    }
    if (url.pathname.endsWith("/")) url.pathname += "index.html";
    const response = await env.ASSETS.fetch(new Request(url, request));
    if (response.status !== 404 || url.pathname.endsWith("index.html")) return response;
    url.pathname += "/index.html";
    const index = await env.ASSETS.fetch(new Request(url, request));
    if (index.status === 404) return response;
    url.pathname = url.pathname.slice(0, -"index.html".length);
    return Response.redirect(url.toString(), 308);
  },
};
