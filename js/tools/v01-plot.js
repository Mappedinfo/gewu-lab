/* V-01 函数绘图仪：多函数曲线 / 平移缩放 / SVG+PNG 导出 */
(function () {
  "use strict";
  const $ = GEWU.$;
  const canvas = $("#plot");
  const ctx = canvas.getContext("2d");

  const PALETTE = ["#C03A22", "#25548F", "#3B6B4E", "#B07A1F"];
  const FONT = '10px "JetBrains Mono", monospace';

  const state = {
    fns: [
      { expr: "sin(x)", color: PALETTE[0], on: true },
      { expr: "x^2/10", color: PALETTE[1], on: true },
    ],
    xmin: -6, xmax: 6, ymin: null, ymax: null,
    points: [],   /* 每函数采样点 */
  };

  /* ---------- 表达式编译 ---------- */
  function compile(expr) {
    let e = String(expr)
      .replace(/\^/g, "**")
      .replace(/\blog\b/g, "Math.log10")
      .replace(/\bln\b/g, "Math.log")
      .replace(/\blg\b/g, "Math.log10")
      .replace(/\bsin\b/g, "Math.sin").replace(/\bcos\b/g, "Math.cos")
      .replace(/\btan\b/g, "Math.tan").replace(/\basin\b/g, "Math.asin")
      .replace(/\bacos\b/g, "Math.acos").replace(/\batan\b/g, "Math.atan")
      .replace(/\bsqrt\b/g, "Math.sqrt").replace(/\babs\b/g, "Math.abs")
      .replace(/\bexp\b/g, "Math.exp").replace(/\bfloor\b/g, "Math.floor")
      .replace(/\bceil\b/g, "Math.ceil").replace(/\bPI\b/g, "PI").replace(/\bpi\b/g, "PI");
    try {
      const f = new Function("x", `"use strict"; const PI=Math.PI, E=Math.E; return (${e})`);
      /* 冒烟测试 */
      f(0.5);
      return f;
    } catch (err) {
      return null;
    }
  }

  /* ---------- 采样（JS 侧，供 canvas 与 SVG 共用） ---------- */
  function sample() {
    state.points = [];
    const N = 480;
    state.fns.forEach((fn, i) => {
      const f = compile(fn.expr);
      const pts = [];
      if (!f) { state.points.push(null); return; }
      for (let k = 0; k <= N; k++) {
        const x = state.xmin + (state.xmax - state.xmin) * k / N;
        let y;
        try { y = f(x); } catch (e) { y = NaN; }
        pts.push([x, y]);
      }
      state.points.push(pts);
    });
  }

  function autoRange() {
    let lo = Infinity, hi = -Infinity;
    state.points.forEach(pts => {
      if (!pts) return;
      pts.forEach(([, y]) => {
        if (isFinite(y)) { if (y < lo) lo = y; if (y > hi) hi = y; }
      });
    });
    if (!isFinite(lo)) { lo = -1; hi = 1; }
    const pad = (hi - lo) * 0.08 || 1;
    state.ymin = lo - pad; state.ymax = hi + pad;
  }

  /* ---------- 刻度 ---------- */
  function niceStep(range, target) {
    const raw = range / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) {
      if (raw <= m * mag) return m * mag;
    }
    return 10 * mag;
  }

  function toPx(x, y) {
    return [
      (x - state.xmin) / (state.xmax - state.xmin) * canvas.width,
      canvas.height - (y - state.ymin) / (state.ymax - state.ymin) * canvas.height,
    ];
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    const W = canvas.width, H = canvas.height;
    const css = getComputedStyle(document.documentElement);
    const C = {
      grid: css.getPropertyValue("--line").trim() || "#D8CEB6",
      axis: css.getPropertyValue("--line-strong").trim() || "#B6AA8C",
      text: css.getPropertyValue("--ink-3").trim() || "#8D8470",
      bg: css.getPropertyValue("--paper").trim() || "#F4EFE2",
    };

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    /* 网格 */
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.font = FONT; ctx.fillStyle = C.text;
    const xStep = niceStep(state.xmax - state.xmin, 8);
    const yStep = niceStep(state.ymax - state.ymin, 6);
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let x = Math.ceil(state.xmin / xStep) * xStep; x <= state.xmax; x += xStep) {
      const [px] = toPx(x, 0);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      ctx.fillText(GEWU.fmtNum(x, 4), px, 2);
    }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (let y = Math.ceil(state.ymin / yStep) * yStep; y <= state.ymax; y += yStep) {
      const [, py] = toPx(0, y);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      ctx.fillText(GEWU.fmtNum(y, 4), W - 4, py);
    }

    /* 坐标轴 */
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4;
    const [x0, y0] = toPx(0, 0);
    if (x0 >= 0 && x0 <= W) { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke(); }
    if (y0 >= 0 && y0 <= H) { ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); }

    /* 曲线 */
    state.points.forEach((pts, i) => {
      if (!pts || !state.fns[i] || !state.fns[i].on) return;
      ctx.strokeStyle = state.fns[i].color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let pen = false;
      for (let k = 0; k < pts.length; k++) {
        const [x, y] = pts[k];
        if (!isFinite(y)) { pen = false; continue; }
        const [px, py] = toPx(x, y);
        if (px < -50 || px > W + 50 || py < -50 || py > H + 50) { pen = false; continue; }
        if (!pen) { ctx.moveTo(px, py); pen = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    $("#view-info").textContent =
      `x: [${GEWU.fmtNum(state.xmin, 4)}, ${GEWU.fmtNum(state.xmax, 4)}]  y: [${GEWU.fmtNum(state.ymin, 4)}, ${GEWU.fmtNum(state.ymax, 4)}]`;
  }

  /* ---------- 交互 ---------- */
  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener("mousedown", e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.style.cursor = "grabbing";
  });
  window.addEventListener("mouseup", () => { dragging = false; canvas.style.cursor = "grab"; });
  canvas.addEventListener("mousemove", e => {
    if (!dragging) return;
    const dx = (e.clientX - lastX) / canvas.width * (state.xmax - state.xmin);
    const dy = (e.clientY - lastY) / canvas.height * (state.ymax - state.ymin);
    state.xmin -= dx; state.xmax -= dx;
    state.ymin += dy; state.ymax += dy;
    lastX = e.clientX; lastY = e.clientY;
    redraw();
  });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const xc = state.xmin + mx * (state.xmax - state.xmin);
    const yc = state.ymin + (1 - my) * (state.ymax - state.ymin);
    state.xmin = xc - (xc - state.xmin) * factor; state.xmax = xc + (state.xmax - xc) * factor;
    state.ymin = yc - (yc - state.ymin) * factor; state.ymax = yc + (state.ymax - yc) * factor;
    redraw();
  }, { passive: false });

  /* ---------- 函数列表 UI ---------- */
  function renderFns() {
    $("#fns").innerHTML = state.fns.map((fn, i) => `
      <div class="fn-row">
        <span class="swatch" style="background:${fn.color}"></span>
        <input type="text" data-i="${i}" value="${GEWU.esc(fn.expr)}" placeholder="f(x) = ?" spellcheck="false">
        <button class="btn sm ghost" data-eye="${i}" title="显示/隐藏">${fn.on ? "👁" : "—"}</button>
        <button class="btn sm ghost" data-del="${i}" title="删除">✕</button>
      </div>`).join("");
  }
  $("#fns").addEventListener("input", e => {
    const i = +e.target.dataset.i;
    if (isFinite(i)) { state.fns[i].expr = e.target.value; redraw(); }
  });
  $("#fns").addEventListener("click", e => {
    const eye = e.target.closest("[data-eye]"), del = e.target.closest("[data-del]");
    if (eye) {
      const i = +eye.dataset.eye;
      state.fns[i].on = !state.fns[i].on;
      renderFns(); redraw();
    }
    if (del) {
      state.fns.splice(+del.dataset.del, 1);
      if (!state.fns.length) state.fns.push({ expr: "", color: PALETTE[0], on: true });
      renderFns(); redraw();
    }
  });
  $("#add-fn").addEventListener("click", () => {
    if (state.fns.length >= 4) return GEWU.toast("最多 4 条曲线");
    state.fns.push({ expr: "x", color: PALETTE[state.fns.length % PALETTE.length], on: true });
    renderFns();
  });

  /* ---------- 视图控制 ---------- */
  function readRange() {
    state.xmin = +$("#xmin").value; state.xmax = +$("#xmax").value;
    if (state.xmin >= state.xmax) { state.xmax = state.xmin + 1; $("#xmax").value = state.xmax; }
    const y1 = parseFloat($("#ymin").value), y2 = parseFloat($("#ymax").value);
    state.ymin = isFinite(y1) ? y1 : null;
    state.ymax = isFinite(y2) ? y2 : null;
  }
  function writeRange() {
    $("#xmin").value = state.xmin; $("#xmax").value = state.xmax;
  }
  function redraw() {
    sample();
    if (state.ymin === null || state.ymax === null) autoRange();
    draw();
  }
  $("#redraw").addEventListener("click", () => { readRange(); redraw(); });
  $("#auto-y").addEventListener("click", () => {
    $("#ymin").value = ""; $("#ymax").value = "";
    readRange(); redraw();
  });
  $("#reset").addEventListener("click", () => {
    $("#xmin").value = -6; $("#xmax").value = 6;
    $("#ymin").value = ""; $("#ymax").value = "";
    readRange(); redraw();
  });

  /* ---------- 导出 ---------- */
  function svgExport() {
    const W = canvas.width, H = canvas.height;
    const css = getComputedStyle(document.documentElement);
    const grid = css.getPropertyValue("--line").trim() || "#D8CEB6";
    const axis = css.getPropertyValue("--line-strong").trim() || "#B6AA8C";
    const textC = css.getPropertyValue("--ink-3").trim() || "#8D8470";
    const bg = css.getPropertyValue("--paper").trim() || "#F4EFE2";
    const xStep = niceStep(state.xmax - state.xmin, 8);
    const yStep = niceStep(state.ymax - state.ymin, 6);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    s += `<rect width="${W}" height="${H}" fill="${bg}"/>`;
    s += `<g stroke="${grid}" stroke-width="1">`;
    for (let x = Math.ceil(state.xmin / xStep) * xStep; x <= state.xmax; x += xStep) {
      const [px] = toPx(x, 0);
      s += `<line x1="${px.toFixed(2)}" y1="0" x2="${px.toFixed(2)}" y2="${H}"/>`;
    }
    for (let y = Math.ceil(state.ymin / yStep) * yStep; y <= state.ymax; y += yStep) {
      const [, py] = toPx(0, y);
      s += `<line x1="0" y1="${py.toFixed(2)}" x2="${W}" y2="${py.toFixed(2)}"/>`;
    }
    s += `</g>`;
    const [x0, y0] = toPx(0, 0);
    s += `<g stroke="${axis}" stroke-width="1.6">`;
    if (x0 >= 0 && x0 <= W) s += `<line x1="${x0.toFixed(2)}" y1="0" x2="${x0.toFixed(2)}" y2="${H}"/>`;
    if (y0 >= 0 && y0 <= H) s += `<line x1="0" y1="${y0.toFixed(2)}" x2="${W}" y2="${y0.toFixed(2)}"/>`;
    s += `</g>`;
    state.points.forEach((pts, i) => {
      if (!pts || !state.fns[i] || !state.fns[i].on) return;
      let d = "";
      let pen = false;
      pts.forEach(([x, y]) => {
        if (!isFinite(y)) { pen = false; return; }
        const [px, py] = toPx(x, y);
        if (!pen) { d += `M${px.toFixed(2)} ${py.toFixed(2)} `; pen = true; }
        else d += `L${px.toFixed(2)} ${py.toFixed(2)} `;
      });
      if (d) s += `<path d="${d}" fill="none" stroke="${state.fns[i].color}" stroke-width="2.2" stroke-linecap="round"/>`;
    });
    s += `<text x="10" y="18" font-family="monospace" font-size="11" fill="${textC}">f(x) · GEWU</text>`;
    s += `</svg>`;
    return s;
  }

  $("#dl-svg").addEventListener("click", () => {
    GEWU.downloadText(svgExport(), "function-plot.svg", "image/svg+xml");
  });
  $("#dl-png").addEventListener("click", () => GEWU.downloadCanvas(canvas, "function-plot.png", 2));

  renderRelated($("#related"), ["V-02", "V-03", "V-05", "R-01"]);
  renderFns();
  redraw();
})();
