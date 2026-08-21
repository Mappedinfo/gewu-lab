#!/usr/bin/env node
/* ============================================================
   格物 GEWU · 插件接入 CLI
   用法：
     node scripts/embed.mjs add <repo> [--id v05-xxx] [--name 名称] [--code V-05] [--cat V]
                       [--en English] [--desc 描述] [--tags a,b,c] [--icon "<svg…>"] [--thumb "<svg…>"]
     node scripts/embed.mjs update <id>      # 重新拉取 + 构建 + 更新版本
     node scripts/embed.mjs remove <id>
   构建契约：仓库 package.json 提供 build:gewu（输出 dist-gewu/）则用之；
   否则回退 npm run build -- --base=./（输出 dist/）。
   ============================================================ */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginsDir = join(root, "plugins");
const workDir = process.env.GEWU_EMBED_CACHE || "/tmp/gewu-embed";
const npmCache = process.env.GEWU_NPM_CACHE || "/tmp/npm-cache-gewu";
mkdirSync(pluginsDir, { recursive: true });
mkdirSync(workDir, { recursive: true });

/* ---------- 参数 ---------- */
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      args[k] = argv[++i];
    } else args._.push(a);
  }
  return args;
}
const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];

/* ---------- 工具函数 ---------- */
const run = (c, opts = {}) => execSync(c, { stdio: opts.silent ? "pipe" : "inherit", ...opts });
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const fmtTime = () => new Date().toISOString().slice(0, 10);

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function manifestPath(id) {
  return join(pluginsDir, id, "gewu.plugin.json");
}

/* ---------- 构建 ---------- */
function buildProject(repoDir) {
  const pkg = existsSync(join(repoDir, "package.json")) ? readJson(join(repoDir, "package.json")) : {};
  if (!existsSync(join(repoDir, "node_modules"))) {
    console.log("[embed] npm install …");
    run(`npm install --no-audit --no-fund --cache "${npmCache}"`, { cwd: repoDir });
  }
  if (pkg.scripts && pkg.scripts["build:gewu"]) {
    console.log("[embed] npm run build:gewu …");
    run("npm run build:gewu", { cwd: repoDir });
    return join(repoDir, "dist-gewu");
  }
  console.log("[embed] 未提供 build:gewu，回退 vite build --base=./ …");
  const script = pkg.scripts && pkg.scripts.build ? pkg.scripts.build : "vite build";
  run(`npm run build -- --base=./`, { cwd: repoDir });
  return join(repoDir, "dist");
}

/* ---------- add ---------- */
function add() {
  const repo = args._[1];
  if (!repo) return usage();
  const repoSlug = basename(repo.replace(/\.git$/, ""));
  const repoDir = join(workDir, repoSlug);

  if (existsSync(repoDir)) {
    console.log("[embed] 拉取最新 …");
    run(`git -C "${repoDir}" pull --ff-only`, { silent: true });
  } else {
    console.log(`[embed] 克隆 ${repo} …`);
    run(`git clone --depth 1 "https://github.com/${repo}.git" "${repoDir}"`, { silent: true });
  }

  const id = args.id || slug(repoSlug);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    console.error(`[embed] 非法 id: ${id}`);
    process.exit(1);
  }
  const pkg = readJson(join(repoDir, "package.json"));
  const dist = buildProject(repoDir);
  if (!existsSync(dist)) {
    console.error("[embed] 构建产物目录不存在: " + dist);
    process.exit(1);
  }

  const dest = join(pluginsDir, id);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(dist, dest, { recursive: true });
  /* 清理可能混入的 manifest */
  rmSync(join(dest, "gewu.plugin.json"), { force: true });

  const existing = existsSync(manifestPath(id)) ? readJson(manifestPath(id)) : {};
  const manifest = {
    id,
    code: args.code || existing.code || "X-XX",
    cat: args.cat || existing.cat || "V",
    name: args.name || existing.name || repoSlug,
    en: args.en || existing.en || "",
    desc: args.desc || existing.desc || "由 scripts/embed.mjs 接入的插件。",
    tags: args.tags ? args.tags.split(",").map(s => s.trim()).filter(Boolean) : (existing.tags || []),
    icon: args.icon !== undefined ? args.icon : (existing.icon || ""),
    thumb: args.thumb !== undefined ? args.thumb : (existing.thumb || ""),
    entry: existing.entry || { type: "bundle", entry: "gewu-plugin.js" },
    version: pkg.version || fmtTime(),
    repo,
  };
  writeFileSync(manifestPath(id), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`\n[embed] ✅ 已接入 ${id} → plugins/${id}/`);
  console.log(`  请检查 plugins/${id}/gewu.plugin.json（code/name/desc/icon/thumb 如需调整）`);
  console.log("  若构建产物入口不是 gewu-plugin.js，请改 entry.entry");
  runCatalog();
}

/* ---------- update ---------- */
function update() {
  const id = args._[1];
  if (!id) return usage();
  const mf = manifestPath(id);
  if (!existsSync(mf)) {
    console.error(`[embed] 插件不存在: ${id}`);
    process.exit(1);
  }
  const manifest = readJson(mf);
  if (!manifest.repo) {
    console.error("[embed] manifest 缺少 repo 字段，无法更新");
    process.exit(1);
  }
  const repoSlug = basename(manifest.repo.replace(/\.git$/, ""));
  const repoDir = join(workDir, repoSlug);
  if (!existsSync(repoDir)) {
    console.error(`[embed] 本地缓存不存在，请先 add：${repoDir}`);
    process.exit(1);
  }
  run(`git -C "${repoDir}" pull --ff-only`, { silent: true });
  const pkg = readJson(join(repoDir, "package.json"));
  const dist = buildProject(repoDir);

  const dest = join(pluginsDir, id);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(dist, dest, { recursive: true });
  rmSync(join(dest, "gewu.plugin.json"), { force: true });

  manifest.version = pkg.version || fmtTime();
  writeFileSync(mf, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`[embed] ✅ 已更新 ${id} → v${manifest.version}`);
  runCatalog();
}

/* ---------- remove ---------- */
function remove() {
  const id = args._[1];
  if (!id) return usage();
  rmSync(join(pluginsDir, id), { recursive: true, force: true });
  console.log(`[embed] 已移除 ${id}`);
  runCatalog();
}

function runCatalog() {
  run(`node "${join(root, "scripts/gen-catalog.mjs")}"`);
}

function usage() {
  console.log(`用法：
  node scripts/embed.mjs add <org/repo> [--id xxx] [--name 名称] [--code V-05] [--cat V] [--desc …] [--tags a,b,c]
  node scripts/embed.mjs update <id>
  node scripts/embed.mjs remove <id>
环境变量：GEWU_EMBED_CACHE（仓库缓存目录）GEWU_NPM_CACHE（npm 缓存）`);
}

switch (cmd) {
  case "add": add(); break;
  case "update": update(); break;
  case "remove": remove(); break;
  default: usage();
}
