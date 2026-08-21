/* ============================================================
   格物 GEWU · 插件宿主运行时
   - window.GEWU_PLUGIN：插件注册表（register / mount）
   - GEWU.plugin：宿主 API（theme / ui / file / data / math）
   插件 bundle 契约：调用 GEWU_PLUGIN.register({ id, mount(container, api), unmount? })
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 主题 ---------- */
  const themeListeners = new Set();
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }
  function onThemeChange(fn) {
    themeListeners.add(fn);
    fn(currentTheme());
    return () => themeListeners.delete(fn);
  }
  /* site.js 切换主题后广播 */
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme-btn");
    if (btn) {
      const orig = btn.addEventListener.bind(btn);
      btn.addEventListener("click", () => {
        setTimeout(() => themeListeners.forEach(f => f(currentTheme())), 0);
      });
    }
  });
  new MutationObserver(() => {
    const t = currentTheme();
    themeListeners.forEach(f => f(t));
    document.querySelectorAll("[data-gewu-theme]").forEach(el => el.setAttribute("data-gewu-theme", t));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- 插件 API ---------- */
  const shadowRoots = new Set();
  let themeRoot = null;

  const pluginApi = {
    theme: {
      get: currentTheme,
      subscribe: onThemeChange,
    },
    /* 插件宿主元素：应用的主题应作用于它而不是整个文档 */
    get themeRoot() { return themeRoot; },
    /* 在宿主文档 + 所有插件 shadow root 中查找元素 */
    find(sel) {
      for (const r of shadowRoots) {
        try { const el = r.querySelector(sel); if (el) return el; } catch (e) {}
      }
      try { return document.querySelector(sel); } catch (e) { return null; }
    },
    ui: {
      toast: (msg) => window.GEWU && GEWU.toast(msg),
    },
    file: {
      downloadBlob: (blob, name) => window.GEWU && GEWU.downloadBlob(blob, name),
      downloadText: (text, name, mime) => window.GEWU && GEWU.downloadText(text, name, mime),
      downloadCanvas: (canvas, name, scale) => window.GEWU && GEWU.downloadCanvas(canvas, name, scale),
      copyText: (text) => window.GEWU && GEWU.copyText(text),
      copyRichText: (html, plain) => window.GEWU && GEWU.copyRichText(html, plain),
    },
    data: {
      get(key, ns) {
        try { return JSON.parse(localStorage.getItem(`gewu-plugin:${ns || "default"}:${key}`)); } catch (e) { return null; }
      },
      set(key, val, ns) {
        try { localStorage.setItem(`gewu-plugin:${ns || "default"}:${key}`, JSON.stringify(val)); } catch (e) {}
      },
      remove(key, ns) {
        try { localStorage.removeItem(`gewu-plugin:${ns || "default"}:${key}`); } catch (e) {}
      },
    },
    math: {
      fmtSci: (n, d) => window.GEWU && GEWU.fmtSci(n, d),
      fmtNum: (n, d) => window.GEWU && GEWU.fmtNum(n, d),
      parseCSV: (t) => window.GEWU && GEWU.parseCSV(t),
    },
    url: (path) => window.GEWU_PLUGIN.base + "/" + path,
  };

  /* ---------- 注册表 ---------- */
  const registry = new Map();
  window.GEWU_PLUGIN = {
    base: "",
    register(p) {
      if (!p || !p.id) throw new Error("[gewu-plugin] register 需要 id");
      registry.set(p.id, p);
    },
    get(id) { return registry.get(id); },
    all() { return Array.from(registry.values()); },
    mount(id, container) {
      const p = registry.get(id);
      if (!p) throw new Error("[gewu-plugin] 未注册插件: " + id);
      if (!p.mounted) {
        p.mounted = true;
        p.unmount = p.mount ? p.mount(container, pluginApi) : null;
      }
      return p;
    },
    /* 为插件创建 shadow root（隔离样式），并登记为主题宿主与查找范围 */
    attachShadow(container) {
      themeRoot = container;
      if (!container.shadowRoot) container.attachShadow({ mode: "open" });
      shadowRoots.add(container.shadowRoot);
      container.dataset.theme = currentTheme();
      return container.shadowRoot;
    },
    api: pluginApi,
  };
})();
