/* ============================================================
   格物 GEWU · 插件加载器
   用法：tools/tool.html?id=<plugin-id>
   流程：读 plugins/<id>/gewu.plugin.json → 渲染工具壳 → 挂载插件
   ============================================================ */
(function () {
  "use strict";
  const $ = GEWU.$;

  function getPluginId() {
    const q = new URLSearchParams(location.search);
    return q.get("id") || document.currentScript?.dataset.plugin || "";
  }

  /* 站点根：由 loader 脚本自身路径推导（js/loader.js → 根） */
  const siteBase = (function () {
    const src = document.currentScript?.src || "";
    const m = src.match(/^(.*)\/js\/loader\.js(\?.*)?$/);
    return m ? m[1] : "";
  })();
  const pluginBase = (id) => `${siteBase}/plugins/${id}`;

  async function load() {
    const id = getPluginId();
    if (!id) {
      document.body.innerHTML = '<div class="wrap" style="padding:60px 24px"><p class="muted mono">缺少插件 id：tools/tool.html?id=xxx</p></div>';
      return;
    }
    let manifest;
    try {
      const res = await fetch(`${pluginBase(id)}/gewu.plugin.json`);
      manifest = await res.json();
    } catch (e) {
      document.body.innerHTML = `<div class="wrap" style="padding:60px 24px"><p style="color:var(--accent)">插件 ${id} 未找到：${GEWU.esc(e.message)}</p></div>`;
      return;
    }
    if (!manifest.id) manifest.id = id;
    GEWU_PLUGIN.base = pluginBase(manifest.id);

    const cat = GEWU_CATS[manifest.cat];
    document.title = `${manifest.name} ${manifest.code} · 格物 GEWU`;
    document.body.setAttribute("data-page", manifest.cat);

    /* 相关工具：同主题其余条目 */
    const relatedCodes = GEWU_CATALOG
      .filter(t => t.cat === manifest.cat && t.code !== manifest.code)
      .slice(0, 4)
      .map(t => t.code);

    const main = document.querySelector("main") || document.body;
    main.innerHTML = `
    <main class="tool-wrap">
      <nav class="crumbs"><a href="index.html">格物</a> / <a href="index.html#cat-${manifest.cat}">${cat.name}</a> / <span>${manifest.code} ${GEWU.esc(manifest.name)}</span></nav>
      <section class="tool-head">
        <div>
          <h1>${GEWU.esc(manifest.name)}</h1>
          <div class="en">${GEWU.esc(manifest.en || "")}</div>
          <p class="desc">${GEWU.esc(manifest.desc || "")}</p>
        </div>
        <div class="meta">
          <span class="chip ${cat.cls}">${manifest.code} · ${cat.key}</span>
          ${manifest.version ? `<span class="chip">插件 v${GEWU.esc(manifest.version)}</span>` : ""}
          ${manifest.repo ? `<a class="chip" href="https://${GEWU.esc(manifest.repo)}" target="_blank" rel="noopener">源码 ↗</a>` : ""}
        </div>
      </section>
      <section class="tool-body">
        <div id="plugin-mount"></div>
      </section>
      <section class="tool-foot">
        <h2>同主题工具</h2>
        <div class="related-grid" id="related"></div>
      </section>
    </main>`;

    if (typeof renderRelated === "function") renderRelated($("#related"), relatedCodes);

    const mountEl = $("#plugin-mount");
    mountEl.setAttribute("data-gewu-theme", GEWU_PLUGIN.api.theme.get());

    const entry = manifest.entry || {};
    if (entry.type === "iframe") {
      const iframe = document.createElement("iframe");
      iframe.src = entry.src;
      iframe.style.cssText = "width:100%;min-height:70vh;border:1px solid var(--line);border-radius:8px;background:var(--surface)";
      mountEl.appendChild(iframe);
      return;
    }
    if (entry.type === "vanilla") {
      const res = await fetch(`${pluginBase(id)}/${entry.entry}`);
      mountEl.innerHTML = await res.text();
      return;
    }
    /* bundle：动态注入模块脚本，加载完成后挂载 */
    const script = document.createElement("script");
    script.type = "module";
    script.src = `${pluginBase(id)}/${entry.entry}`;
    script.onload = () => {
      try {
        GEWU_PLUGIN.mount(id, mountEl);
      } catch (e) {
        mountEl.innerHTML = `<p style="color:var(--accent)">插件挂载失败：${GEWU.esc(e.message)}</p>`;
        console.error(e);
      }
    };
    script.onerror = () => {
      mountEl.innerHTML = `<p style="color:var(--accent)">插件脚本加载失败：${entry.entry}</p>`;
    };
    document.head.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", load);
})();
