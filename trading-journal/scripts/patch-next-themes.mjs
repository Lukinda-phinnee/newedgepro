import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// next-themes 0.4.6 renders its anti-FOUC script during client hydration,
// which React 19 / Next 16 reports as an error. Keep the script on SSR only.
const packagePath = join(process.cwd(), "node_modules", "next-themes", "package.json");
const installedVersion = JSON.parse(readFileSync(packagePath, "utf8")).version;
if (installedVersion !== "0.4.6") {
  console.log(`Skipping next-themes compatibility patch for version ${installedVersion}.`);
  process.exit(0);
}

const files = ["index.js", "index.mjs"];
const scriptStart = "scriptProps:w})=>{";

for (const file of files) {
  const path = join(process.cwd(), "node_modules", "next-themes", "dist", file);
  const source = readFileSync(path, "utf8");
  const patchedStart = `${scriptStart}if(typeof window!=="undefined")return null;`;

  if (source.includes(patchedStart)) continue;
  if (!source.includes(`${scriptStart}let p=JSON.stringify([`)) {
    throw new Error(`Unexpected next-themes ${file} contents; update the local React 19 compatibility patch.`);
  }

  const patched = source
    .replace(`${scriptStart}let p=JSON.stringify([`, `${patchedStart}let p=JSON.stringify([`)
    .replace(/nonce:typeof window=="undefined"\?([a-z]):""/g, "nonce:$1");
  writeFileSync(path, patched);
}
