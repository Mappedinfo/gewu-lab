#!/usr/bin/env node
/* ============================================================
   格物 GEWU · 插件接入 CLI
   用法：
     node scripts/embed.mjs add <repo> [--id v05-xxx] [--name 名称] [--code V-05] [--cat V]
                       [--en English] [--desc 描述] [--tags a,b,c] [--icon "<svg…>"] [--thumb "<svg…>"]
                       [--sync bundle|copy] [--source-path 仓库内子目录] [--copy-files a,b,c]
     node scripts/embed.mjs update <id>      # 重新拉取 + 构建/拷贝 + 更新版本与 sourceCommit
     node scripts/embed.mjs sync             # 检查全部插件源是否有新提交，有则更新（自动同步入口）
     node scripts/embed.mjs remove <id>
   构建契约：仓库 package.json 提供 build:gewu（输出 dist-gewu/）则用之；
   否则回退 npm run build -- --base=./（输出 dist/）。
   copy 型：无构建，直接按 manifest.files 从源仓库拷贝（用于纯静态工具）。
   ============================================================ */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
function repoSlugOf(repo) {
  return basename(repo.replace(/\.git$/, ""));
}

/* ---------- 源仓库远端 HEAD ---------- */
function defaultBranch(repo) {
  try {
    const out = execSync(
      `curl -s --max-time 20 "https://api.github.com/repos/${repo}"`,
      { encoding: "utf8" }
    );
    const j = JSON.parse(out);
    return j.default_branch || "main";
  } catch (e) {
    return "main";
  }
}

/* bundle 型取仓库 HEAD；copy 型取 sourcePath 目录的最后提交 */
function remoteHead(repo, sourcePath) {
  try {
    if (sourcePath) {
      const q = encodeURIComponent(sourcePath);
      const out = execSync(
        `curl -s --max-time 20 "https://api.github.com/repos/${repo}/commits?path=${q}&per_page=1"`,
        { encoding: "utf8" }
      );
      const arr = JSON.parse(out);
      return Array.isArray(arr) && arr[0] ? arr[0].sha : null;
    }
    const branch = defaultBranch(repo);
    const out = execSync(
      `curl -s --max-time 20 "https://api.github.com/repos/${repo}/commits/${branch}"`,
      { encoding: "utf8" }
    );
    const j = JSON.parse(out);
    return j && j.sha ? j.sha : null;
  } catch (e) {
    return null;
  }
}

/* ---------- 本地缓存 ---------- */
function ensureCache(repo) {
  const repoSlug = repoSlugOf(repo);
  const repoDir = join(workDir, repoSlug);
  if (existsSync(repoDir)) {
    run(`git -C "${repoDir}" pull --ff-only`, { silent: true });
  } else {
    console.log(`[embed] 克隆 ${repo} …`);
    run(`git clone --depth 1 "https://github.com/${repo}.git" "${repoDir}"`, { silent: true });
  }
  return repoDir;
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
  run(`npm run build -- --base=./`, { cwd: repoDir });
  return join(repoDir, "dist");
}

/* ---------- 写入插件目录（bundle：整目录拷贝；copy：按 files 拷贝） ---------- */
function writePluginFiles(manifest, repoDir, commit) {
  const dest = join(pluginsDir, manifest.id);
  if (manifest.sync === "copy") {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    const srcBase = join(repoDir, manifest.sourcePath || "");
    for (const f of manifest.files || []) {
      const src = join(srcBase, f);
      if (!existsSync(src)) {
        console.error(`[embed] 源文件不存在: ${src}`);
        process.exit(1);
      }
      const to = join(dest, f);
      mkdirSync(dirname(to), { recursive: true });
      cpSync(src, to);
    }
  } else {
    const dist = buildProject(repoDir);
    if (!existsSync(dist)) {
      console.error("[embed] 构建产物目录不存在: " + dist);
      process.exit(1);
    }
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    cpSync(dist, dest, { recursive: true });
    rmSync(join(dest, "gewu.plugin.json"), { force: true });
  }
}

function finishPlugin(id, manifest, commit) {
  manifest.sourceCommit = commit;
  if (manifest.sync !== "copy") {
    const repoDir = join(workDir, repoSlugOf(manifest.repo));
    const pkg = existsSync(join(repoDir, "package.json")) ? readJson(join(repoDir, "package.json")) : {};
    manifest.version = pkg.version || fmtTime();
  } else {
    manifest.version = commit ? commit.slice(0, 7) : fmtTime();
  }
  writeFileSync(manifestPath(id), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`[embed] ✅ 已更新 ${id} → v${manifest.version} @ ${String(commit).slice(0, 7)}`);
}

