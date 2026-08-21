/* R-05 随机化设计：种子随机数 / 抽样 / 均衡分组 */
(function () {
  "use strict";
  const $ = GEWU.$;

  /* mulberry32：种子伪随机 */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  let mode = "num";
  let lastResult = { text: "", csv: null };

  document.querySelectorAll(".mode-btn").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    mode = b.dataset.mode;
    $("#pane-num").style.display = mode === "num" ? "" : "none";
    $("#pane-sample").style.display = mode === "sample" ? "" : "none";
    $("#pane-group").style.display = mode === "group" ? "" : "none";
  }));

  $("#roll-seed").addEventListener("click", () => {
    $("#seed").value = Math.floor(Math.random() * 1e9).toString();
  });

  /* ---------- 三种模式 ---------- */
  function runNum(rand) {
    const n = Math.min(500, Math.max(1, +$("#n-num").value || 1));
    const min = +$("#n-min").value, max = +$("#n-max").value;
    const dec = Math.min(10, Math.max(0, +$("#n-dec").value || 0));
    const out = [];
    for (let i = 0; i < n; i++) {
      const v = min + rand() * (max - min);
      out.push(dec === 0 ? String(Math.round(v)) : v.toFixed(dec));
    }
    return { text: out.join("\n"), csv: null };
  }

  function parseList(text) {
    return text.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
  }

  function runSample(rand, list) {
    const n = Math.min(list.length, Math.max(1, +$("#s-n").value || 1));
    const pool = list.slice();
    const picked = [];
    for (let i = 0; i < n && pool.length; i++) {
      const idx = Math.floor(rand() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return { text: picked.join("\n"), csv: null };
  }

  function runGroup(rand, list) {
    const modeG = $("#g-mode").value;
    const gn = Math.max(1, +$("#g-n").value || 1);
    const nGroup = modeG === "count"
      ? Math.min(list.length, gn)
      : Math.max(1, Math.ceil(list.length / gn));
    const order = list.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const groups = Array.from({ length: nGroup }, () => []);
    order.forEach((item, i) => groups[i % nGroup].push(item));
    const rows = [];
    const html = groups.map((g, gi) => {
      g.forEach(m => rows.push([m, "组" + (gi + 1)]));
      return `<div style="margin-bottom:8px">
        <span class="chip ${gi % 2 ? "blue" : "accent"}">组 ${gi + 1} · ${g.length} 人</span>
        <div style="font-size:.85rem;color:var(--ink-2);margin-top:4px">${g.map(GEWU.esc).join(" · ")}</div>
      </div>`;
    }).join("");
    const csv = "name,group\n" + rows.map(r => `${r[0]},${r[1]}`).join("\n");
    return { text: html, csv, isHtml: true };
  }

  /* ---------- 执行 ---------- */
  $("#run").addEventListener("click", () => {
    const seedText = $("#seed").value || "42";
    const rand = mulberry32(hashSeed(seedText));
    let res;
    if (mode === "num") {
      res = runNum(rand);
    } else {
      const list = parseList(mode === "sample" ? $("#s-list").value : $("#g-list").value);
      if (!list.length) { GEWU.toast("请先输入名单"); return; }
      res = mode === "sample" ? runSample(rand, list) : runGroup(rand, list);
    }
    lastResult = res;
    const out = $("#out");
    out.innerHTML = res.isHtml
      ? res.text
      : `<pre style="margin:0;font-family:var(--font-mono);font-size:.88rem;white-space:pre-wrap">${GEWU.esc(res.text)}</pre>`;
    out.insertAdjacentHTML("beforeend",
      `<div class="muted mono" style="font-size:.72rem;margin-top:10px;border-top:1px dashed var(--line);padding-top:8px">seed = ${GEWU.esc(seedText)} · 同种子可复现</div>`);
    $("#dl-csv").style.display = res.csv ? "" : "none";
  });

  $("#copy-out").addEventListener("click", () => {
    if (!lastResult.text) return GEWU.toast("先执行随机化");
    GEWU.copyText(lastResult.isHtml ? lastResult.text.replace(/<[^>]+>/g, "") : lastResult.text);
  });
  $("#dl-csv").addEventListener("click", () => {
    if (lastResult.csv) GEWU.downloadText(lastResult.csv, "groups.csv", "text/csv");
  });

  renderRelated($("#related"), ["R-04", "V-03", "R-02"]);
})();
