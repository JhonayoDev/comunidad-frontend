#!/usr/bin/env node
// Verifica que cada firma de Button en src/ esté cubierta por el catálogo.
// Uso: pnpm verificar:estandar  (sale 1 si hay desviaciones estáticas)
// Regenera el inventario antes de comparar: node scripts/audit-primevue-v2.mjs
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { ESTANDAR, CLAVES_ESTILO } from "../src/data/estandarBotones.js";

execSync("node scripts/audit-primevue-v2.mjs", { stdio: "inherit" });
const INV = JSON.parse(readFileSync("audit/primevue-inventory-v2.json", "utf8"));
// Acta de revisión visual: lo votado (estandar/migrar/descartar) está aceptado;
// solo es desviación lo sin decidir o lo que no aparece en el acta.
const DECISIONES = new Map(
  JSON.parse(readFileSync("audit/03-decisiones-visuales.json", "utf8")).map((x) => [x.firma, x.decision]),
);

const estilosCatalogo = ESTANDAR.map((i) => {
  const e = {};
  for (const k of CLAVES_ESTILO) if (i.props[k] !== undefined) e[k] = String(i.props[k]);
  return e;
});

function estiloDe(firma) {
  if (firma === "(default)") return {};
  const e = {};
  for (const m of firma.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) {
    const k = m[1];
    if (["severity", "variant", "size", "rounded"].includes(k)) e[k] = m[2] ?? "true";
    if (k === "text" || k === "outlined" || k === "link") e.variant = k;
  }
  return e;
}

const igual = (a, b) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([k, v]) => b[k] === v);

const porFirma = new Map();
for (const u of INV) {
  if (!porFirma.has(u.signature)) porFirma.set(u.signature, []);
  porFirma.get(u.signature).push(u);
}

const cubiertas = [], dinamicas = [], nobotones = [], legadas = [], desviaciones = [], aceptadas = [];
for (const [firma, usos] of porFirma) {
  const archivos = [...new Set(usos.map((u) => `${u.file}:${u.line}`))];
  const item = { firma, usos: usos.length, ejemplos: archivos.slice(0, 3), totalArchivos: archivos.length };
  if (firma.includes(":")) { dinamicas.push(item); continue; }
  if (firma === "(default)" && usos.some((u) => u.classes)) { nobotones.push(item); continue; }
  if (usos.some((u) => u.legacyProp)) { legadas.push({ ...item, nota: "prop legada text/outlined/link → migrar a variant" }); continue; }
  if (estilosCatalogo.some((c) => igual(c, estiloDe(firma)))) { cubiertas.push(item); continue; }
  const decision = DECISIONES.get(firma);
  if (decision && decision !== "sin decidir") { aceptadas.push({ ...item, decision }); continue; }
  desviaciones.push(item);
}

// Valida intencion="…" de AppButton contra los slugs del catálogo.
const slugs = new Set(ESTANDAR.map((i) => i.slug));
const malIntencion = [];
{
  const { readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const walk = (dir) => {
    for (const n of readdirSync(dir)) {
      if (n === "node_modules" || n.startsWith(".")) continue;
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".vue")) {
        if (p === "src/dev" || p.startsWith("src/dev/")) continue; // UI Lab: no es producto
        const src = readFileSync(p, "utf8");
        for (const m of src.matchAll(/<AppButton[^>]*intencion="([^"]*)"/g)) {
          if (m[1].includes("$") || m[1].includes("{")) continue; // snippet del lab, no uso real
          if (!slugs.has(m[1])) malIntencion.push(`${p}: intencion="${m[1]}" no existe`);
        }
      }
    }
  };
  walk("src");
}

console.log(`Firmas: ${porFirma.size} (${INV.length} usos)`);
console.log(`- cubiertas por el catálogo: ${cubiertas.length}`);
console.log(`- aceptadas por acta 03 (${[...new Set(aceptadas.map((a) => a.decision))].join("/") || "—"}): ${aceptadas.length}`);
console.log(`- dinámicas (revisión manual, issue #37): ${dinamicas.length}`);
console.log(`- no-botones (issue #37): ${nobotones.length}`);
console.log(`- legadas (migrar a variant): ${legadas.length}`);
console.log(`- AppButton con intención inválida: ${malIntencion.length}`);
for (const m of malIntencion) console.log(`  ! ${m}`);
if (legadas.length) {
  console.log("Legadas:");
  for (const l of legadas) console.log(`  ~ ${l.firma.slice(0, 90)} (${l.usos} usos, ${l.ejemplos[0]})`);
}
if (desviaciones.length) {
  console.log(`DESVIACIONES (${desviaciones.length}):`);
  for (const d of desviaciones) {
    console.log(`  ✗ ${d.firma.slice(0, 110)} (${d.usos} usos, ej: ${d.ejemplos.join(" · ")})`);
  }
  process.exit(1);
}
console.log("OK: sin desviaciones estáticas.");
