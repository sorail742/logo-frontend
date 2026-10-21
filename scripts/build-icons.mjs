// Génère public/studio/icons.json : toutes les icônes lucide (licence ISC) pour le Studio,
// chargées en une fois par l'éditeur. À relancer après une mise à jour de lucide-react.
//   node scripts/build-icons.mjs
import { readdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, "node_modules/lucide-react/dist/esm/icons");
const pkg = JSON.parse(await readFile(path.join(root, "node_modules/lucide-react/package.json"), "utf8"));

const icons = {};
for (const file of (await readdir(dir)).filter((f) => f.endsWith(".mjs")).sort()) {
  const source = await readFile(path.join(dir, file), "utf8");
  const match = source.match(/const __iconData = (\{[\s\S]*?\n\});/);
  if (!match) continue;
  // Littéral d'objet JavaScript (clés non citées) : évalué sans dépendance.
  const data = Function(`"use strict"; return (${match[1]});`)();
  if (icons[data.name]) continue;
  icons[data.name] = data.node.map(([tag, attrs]) => {
    const { key: _key, ...rest } = attrs;
    return [tag, rest];
  });
}

const out = path.join(root, "public/studio/icons.json");
await writeFile(out, JSON.stringify({ version: pkg.version, license: "ISC", icons }));
console.log(`${Object.keys(icons).length} icônes → ${path.relative(root, out)}`);
