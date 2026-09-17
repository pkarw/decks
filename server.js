const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const type = TYPES[path.extname(filePath)] || "application/octet-stream";
    const range = req.headers.range;
    const headers = {
      "Content-Type": type,
      "Accept-Ranges": "bytes",
    };

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
        res.end();
        return;
      }

      const start = match[1]
        ? Number(match[1])
        : Math.max(0, stats.size - Number(match[2]));
      const end = match[2] && match[1]
        ? Math.min(Number(match[2]), stats.size - 1)
        : stats.size - 1;

      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stats.size) {
        res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
        res.end();
        return;
      }

      headers["Content-Range"] = `bytes ${start}-${end}/${stats.size}`;
      headers["Content-Length"] = end - start + 1;
      res.writeHead(206, headers);
      if (req.method === "HEAD") res.end();
      else fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    headers["Content-Length"] = stats.size;
    res.writeHead(200, headers);
    if (req.method === "HEAD") res.end();
    else fs.createReadStream(filePath).pipe(res);
  });
}

http
  .createServer((req, res) => {
    const reqPath = decodeURIComponent(req.url.split("?")[0]);
    let filePath = path.join(ROOT, reqPath === "/" ? "/index.html" : reqPath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      sendFile(req, res, filePath);
    });
  })
  .listen(PORT, () => {
    console.log(`Serving ${ROOT} on port ${PORT}`);
  });
