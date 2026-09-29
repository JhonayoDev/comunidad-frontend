#!/usr/bin/env node
// Uso: node scripts/audit-primevue.mjs [srcDir] [Componentes,separados,por,coma]
// Ej:  node scripts/audit-primevue.mjs src Button,InputText,Select,Dialog
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  mkdirSync,
} from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.argv[2] ?? "src";
const COMPONENTS = (process.argv[3] ?? "Button")
  .split(",")
  .map((s) => s.trim());

// Props que NO definen "estilo" (lógica/datos): se ignoran para agrupar variantes.
const IGNORE = [
  /^label$/,
  /^:label$/,
  /^@/,
  /^v-model/,
  /^v-if$/,
  /^v-else/,
  /^v-show$/,
  /^v-for$/,
  /^:key$/,
  /^key$/,
  /^ref$/,
  /^id$/,
  /^:id$/,
  /^name$/,
  /^:name$/,
  /^type$/,
  /^:type$/,
  /^:disabled$/,
  /^disabled$/,
  /^:loading$/,
  /^loading$/,
  /^v-tooltip/,
  /^aria-/,
  /^:aria-/,
  /^data-/,
  /^:data-/,
  /^:model-value$/,
  /^:modelValue$/,
  /^:options$/,
  /^:value$/,
  /^value$/,
  /^placeholder$/,
  /^:placeholder$/,
  /^:visible$/,
  /^v-model:visible$/,
  /^header$/,
  /^:header$/,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) continue;
    statSync(p).isDirectory()
      ? walk(p, out)
      : p.endsWith(".vue") && out.push(p);
  }
  return out;
}

// Extrae el texto completo de una etiqueta de apertura respetando comillas.
function readOpenTag(src, start) {
  let i = start,
    q = null;
  while (i < src.length) {
    const c = src[i];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'") q = c;
    else if (c === ">") return src.slice(start, i + 1);
    i++;
  }
  return null;
}

function parseAttrs(tag) {
  const body = tag.replace(/^<[\w-]+/, "").replace(/\/?>$/, "");
  const re = /([:@#]?[\w.\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  const attrs = [];
  let m;
  while ((m = re.exec(body))) attrs.push([m[1], m[2] ?? m[3] ?? true]);
  return attrs;
}

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const found = [];

for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  for (const comp of COMPONENTS) {
    const re = new RegExp(`<(${comp}|${kebab(comp)}|P${comp})(?=[\\s/>])`, "g");
    let m;
    while ((m = re.exec(src))) {
      const tag = readOpenTag(src, m.index);
      if (!tag) continue;
      const line = src.slice(0, m.index).split("\n").length;
      const attrs = parseAttrs(tag);
      const style = attrs.filter(([k]) => !IGNORE.some((r) => r.test(k)));
      const signature =
        style
          .map(([k, v]) => (v === true ? k : `${k}="${v}"`))
          .sort()
          .join(" ") || "(default)";
      found.push({
        component: comp,
        file: relative(".", file),
        line,
        signature,
        attrs: Object.fromEntries(attrs),
      });
    }
  }
}

mkdirSync("audit", { recursive: true });
writeFileSync("audit/primevue-inventory.json", JSON.stringify(found, null, 2));

// Reporte markdown agrupado por componente -> firma de estilo
let md = "# Inventario PrimeVue\n\n";
md += `Generado: ${new Date().toISOString()}\n\nTotal de usos: **${found.length}**\n\n`;
for (const comp of COMPONENTS) {
  const uses = found.filter((f) => f.component === comp);
  md += `## ${comp} (${uses.length} usos)\n\n`;
  const groups = new Map();
  for (const u of uses) {
    if (!groups.has(u.signature)) groups.set(u.signature, []);
    groups.get(u.signature).push(u);
  }
  const sorted = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  md += `Variantes distintas: **${sorted.length}**\n\n`;
  sorted.forEach(([sig, list], i) => {
    md += `### ${comp} · V${i + 1} — ${list.length} usos\n\n`;
    md += "```\n" + sig + "\n```\n\n";
    const files = [...new Set(list.map((u) => `${u.file}:${u.line}`))];
    md += files
      .slice(0, 15)
      .map((f) => `- ${f}`)
      .join("\n");
    if (files.length > 15) md += `\n- … y ${files.length - 15} más`;
    md += "\n\n";
  });
}
writeFileSync("audit/primevue-inventory.md", md);
console.log(`Listo: ${found.length} usos. Ver audit/primevue-inventory.md`);
