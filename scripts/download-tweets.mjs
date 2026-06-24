import { getTweet } from "react-tweet/api";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "tweets");
const idsPath = join(dataDir, "ids.json");
const cachePath = join(dataDir, "cache.json");

const ids = JSON.parse(await readFile(idsPath, "utf8"));

const cache = {};
const failed = [];

for (const id of ids) {
  try {
    const tweet = await getTweet(id);
    if (tweet) {
      cache[id] = tweet;
      console.log(`✓ ${id}  @${tweet.user.screen_name}`);
    } else {
      failed.push(id);
      console.warn(`✗ ${id}  not found`);
    }
  } catch (err) {
    failed.push(id);
    console.warn(`✗ ${id}  ${err?.message ?? err}`);
  }
}

await mkdir(dataDir, { recursive: true });
await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);

console.log(`\nSaved ${Object.keys(cache).length}/${ids.length} tweets → ${cachePath}`);
if (failed.length) console.log(`Failed: ${failed.join(", ")}`);
