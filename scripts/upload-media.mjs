import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const directory of ["decks", "shared"]) {
  const entries = await readdir(`${root}${directory}`, { recursive: true });
  for (const entry of entries.filter((entry) => entry.endsWith(".mp4"))) {
    const key = `${directory}/${entry}`;
    const result = spawnSync("npx", [
      "wrangler", "r2", "object", "put", `pkarw-decks-media/${key}`,
      "--file", `${root}${key}`, "--content-type", "video/mp4",
      "--cache-control", "public, max-age=3600", "--remote",
    ], { cwd: root, stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
