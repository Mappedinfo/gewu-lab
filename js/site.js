/* ============================================================
   格物 GEWU · 站点公共脚本
   - 注入页头 / 页脚（纯前端，无后端）
   - 明暗主题切换
   - 滚动浮现动效
   - 通用工具函数（导出/复制/提示）
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 工具函数 ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
  }

  function downloadText(text, filename, mime) {
    downloadBlob(new Blob([text], { type: mime || "text/plain;charset=utf-8" }), filename);
  }

  function downloadCanvas(canvas, filename, scale) {
    const s = scale || 2;
    const out = document.createElement("canvas");
    out.width = canvas.width * s; out.height = canvas.height * s;
    const ctx = out.getContext("2d");
    ctx.scale(s, s);
    ctx.drawImage(canvas, 0, 0);
    out.toBlob(b => downloadBlob(b, filename), "image/png");
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制到剪贴板");
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove();
      if (ok) toast("已复制到剪贴板");
      return ok;
    }
  }

  async function copyRichText(html, plain) {
    try {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      toast("已复制富文本（含格式）");
      return true;
    } catch (e) {
      /* 降级：隐藏选区复制 */
      const div = document.createElement("div");
      div.innerHTML = html;
      div.style.cssText = "position:fixed;left:-9999px;top:0;width:800px";
      document.body.appendChild(div);
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(div);
      sel.removeAllRanges(); sel.addRange(range);
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (_) {}
      sel.removeAllRanges();
      div.remove();
      if (ok) toast("已复制富文本（含格式）"); else toast("复制失败，请改用 HTML 源码");
      return ok;
    }
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* 科学计数法格式化 */
  function fmtSci(n, digits) {
    const d = digits || 4;
    if (!isFinite(n)) return String(n);
    if (n === 0) return "0";
    const a = Math.abs(n);
    if ((a >= 1e-4 && a < 1e6) || Number.isInteger(n)) {
      return String(parseFloat(n.toPrecision(d)));
    }
    const e = Math.floor(Math.log10(a));
    const m = n / Math.pow(10, e);
    return parseFloat(m.toPrecision(d)) + "×10^" + e;
  }

  function fmtNum(n, digits) {
    if (!isFinite(n)) return String(n);
    return parseFloat(n.toPrecision(digits === undefined ? 6 : digits)).toString();
  }

  /* 解析 CSV（自动探测分隔符，支持引号） */
  function parseCSV(text) {
    if (!text.trim()) return { rows: [], sep: "," };
    let sep = ",";
    const first = text.split(/\r?\n/).find(l => l.trim());
    for (const s of [",", "\t", ";", "|"]) {
      if (first.split(s).length > 1) { sep = s; break; }
    }
    const rows = [];
    let row = [], field = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += c;
      } else if (c === '"') inQ = true;
      else if (c === sep) { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some(f => f.trim() !== "")) rows.push(row);
        row = [];
      } else field += c;
    }
    row.push(field);
    if (row.some(f => f.trim() !== "")) rows.push(row);
    return { rows, sep };
  }

  /* ---------- 主题 ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("gewu-theme", t); } catch (_) {}
    const btn = $("#theme-btn");
    if (btn) btn.textContent = t === "dark" ? "☀" : "☾";
  }
  function initTheme() {
    let t = "light";
    try { t = localStorage.getItem("gewu-theme") || "light"; } catch (_) {}
    applyTheme(t);
    const btn = $("#theme-btn");
    if (btn) btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }

  /* ---------- 页头 / 页脚 ---------- */
  const CAT_LINKS = {
    R: { name: "研 · 科研", items: ["R-01", "R-02", "R-03", "R-04", "R-05"] },
    V: { name: "视 · 可视化", items: ["V-01", "V-02", "V-03", "V-04"] },
    K: { name: "传 · 知识传播", items: ["K-01", "K-02", "K-03", "K-04", "K-05"] },
  };

  function headerHTML(active) {
    return `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="index.html" aria-label="格物首页">
          <span class="brand-seal">格</span>
          <span>
            <span class="brand-name">格物</span>
            <span class="brand-tag">GEWU · SCI TOOLKIT</span>
          </span>
        </a>
        <nav class="main-nav">
          <a href="index.html" class="${active === "home" ? "active" : ""}">首页</a>
          <a href="index.html#cat-R" class="${active === "R" ? "active" : ""}">研 · 科研</a>
          <a href="index.html#cat-V" class="${active === "V" ? "active" : ""}">视 · 可视化</a>
          <a href="index.html#cat-K" class="${active === "K" ? "active" : ""}">传 · 知识传播</a>
          <a href="about.html" class="${active === "about" ? "active" : ""}">关于</a>
        </nav>
        <div class="header-side">
          <span class="chip" title="纯前端 · 数据不出浏览器">本地运行</span>
          <button id="theme-btn" class="theme-toggle" aria-label="切换明暗主题">☾</button>
        </div>
      </div>
    </header>`;
  }

  function footerHTML() {
    const catLinks = Object.values(CAT_LINKS).map(c => `
      <div>
        <h4>${c.name}</h4>
        <div class="footer-links">
          ${c.items.map(code => {
            const t = GEWU_BY_CODE[code];
            return t ? `<a href="${t.href}">${t.code} · ${t.name}</a>` : "";
          }).join("")}
        </div>
      </div>`).join("");
    return `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <div class="brand" style="margin-bottom:10px">
            <span class="brand-seal">格</span>
            <span>
              <span class="brand-name">格物</span>
              <span class="brand-tag">GEWU · SCI TOOLKIT</span>
            </span>
          </div>
          <p style="font-size:.88rem;color:var(--ink-2);margin:0 0 4px">格物致知 · 科研、可视化与知识传播的纯前端工具集。</p>
          <p style="font-size:.82rem;color:var(--ink-3);margin:0">全部工具在浏览器本地运行，文件不上传、无账号、无追踪。</p>
          <div class="footer-chips">
            <span class="chip accent">100% 本地处理</span>
            <span class="chip blue">无账号</span>
            <span class="chip green">无留言 · 无广告</span>
          </div>
        </div>
        <div>
          <h4>三大主题</h4>
          <div class="footer-links">
            <a href="index.html#cat-R">研 · 科研（5 件）</a>
            <a href="index.html#cat-V">视 · 可视化（4 件）</a>
            <a href="index.html#cat-K">传 · 知识传播（5 件）</a>
            <a href="about.html">关于格物</a>
            <a href="index.html#workflow">科研工作流</a>
            <a href="index.html#principles">设计原则</a>
          </div>
        </div>
        ${catLinks}
      </div>
      <div class="footer-bottom">
        © 2026 格物 GEWU <span>·</span> 纯前端静态站点，可离线运行
        <span>·</span> 未使用任何分析 / 广告脚本
      </div>
    </footer>`;
  }

  /* ---------- 滚动浮现 ---------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
  }

  /* ---------- 初始化 ---------- */
  window.GEWU = { $, $$, toast, downloadBlob, downloadText, downloadCanvas, copyText, copyRichText, esc, fmtSci, fmtNum, parseCSV };

  document.addEventListener("DOMContentLoaded", () => {
    const active = document.body.getAttribute("data-page") || "home";
    const h = document.getElementById("site-header");
    const f = document.getElementById("site-footer");
    if (h) h.outerHTML = headerHTML(active);
    if (f) f.outerHTML = footerHTML();
    initTheme();
    initReveal();
  });
})();
