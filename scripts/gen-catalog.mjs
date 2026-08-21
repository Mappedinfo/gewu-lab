#!/usr/bin/env node
/* ============================================================
   格物 GEWU · 目录生成器
   扫描 plugins 目录下各插件的 gewu.plugin.json → 生成 js/catalog.plugins.js
   用法：node scripts/gen-catalog.mjs
   ============================================================ */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginsDir = join(root, "plugins");

function slugOk(id) {
  return /^[a-z0-9][a-z0-9-]*$/.test(id);
}

function loadManifests() {
  const out = [];
  if (!existsSync(pluginsDir)) return out;
  for (const d of readdirSync(pluginsDir)) {
    const mf = join(pluginsDir, d, "gewu.plugin.json");
    if (!existsSync(mf)) continue;
    try {
      const m = JSON.parse(readFileSync(mf, "utf8"));
      if (!slugOk(m.id)) {
        console.warn(`[gen-catalog] 跳过非法 id: ${d}`);
        continue;
      }
      out.push(m);
    } catch (e) {
      console.warn(`[gen-catalog] 解析失败 ${mf}: ${e.message}`);
    }
  }
  out.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  return out;
}

function toCatalogEntry(m) {
  return {
    code: m.code,
    cat: m.cat,
    name: m.name,
    en: m.en || "",
    href: `tools/tool.html?id=${m.id}`,
    desc: m.desc || "",
    tags: m.tags || [],
    icon: m.icon || "",
    thumb: m.thumb || "",
    plugin: true,
    version: m.version || "",
    repo: m.repo || "",
  };
}

const manifests = loadManifests();
const entries = manifests.map(toCatalogEntry);
const js = `/* ============================================================
   格物 GEWU · 插件目录（由 scripts/gen-catalog.mjs 自动生成）
   数据源：plugins 目录下各插件的 gewu.plugin.json —— 请勿手工编辑
   重新生成：node scripts/gen-catalog.mjs
   ============================================================ */
const GEWU_PLUGINS = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync(join(root, "js/catalog.plugins.js"), js, "utf8");
console.log(`[gen-catalog] 已生成 js/catalog.plugins.js（${entries.length} 个插件）`);
for (const m of manifests) {
  console.log(`  · ${m.code} ${m.name} (${m.id}) v${m.version || "?"}`);
}
