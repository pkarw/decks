import { cp, mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = `${root}.cloudflare/public`;
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ["index.html", "decks", "shared", "notes"]) {
  await cp(`${root}${entry}`, `${output}/${entry}`, {
    recursive: true,
    filter: async (source) => {
      if (source.endsWith(".mp4")) return false;
      const info = await stat(source);
      if (info.isFile() && info.size > 25 * 1024 * 1024) {
        throw new Error(`Static asset exceeds 25 MiB: ${source}`);
      }
      return true;
    },
  });
}
console.log(`Cloudflare static assets prepared in ${output}`);