/* ---------- add ---------- */
function add() {
  const repo = args._[1];
  if (!repo) return usage();
  const repoDir = ensureCache(repo);

  const id = args.id || slug(repoSlugOf(repo));
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    console.error(`[embed] 非法 id: ${id}`);
    process.exit(1);
  }

  const existing = existsSync(manifestPath(id)) ? readJson(manifestPath(id)) : {};
  const isCopy = (args.sync || existing.sync || "bundle") === "copy";
  const manifest = {
    id,
    code: args.code || existing.code || "X-XX",
    cat: args.cat || existing.cat || "V",
    name: args.name || existing.name || slug(repoSlugOf(repo)),
    en: args.en || existing.en || "",
    desc: args.desc || existing.desc || "由 scripts/embed.mjs 接入的插件。",
    tags: args.tags ? args.tags.split(",").map(s => s.trim()).filter(Boolean) : (existing.tags || []),
    icon: args.icon !== undefined ? args.icon : (existing.icon || ""),
    thumb: args.thumb !== undefined ? args.thumb : (existing.thumb || ""),
    sync: isCopy ? "copy" : "bundle",
    ...(isCopy ? {
      sourcePath: args["source-path"] || existing.sourcePath || "",
      files: args["copy-files"] ? args["copy-files"].split(",").map(s => s.trim()).filter(Boolean) : (existing.files || []),
      entry: { type: "iframe", src: "index.html" },
    } : {
      entry: existing.entry || { type: "bundle", entry: "gewu-plugin.js" },
    }),
    version: fmtTime(),
    repo,
  };

  const commit = remoteHead(repo, isCopy ? manifest.sourcePath : null);
  writePluginFiles(manifest, repoDir, commit);
  manifest.version = isCopy ? String(commit || "?").slice(0, 7) : readJson(join(repoDir, "package.json")).version || fmtTime();
  manifest.sourceCommit = commit || "";
  writeFileSync(manifestPath(id), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`\n[embed] ✅ 已接入 ${id} → plugins/${id}/`);
  console.log(`  请检查 plugins/${id}/gewu.plugin.json（code/name/desc/icon/thumb 如需调整）`);
  console.log("  若构建产物入口不是 gewu-plugin.js，请改 entry.entry");
  runCatalog();
}

/* ---------- update（供 update 命令与 sync 复用） ---------- */
function updatePlugin(manifest, commit) {
  const repoDir = ensureCache(manifest.repo);
  writePluginFiles(manifest, repoDir, commit);
  finishPlugin(manifest.id, manifest, commit);
}

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
  const commit = remoteHead(manifest.repo, manifest.sync === "copy" ? manifest.sourcePath : null);
  updatePlugin(manifest, commit);
  runCatalog();
}

/* ---------- sync：检查全部插件，有更新才重建 ---------- */
function sync() {
  if (!existsSync(pluginsDir)) { console.log("[embed] 无插件"); return; }
  const ids = readdirSync(pluginsDir);
  let changed = 0, upToDate = 0, skipped = 0;
  for (const id of ids) {
    const mf = manifestPath(id);
    if (!existsSync(mf)) continue;
    const manifest = readJson(mf);
    if (!manifest.repo) { console.log(`  · ${id}: 无 repo 字段，跳过`); skipped++; continue; }
    const commit = remoteHead(manifest.repo, manifest.sync === "copy" ? manifest.sourcePath : null);
    if (!commit) { console.log(`  · ${id}: 无法获取远端 HEAD（网络/限流），跳过`); skipped++; continue; }
    if (!manifest.sourceCommit) {
      console.log(`  · ${id}: 缺 sourceCommit，执行首次同步`);
      updatePlugin(manifest, commit);
      changed++;
    } else if (commit !== manifest.sourceCommit) {
      console.log(`  · ${id}: 源更新 ${manifest.sourceCommit.slice(0, 7)} → ${commit.slice(0, 7)}，重建`);
      updatePlugin(manifest, commit);
      changed++;
    } else {
      console.log(`  · ${id}: 已是最新 @ ${commit.slice(0, 7)}`);
      upToDate++;
    }
  }
  console.log(`\n[embed] sync 完成：更新 ${changed} · 最新 ${upToDate} · 跳过 ${skipped}`);
  if (changed) runCatalog();
  process.exit(0);
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
                       [--sync bundle|copy] [--source-path 子目录] [--copy-files a,b,c]
  node scripts/embed.mjs update <id>
  node scripts/embed.mjs sync
  node scripts/embed.mjs remove <id>
环境变量：GEWU_EMBED_CACHE（仓库缓存目录）GEWU_NPM_CACHE（npm 缓存）`);
}

switch (cmd) {
  case "add": add(); break;
  case "update": update(); break;
  case "sync": sync(); break;
  case "remove": remove(); break;
  default: usage();
}
