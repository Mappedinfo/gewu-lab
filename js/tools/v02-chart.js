/* V-02 图表工坊：CSV → 折线/散点/柱状/直方/饼图 + 统计摘要 + 双渲染器导出 */
(function () {
  "use strict";
  const $ = GEWU.$;
  const canvas = $("#chart");

  const PALETTE = ["#C03A22", "#25548F", "#3B6B4E", "#B07A1F", "#6B4F9E", "#2E7D9E"];

  let data = { cols: [], rows: [], numeric: [], header: [] };

  /* ---------- 数据解析 ---------- */
  function loadData() {
    const { rows } = GEWU.parseCSV($("#csv").value);
    if (!rows.length) { data = { cols: [], rows: [], numeric: [], header: [] }; return; }
    const ncol = Math.max(...rows.map(r => r.length));
    const first = rows[0];
    /* 表头判定：首行存在任一非数字单元格（且非空）即视为表头行 */
    const hasHeader = first.some((v, i) => {
      const cell = String(v).trim();
      return cell !== "" && isNaN(parseFloat(cell));
    });
    const header = hasHeader ? first : Array.from({ length: ncol }, (_, i) => "列" + (i + 1));
    const rows2 = hasHeader ? rows.slice(1) : rows;
    /* 补足列数 */
    const padded = rows2.map(r => {
      const rr = r.slice();
      while (rr.length < ncol) rr.push("");
      return rr;
    });
    const numeric = header.map((h, i) =>
      padded.every(r => r[i].trim() === "" || isFinite(parseFloat(r[i]))));
    data = { cols: header, rows: padded, numeric, header };
  }

  function colValues(i) { return data.rows.map(r => r[i].trim()); }
  function colNums(i) {
    return colValues(i).map(v => v === "" ? NaN : parseFloat(v));
  }

  function renderPreview() {
    const el = $("#preview");
    if (!data.cols.length) { el.innerHTML = '<span class="muted">等待数据…</span>'; return; }
    el.innerHTML = `<table style="border-collapse:collapse">
      <tr>${data.cols.map((c, i) => `<th style="padding:3px 8px;border:1px solid var(--line);font-family:var(--font-mono);${data.numeric[i] ? "color:var(--blue)" : ""}">${GEWU.esc(c)}</th>`).join("")}</tr>
      ${data.rows.slice(0, 12).map(r => `<tr>${r.map((v, i) => `<td style="padding:2px 8px;border:1px solid var(--line);font-family:var(--font-mono)">${GEWU.esc(v)}</td>`).join("")}</tr>`).join("")}
    </table>`;
  }

  function renderStats() {
    const el = $("#stats");
    const sel = selectedY();
    if (!sel.length) { el.innerHTML = '<span class="muted">选择 Y 列后显示统计</span>'; return; }
    el.innerHTML = sel.map(i => {
      const vs = colNums(i).filter(isFinite);
      if (!vs.length) return "";
      const mean = vs.reduce((a, b) => a + b, 0) / vs.length;
      const sd = Math.sqrt(vs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vs.length - 1));
      const lo = Math.min(...vs), hi = Math.max(...vs);
      return `<div style="margin-bottom:4px"><b>${GEWU.esc(data.cols[i])}</b> n=${vs.length} · min=${GEWU.fmtSci(lo, 4)} · max=${GEWU.fmtSci(hi, 4)} · mean=${GEWU.fmtSci(mean, 4)} · sd=${GEWU.fmtSci(sd, 4)}</div>`;
    }).join("");
  }

  function renderYCols() {
    $("#ycols").innerHTML = data.cols.map((c, i) =>
      data.numeric[i]
        ? `<label style="display:inline-flex;align-items:center;gap:4px;font-size:.8rem;border:1px solid var(--line);border-radius:6px;padding:3px 8px;cursor:pointer;background:var(--surface)">
             <input type="checkbox" value="${i}" ${i === 1 ? "checked" : ""}> ${GEWU.esc(c)}
           </label>` : "").join("");
    const xel = $("#xcol");
    xel.innerHTML = data.cols.map((c, i) => `<option value="${i}">${GEWU.esc(c)}${data.numeric[i] ? "（数值）" : ""}</option>`).join("");
    xel.value = data.numeric[0] || data.numeric[1] ? (data.numeric[0] ? 0 : 1) : 0;
    updateTypeFields();
  }

  function selectedY() {
    return Array.from(document.querySelectorAll("#ycols input:checked")).map(i => +i.value);
  }

  /* ---------- 图表配置 ---------- */
  function buildConfig() {
    const type = $("#type").value;
    const xi = +$("#xcol").value;
    const sel = selectedY();
    const title = $("#title").value || "";
    const xlabel = $("#xlabel").value || "", ylabel = $("#ylabel").value || "";
    const theme = $("#theme").value;

    if (type === "pie") {
      const vals = colNums(xi).filter(isFinite);
      const labels = colValues(xi);
      const slices = vals.length ? vals.map((v, i) => ({ label: labels[i] || "", value: v }))
        : Object.entries(labels.reduce((m, l) => (m[l] = (m[l] || 0) + 1, m), {}))
            .map(([label, value]) => ({ label, value }));
      return { type, slices, title, theme };
    }

    if (type === "hist") {
      const vals = colNums(xi).filter(isFinite);
      const n = Math.min(20, Math.max(5, Math.round(Math.sqrt(vals.length)) || 5));
      const lo = Math.min(...vals), hi = Math.max(...vals);
      const w = (hi - lo) / n || 1;
      const counts = Array(n).fill(0);
      vals.forEach(v => { const b = Math.min(n - 1, Math.floor((v - lo) / w)); counts[b]++; });
      return {
        type, title, theme, xlabel, ylabel,
        xLabels: Array.from({ length: n }, (_, i) => GEWU.fmtSci(lo + i * w, 3)),
        series: [{ name: data.cols[xi], color: PALETTE[0], bins: counts }],
      };
    }

    const xs = colValues(xi);
    const numericX = data.numeric[xi];
    const xNum = numericX ? colNums(xi) : null;
    const series = sel.filter(i => i !== xi).map((yi, k) => ({
      name: data.cols[yi], color: PALETTE[k % PALETTE.length],
      pts: data.rows.map((r, idx) => {
        const x = numericX ? parseFloat(r[xi]) : idx;
        const y = parseFloat(r[yi]);
        return [isFinite(x) ? x : idx, isFinite(y) ? y : null];
      }),
    }));
    const xLabels = numericX ? null : xs;
    return { type, title, theme, xlabel, ylabel, series, xLabels, numericX };
  }

  /* ---------- 渲染器抽象 ---------- */
  const W = 840, H = 480;

  function canvasRenderer(theme) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.aspectRatio = `${W}/${H}`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const C = theme === "dark"
      ? { bg: "#211D14", grid: "#383225", axis: "#504830", text: "#A79E87", title: "#EAE3CF" }
      : { bg: "#FBF8EF", grid: "#E3DAC2", axis: "#B6AA8C", text: "#8D8470", title: "#262117" };
    const r = {
      C,
      clear() { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); },
      hline(y, x0, x1) { ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); },
      vline(x, y0, y1) { ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); },
      axis(x0, y0) { ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); },
      text(s, x, y, align, color, size, baseline) {
        ctx.fillStyle = color || C.text;
        ctx.font = `${size || 11}px "JetBrains Mono", monospace`;
        ctx.textAlign = align || "left";
        ctx.textBaseline = baseline || "middle";
        ctx.fillText(s, x, y);
      },
      title(s) { this.text(s, W / 2, 18, "center", C.title, 15, "top"); },
      polyline(pts, color, width, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = width || 2;
        ctx.setLineDash(dash || []);
        ctx.beginPath();
        let pen = false;
        pts.forEach(([px, py]) => {
          if (py === null || !isFinite(py)) { pen = false; return; }
          if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      },
      dots(pts, color, radius) {
        ctx.fillStyle = color;
        pts.forEach(([px, py]) => { if (py !== null && isFinite(py)) { ctx.beginPath(); ctx.arc(px, py, radius || 3, 0, Math.PI * 2); ctx.fill(); } });
      },
      rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); },
      legend(items) {
        let x = W - 14;
        items.slice().reverse().forEach(it => {
          const tw = ctx.measureText(it.name).width;
          x -= tw + 26;
          ctx.fillStyle = it.color; ctx.fillRect(x, 12, 14, 3);
          ctx.fillStyle = this.C.text; ctx.font = '11px "JetBrains Mono", monospace';
          ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText(it.name, x + 18, 13);
          x -= 12;
        });
      },
      pieSlice(cx, cy, r, a0, a1, color) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = this.C.bg; ctx.lineWidth = 2; ctx.stroke();
      },
    };
    return r;
  }

  function svgRenderer(theme) {
    const C = theme === "dark"
      ? { bg: "#211D14", grid: "#383225", axis: "#504830", text: "#A79E87", title: "#EAE3CF" }
      : { bg: "#FBF8EF", grid: "#E3DAC2", axis: "#B6AA8C", text: "#8D8470", title: "#262117" };
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `<rect width="${W}" height="${H}" fill="${C.bg}"/>`];
    const r = {
      C,
      clear() {},
      hline(y, x0, x1) { parts.push(`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.grid}"/>`); },
      vline(x, y0, y1) { parts.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${C.grid}"/>`); },
      axis(x0, y0) { parts.push(`<path d="M${x0} 0V${H}M0 ${y0}H${W}" stroke="${C.axis}" stroke-width="1.4"/>`); },
      text(s, x, y, align, color, size, baseline) {
        parts.push(`<text x="${x}" y="${y}" font-family="monospace" font-size="${size || 11}" fill="${color || C.text}" text-anchor="${({ center: "middle", right: "end" })[align] || "start"}" dominant-baseline="${baseline || "middle"}">${GEWU.esc(s)}</text>`);
      },
      title(s) { this.text(s, W / 2, 18, "center", C.title, 15, "hanging"); },
      polyline(pts, color, width, dash) {
        const d = pts.map(([px, py], i) => (py === null || !isFinite(py) ? "" : `${i === 0 || pts[i - 1][1] === null ? "M" : "L"}${px} ${py}`)).filter(Boolean).join(" ");
        parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width || 2}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash.join(" ")}"` : ""}/>`);
      },
      dots(pts, color, radius) {
        parts.push(pts.filter(([, py]) => py !== null && isFinite(py)).map(([px, py]) =>
          `<circle cx="${px}" cy="${py}" r="${radius || 3}" fill="${color}"/>`).join(""));
      },
      rect(x, y, w, h, color) { parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`); },
      legend(items) {
        let x = W - 26;
        items.slice().reverse().forEach(it => {
          const tw = (it.name.length + 2) * 6.6;
          x -= tw;
          parts.push(`<rect x="${x}" y="10.5" width="14" height="3" fill="${it.color}"/><text x="${x + 18}" y="13" font-family="monospace" font-size="11" fill="${C.text}">${GEWU.esc(it.name)}</text>`);
          x -= 12;
        });
      },
      pieSlice(cx, cy, r, a0, a1, color) {
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const large = (a1 - a0) > Math.PI ? 1 : 0;
        parts.push(`<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}Z" fill="${color}" stroke="${C.bg}" stroke-width="2"/>`);
      },
    };
    r._finish = () => parts.join("") + "</svg>";
    return r;
  }

  /* ---------- 绘图 ---------- */
  function niceStep(range, target) {
    const raw = range / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * mag) return m * mag;
    return 10 * mag;
  }

  function drawChart(r, cfg) {
    r.clear();
    if (cfg.title) r.title(cfg.title);

    if (cfg.type === "pie") {
      const total = cfg.slices.reduce((a, s) => a + s.value, 0);
      if (!total) return;
      const cx = W / 2, cy = H / 2 + 8, rad = Math.min(W, H) / 2 - 70;
      let a = -Math.PI / 2;
      const items = [];
      cfg.slices.forEach((s, i) => {
        const span = s.value / total * Math.PI * 2;
        const color = PALETTE[i % PALETTE.length];
        r.pieSlice(cx, cy, rad, a, a + span, color);
        items.push({ name: `${s.label} ${(s.value / total * 100).toFixed(1)}%`, color });
        a += span;
      });
      r.legend(items);
      return;
    }

    const series = cfg.series;
    let xsAll = [], ysAll = [];
    if (cfg.type === "hist") {
      series.forEach(s => { xsAll.push(0, s.bins.length); ysAll.push(...s.bins); });
    } else {
      series.forEach(s => s.pts.forEach(([x, y]) => { if (y !== null) { xsAll.push(x); ysAll.push(y); } }));
    }
    if (!ysAll.length) return;
    const margin = { l: 58, r: 20, t: 44, b: 46 };
    const pw = W - margin.l - margin.r, ph = H - margin.t - margin.b;
    let x0 = margin.l, x1 = W - margin.r, y0 = H - margin.b, y1 = margin.t;

    const numericX = cfg.numericX && cfg.type !== "hist";
    let xmin, xmax, xScale, catN = 0;
    if (numericX) {
      xmin = Math.min(...xsAll); xmax = Math.max(...xsAll);
      if (xmin === xmax) { xmin -= 0.5; xmax += 0.5; }
      const pad = (xmax - xmin) * 0.04;
      xmin -= pad; xmax += pad;
      xScale = x => x0 + (x - xmin) / (xmax - xmin) * pw;
    } else {
      catN = cfg.type === "hist" ? (series[0] ? series[0].bins.length : 0) : Math.max(1, ...series.map(s => s.pts.length));
      xScale = i => x0 + (i + 0.5) / catN * pw;
    }

    let ymin = Math.min(...ysAll), ymax = Math.max(...ysAll);
    if (ymin === ymax) { ymin -= 0.5; ymax += 0.5; }
    if (cfg.type === "hist") ymin = 0;
    if (ymin > 0 && ymin / ymax > 0.12) ymin = 0; /* 柱状/直方从零开始 */
    const ypad = (ymax - ymin) * 0.06;
    ymin -= ypad; ymax += ypad;
    const yScale = y => y1 + (ymax - y) / (ymax - ymin) * ph;

    /* 网格 + 刻度 */
    const xStep = numericX ? niceStep(xmax - xmin, 8) : null;
    const yStep = niceStep(ymax - ymin, 6);
    for (let y = Math.ceil(ymin / yStep) * yStep; y <= ymax; y += yStep) {
      const py = yScale(y);
      r.hline(py, x0, x1);
      r.text(GEWU.fmtNum(y, 4), x0 - 8, py, "right");
    }
    if (numericX) {
      for (let x = Math.ceil(xmin / xStep) * xStep; x <= xmax; x += xStep) {
        r.vline(xScale(x), y0, y1);
        r.text(GEWU.fmtNum(x, 4), xScale(x), y0 + 8, "center", null, 10, "top");
      }
    } else {
      const step = Math.max(1, Math.ceil(catN / 10));
      for (let i = 0; i < catN; i += step) {
        const label = cfg.xLabels ? cfg.xLabels[i] : String(i + 1);
        r.text(label, xScale(i), y0 + 8, "center", null, 10, "top");
      }
    }
    r.axis(x0, y0);
    if (cfg.xlabel) r.text(cfg.xlabel, x0 + pw / 2, H - 14, "center", null, 12);
    if (cfg.ylabel) {
      /* 竖排标签用两段文字近似 */
      const t = cfg.ylabel;
      r.text(t.split("").join("\u200b"), 14, y1 + ph / 2, "center", null, 12);
    }

    /* 数据 */
    if (cfg.type === "line") {
      series.forEach(s => {
        const pts = s.pts.map(([x, y]) => [numericX ? xScale(x) : xScale(x), y === null ? null : yScale(y)]);
        r.polyline(pts, s.color, 2.2);
        r.dots(pts.filter(p => p[1] !== null).filter((_, i) => i % Math.max(1, Math.floor(s.pts.length / 40)) === 0), s.color, 3);
      });
      r.legend(series);
    } else if (cfg.type === "scatter") {
      series.forEach(s => {
        r.dots(s.pts.map(([x, y]) => [numericX ? xScale(x) : xScale(x), y === null ? null : yScale(y)]), s.color, 4);
      });
      r.legend(series);
    } else if (cfg.type === "bar") {
      const n = series[0].pts.length;
      const groupW = pw / n;
      const barW = Math.min(30, groupW / (series.length + 0.6));
      series.forEach((s, k) => {
        s.pts.forEach(([x, y], i) => {
          if (y === null) return;
          const bx = (numericX ? xScale(x) : xScale(i)) - (series.length * barW) / 2 + k * barW;
          r.rect(bx, yScale(y), barW * 0.86, y0 - yScale(y), s.color);
        });
      });
      r.legend(series);
    } else if (cfg.type === "hist") {
      const bw = pw / catN;
      series.forEach(s => {
        s.bins.forEach((c, i) => {
          r.rect(x0 + i * bw, yScale(c), bw * 0.9, y0 - yScale(c), s.color);
        });
      });
      r.legend(series);
    }
  }

  /* ---------- 渲染入口 ---------- */
  function render() {
    loadData();
    renderPreview();
    renderYCols();
    renderStats();
    const cfg = buildConfig();
    drawChart(canvasRenderer($("#theme").value), cfg);
  }

  function updateTypeFields() {
    const t = $("#type").value;
    /* pie 与 hist 只关心 X 列 */
    $("#xcol").style.display = t === "pie" || t === "hist" ? "" : "none";
    document.querySelectorAll("#ycols label").forEach(l => { l.style.display = t === "pie" || t === "hist" ? "none" : ""; });
  }
  $("#type").addEventListener("change", () => { updateTypeFields(); render(); });
  $("#csv").addEventListener("input", () => { loadData(); renderPreview(); renderYCols(); renderStats(); render(); });
  $("#ycols").addEventListener("change", () => { renderStats(); render(); });
  $("#xcol").addEventListener("change", render);
  $("#title").addEventListener("input", render);
  $("#xlabel").addEventListener("input", render);
  $("#ylabel").addEventListener("input", render);
  $("#theme").addEventListener("change", render);

  $("#sample").addEventListener("click", () => {
    $("#csv").value = `year,实验组,对照组
2019,3.2,2.8
2020,4.5,3.9
2021,5.1,4.6
2022,6.8,5.2
2023,7.4,6.1
2024,8.9,6.7`;
    render();
  });

  $("#dl-png").addEventListener("click", () => GEWU.downloadCanvas(canvas, "chart.png", 2));
  $("#dl-svg").addEventListener("click", () => {
    const r = svgRenderer($("#theme").value);
    drawChart(r, buildConfig());
    GEWU.downloadText(r._finish(), "chart.svg", "image/svg+xml");
  });

  renderRelated($("#related"), ["V-01", "V-03", "V-06", "V-07"]);
  render();
})();
