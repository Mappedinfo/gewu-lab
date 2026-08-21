/* 格物 · 首页脚本：统计、工作流、目录渲染与筛选 */
(function () {
  "use strict";
  const $ = GEWU.$;

  /* ---------- 统计 ---------- */
  (function heroStats() {
    const counts = { R: 0, V: 0, K: 0 };
    GEWU_CATALOG.forEach(t => counts[t.cat]++);
    const total = GEWU_CATALOG.length;
    document.getElementById("plate-count-R").textContent = counts.R + " 件";
    document.getElementById("plate-count-V").textContent = counts.V + " 件";
    document.getElementById("plate-count-K").textContent = counts.K + " 件";
    document.getElementById("hero-stats").innerHTML = [
      `<div class="hero-stat"><div class="n">${total}<em> 件</em></div><div class="l">纯前端工具</div></div>`,
      `<div class="hero-stat"><div class="n">3<em> 大</em></div><div class="l">研 · 视 · 传主题</div></div>`,
      `<div class="hero-stat"><div class="n">0<em> 次</em></div><div class="l">文件上传</div></div>`,
      `<div class="hero-stat"><div class="n">0<em> 个</em></div><div class="l">账号 / 留言</div></div>`,
    ].join("");
  })();

  /* ---------- 工作流 ---------- */
  (function flow() {
    document.getElementById("flow").innerHTML = GEWU_FLOW.map(s => `
      <div class="flow-step">
        <div class="no">NO.${s.no}</div>
        <div class="nm">${s.nm}</div>
        <div class="tl">${s.tl}</div>
        <div class="links">${s.links.map(c => {
          const t = GEWU_BY_CODE[c];
          return t ? `<a href="${t.href}" title="${t.name}">${t.code}</a>` : "";
        }).join("")}</div>
      </div>`).join("");
  })();

  /* ---------- 目录渲染 ---------- */
  const catMeta = {
    R: { name: "研 · 科研", cls: "accent", sub: "阅读、记录、写作与实验设计的日常科研工具" },
    V: { name: "视 · 可视化", cls: "blue", sub: "把数据、函数与分布画出来，让规律可见" },
    K: { name: "传 · 知识传播", cls: "green", sub: "把知识整理成可分享、可传播的形式" },
  };

  function cardHTML(t) {
    return `
    <a class="tool-card" data-cat="${t.cat}" data-name="${t.name}" data-key="${t.code}" data-tags="${t.tags.join(" ")}" href="${t.href}">
      <div class="thumb">${t.thumb}</div>
      <div class="card-top">
        <span class="chip ${catMeta[t.cat].cls}">${t.code}</span>
        <span class="code-badge">${catMeta[t.cat].name}</span>
      </div>
      <h3>${t.name}</h3>
      <p class="desc">${t.desc}</p>
      <div class="tags">${t.tags.map(g => `<span class="chip">${g}</span>`).join("")}</div>
      <span class="go">打开工具 →</span>
    </a>`;
  }

  function renderCatalog() {
    const el = document.getElementById("catalog");
    el.innerHTML = Object.keys(catMeta).map(k => `
      <div class="section" id="cat-${k}" style="padding-top:8px">
        <div class="section-head" style="margin-bottom:14px">
          <span class="kicker">${k} / ${GEWU_CATS[k].name}</span>
          <h2 style="font-size:1.3rem">${catMeta[k].name}</h2>
          <p class="sub">${catMeta[k].sub}</p>
        </div>
        <div class="tool-grid" data-grid="${k}">
          ${GEWU_CATALOG.filter(t => t.cat === k).map(cardHTML).join("")}
        </div>
      </div>`).join("");
  }
  renderCatalog();

  /* ---------- 筛选 ---------- */
  let fCat = "all", q = "";
  const countEl = document.getElementById("result-count");

  function applyFilter() {
    let shown = 0;
    document.querySelectorAll(".tool-card").forEach(card => {
      const hitCat = fCat === "all" || card.dataset.cat === fCat;
      const hay = (card.dataset.name + " " + card.dataset.key + " " + card.dataset.tags).toLowerCase();
      const hitQ = !q || hay.includes(q);
      const show = hitCat && hitQ;
      card.style.display = show ? "" : "none";
      if (show) shown++;
    });
    /* 隐藏空主题块 */
    ["R", "V", "K"].forEach(k => {
      const sec = document.getElementById("cat-" + k);
      if (!sec) return;
      const visible = sec.querySelectorAll('.tool-card[style*="display: none"]').length <
                      sec.querySelectorAll(".tool-card").length;
      const inCat = fCat === "all" || fCat === k;
      sec.style.display = (visible && inCat) ? "" : "none";
    });
    countEl.textContent = "命中 " + shown + " / " + GEWU_CATALOG.length + " 件";
  }

  document.querySelectorAll(".fchip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".fchip").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      fCat = btn.dataset.f;
      applyFilter();
    });
  });

  const search = document.getElementById("search");
  search.addEventListener("input", () => {
    q = search.value.trim().toLowerCase();
    applyFilter();
  });
  applyFilter();
})();
