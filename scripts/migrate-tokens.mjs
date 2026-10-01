#!/usr/bin/env node
/**
 * migrate-tokens.mjs — Migración mecánica de clases surface-N y colores semánticos
 *
 * Uso:
 *   node scripts/migrate-tokens.mjs           → simulación (solo muestra cambios)
 *   node scripts/migrate-tokens.mjs --write   → aplica los cambios
 *   node scripts/migrate-tokens.mjs --write --group=text   → solo texto
 *   node scripts/migrate-tokens.mjs --write --group=bg     → solo fondos
 *   node scripts/migrate-tokens.mjs --write --group=border → solo bordes
 *   node scripts/migrate-tokens.mjs --write --group=css    → solo <style> scoped
 *   node scripts/migrate-tokens.mjs --write --group=semantic → solo red/green semánticos
 *
 * Siempre genera audit/migrate-report.md con el detalle completo.
 * NUNCA toca src/theme/ ni archivos que no sean .vue/.js/.ts/.css
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const WRITE = process.argv.includes("--write");
const GROUP =
  (process.argv.find((a) => a.startsWith("--group=")) ?? "").replace(
    "--group=",
    "",
  ) || "all";
const SRC_DIR = "src";
const SKIP = ["src/theme"]; // nunca tocar el tema

// ─────────────────────────────────────────────────────────────────────────────
// TABLA DE REEMPLAZOS
// Orden importa: los más específicos van primero.
// Cada entrada: { pattern, replacement, group, note? }
// ─────────────────────────────────────────────────────────────────────────────
const RULES = [
  // ── TEXTO ─────────────────────────────────────────────────────────────────
  // text-surface-0 (texto sobre banner oscuro)
  {
    pattern: /\btext-surface-0\b/g,
    replacement: "text-banner-text",
    group: "text",
  },
  // text-surface-300 (tenue, decorativo)
  {
    pattern: /\btext-surface-300\b/g,
    replacement: "text-text-subtle",
    group: "text",
  },
  // text-surface-400 → subprincipal (el más abundante, 226 usos)
  {
    pattern: /\btext-surface-400\b/g,
    replacement: "text-text-subprincipal",
    group: "text",
  },
  // text-surface-500 → muted
  {
    pattern: /\btext-surface-500\b/g,
    replacement: "text-text-muted",
    group: "text",
  },
  // text-surface-600 → muted (mismo rol que 500 en las vistas)
  {
    pattern: /\btext-surface-600\b/g,
    replacement: "text-text-muted",
    group: "text",
  },
  // text-surface-700 → texto principal
  { pattern: /\btext-surface-700\b/g, replacement: "text-text", group: "text" },
  // text-surface-900 → texto principal
  { pattern: /\btext-surface-900\b/g, replacement: "text-text", group: "text" },

  // ── FONDOS ────────────────────────────────────────────────────────────────
  // bg-surface-50 → subtle-light
  {
    pattern: /\bbg-surface-50\b/g,
    replacement: "bg-subtle-light",
    group: "bg",
  },
  // bg-surface-100 → subtle
  { pattern: /\bbg-surface-100\b/g, replacement: "bg-subtle", group: "bg" },
  // bg-surface-200 → track
  { pattern: /\bbg-surface-200\b/g, replacement: "bg-track", group: "bg" },
  // bg-surface-800 → banner (solo NotificationBanner)
  { pattern: /\bbg-surface-800\b/g, replacement: "bg-banner", group: "bg" },

  // ── BORDES ────────────────────────────────────────────────────────────────
  // border-surface-100 → border-subtle
  {
    pattern: /\bborder-surface-100\b/g,
    replacement: "border-border-subtle",
    group: "border",
  },
  // border-surface-200 → border-soft
  {
    pattern: /\bborder-surface-200\b/g,
    replacement: "border-border-soft",
    group: "border",
  },
  // border-surface-300 → banner-border (solo NotificationBanner)
  {
    pattern: /\bborder-surface-300\b/g,
    replacement: "border-banner-border",
    group: "border",
  },

  // ── CSS SCOPED (var(--p-surface-N)) ───────────────────────────────────────
  // Texto principal en <style>
  {
    pattern: /var\(--p-surface-900\)/g,
    replacement: "var(--color-text)",
    group: "css",
  },
  // Texto atenuado en <style>
  {
    pattern: /var\(--p-surface-600\)/g,
    replacement: "var(--color-text-muted)",
    group: "css",
  },
  // Placeholder de campo (ConfiguracionAlmacenamientoView)
  {
    pattern: /var\(--p-surface-400\)/g,
    replacement: "var(--color-text-subprincipal)",
    group: "css",
    note: "Revisar: en ConfiguracionAlmacenamientoView era --p-select-placeholder-color",
  },
  // Fondo de campo (ConfiguracionAlmacenamientoView)
  {
    pattern: /var\(--p-surface-200\)/g,
    replacement: "var(--color-track)",
    group: "css",
    note: "Revisar: en ConfiguracionAlmacenamientoView era --p-select-background",
  },

  // ── SEMÁNTICOS (text-red/green-N) ─────────────────────────────────────────
  {
    pattern: /\btext-red-500\b/g,
    replacement: "text-danger",
    group: "semantic",
  },
  {
    pattern: /\btext-red-600\b/g,
    replacement: "text-danger-strong",
    group: "semantic",
  },
  {
    pattern: /\bbg-red-500\b/g,
    replacement: "bg-danger",
    group: "semantic",
    note: "Revisar: en SaasAlmacenamientoView era bg de barra excedida — confirmar visualmente",
  },
  {
    pattern: /\bbg-red-50\b/g,
    replacement: "bg-subtle-light",
    group: "skip",
    note: "Revisar: en InicioView era fondo de alerta VENCIDO, puede necesitar token propio",
  },
  {
    pattern: /\bborder-red-200\b/g,
    replacement: "border-border-subtle",
    group: "skip",
    note: "Revisar: en InicioView era borde de alerta VENCIDO, puede necesitar token propio",
  },
  {
    pattern: /\btext-green-500\b/g,
    replacement: "text-success",
    group: "semantic",
  },
  {
    pattern: /\btext-green-600\b/g,
    replacement: "text-success-strong",
    group: "semantic",
  },
  {
    pattern: /\btext-orange-600\b/g,
    replacement: "text-warning",
    group: "semantic",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVOS A PROCESAR
// ─────────────────────────────────────────────────────────────────────────────
const VALID_EXT = new Set([".vue", ".js", ".ts", ".css"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    if (SKIP.some((s) => p.startsWith(s))) continue;
    if (statSync(p).isDirectory()) walk(p, files);
    else if (VALID_EXT.has(extname(name))) files.push(p);
  }
  return files;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESO
// ─────────────────────────────────────────────────────────────────────────────
const activeRules = RULES.filter((r) => GROUP === "all" || r.group === GROUP);
const files = walk(SRC_DIR);

const report = [];
let totalChanges = 0;
let totalFiles = 0;

for (const file of files) {
  const original = readFileSync(file, "utf8");
  let content = original;
  const fileChanges = [];

  for (const rule of activeRules) {
    const matches = [...content.matchAll(new RegExp(rule.pattern.source, "g"))];
    if (!matches.length) continue;

    for (const match of matches) {
      const line = content.slice(0, match.index).split("\n").length;
      fileChanges.push({
        line,
        from: match[0],
        to: rule.replacement,
        group: rule.group,
        note: rule.note ?? "",
      });
    }
    content = content.replace(rule.pattern, rule.replacement);
  }

  if (!fileChanges.length) continue;

  totalChanges += fileChanges.length;
  totalFiles++;

  report.push({ file: relative(".", file), changes: fileChanges });

  if (WRITE && content !== original) {
    writeFileSync(file, content, "utf8");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTE
// ─────────────────────────────────────────────────────────────────────────────
const byGroup = {};
for (const r of report) {
  for (const c of r.changes) {
    byGroup[c.group] = (byGroup[c.group] ?? 0) + 1;
  }
}

let md = `# Reporte de migración de tokens\n\n`;
md += `Modo: **${WRITE ? "ESCRITURA" : "SIMULACIÓN (solo lectura)"}**\n`;
md += `Grupo: **${GROUP}**\n`;
md += `Fecha: ${new Date().toISOString()}\n\n`;
md += `## Resumen\n\n`;
md += `| Total cambios | Archivos afectados |\n|---|---|\n`;
md += `| ${totalChanges} | ${totalFiles} |\n\n`;
md += `### Por grupo\n\n| Grupo | Cambios |\n|---|---|\n`;
for (const [g, n] of Object.entries(byGroup)) md += `| ${g} | ${n} |\n`;

// Advertencias (entradas con note)
const warnings = report.flatMap((r) => r.changes.filter((c) => c.note));
if (warnings.length) {
  md += `\n## ⚠️ Casos que requieren revisión manual (${warnings.length})\n\n`;
  md += `Estos cambios se aplicaron (o se aplicarían) pero deben verificarse visualmente:\n\n`;
  md += `| Archivo | Línea | De | A | Nota |\n|---|---|---|---|---|\n`;
  for (const r of report) {
    for (const c of r.changes.filter((c) => c.note)) {
      md += `| ${r.file} | ${c.line} | \`${c.from}\` | \`${c.to}\` | ${c.note} |\n`;
    }
  }
}

md += `\n## Detalle por archivo\n\n`;
for (const r of report) {
  md += `### ${r.file} (${r.changes.length} cambios)\n\n`;
  md += `| Línea | Grupo | De | A |\n|---|---|---|---|\n`;
  for (const c of r.changes) {
    md += `| ${c.line} | ${c.group} | \`${c.from}\` | \`${c.to}\` |\n`;
  }
  md += "\n";
}

writeFileSync("audit/migrate-report.md", md);

// Consola
console.log(
  `\n${WRITE ? "✅ CAMBIOS APLICADOS" : "📋 SIMULACIÓN (sin cambios)"} — grupo: ${GROUP}`,
);
console.log(`   ${totalChanges} cambios en ${totalFiles} archivos`);
console.log(
  `   Por grupo:`,
  Object.entries(byGroup)
    .map(([g, n]) => `${g}:${n}`)
    .join(" | "),
);
if (warnings.length)
  console.log(`   ⚠️  ${warnings.length} casos requieren revisión manual`);
console.log(`   Reporte: audit/migrate-report.md\n`);
