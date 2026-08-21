/* K-03 代码分享图：hljs 分词 → 画布/图元渲染 → PNG/SVG */
(function () {
  "use strict";
  const $ = GEWU.$;
  const canvas = $("#codeimg");
  const imgOut = $("#imgout");

  const THEMES = {
    blueprint: { bg: "#1B3A5C", panel: "#152C47", text: "#E8F0F8", gutter: "#7E9CB8",
      keyword: "#F2C94C", string: "#7FD8A4", number: "#7FB3E8", comment: "#8FA8C4",
      title: "#F2994A", type: "#9AD1FF", built_in: "#FFD37A", attr: "#C5A3FF", meta: "#8FA8C4", dot: ["#FF5F56", "#FFBD2E", "#27C93F"] },
    midnight: { bg: "#0F1419", panel: "#151D24", text: "#E6EDF3", gutter: "#5B6570",
      keyword: "#FF7B72", string: "#A5D6FF", number: "#79C0FF", comment: "#8B949E",
      title: "#D2A8FF", type: "#FFA657", built_in: "#FFA657", attr: "#79C0FF", meta: "#8B949E", dot: ["#FF5F56", "#FFBD2E", "#27C93F"] },
    paper: { bg: "#F7F1E2", panel: "#EFE6CE", text: "#2B2620", gutter: "#A79A7E",
      keyword: "#B3261E", string: "#2E7D4F", number: "#25548F", comment: "#8A8170",
      title: "#8A5A1F", type: "#1F5B8C", built_in: "#8A5A1F", attr: "#6B4F9E", meta: "#8A8170", dot: ["#C03A22", "#D8A03C", "#3B6B4E"] },
    newsprint: { bg: "#EFE9DB", panel: "#E4DCC9", text: "#2F2A22", gutter: "#9B927C",
      keyword: "#7A3E2E", string: "#2E5D4E", number: "#1F4E79", comment: "#7E7560",
      title: "#8A5A1F", type: "#1F4E79", built_in: "#8A5A1F", attr: "#5C4A7A", meta: "#7E7560", dot: ["#7A3E2E", "#B07A1F", "#3B6B4E"] },
  };

  const FONT = '"JetBrains Mono", "SF Mono", Consolas, monospace';
  const FONT_SIZE = 15, LH = 23, PAD = 22, TITLE_H = 46, GUTTER = 52;

  /* ---------- 分词 ---------- */
  function tokenizeLine(line, lang) {
    if (!line.trim()) return [{ cls: "", text: "" }];
    try {
      const html = hljs.highlight(line, { language: lang }).value;
      const tokens = [];
      const re = /<span class="hljs-([\w-]+)">([\s\S]*?)<\/span>|([^<]+)/g;
      let m;
      while ((m = re.exec(html))) {
        if (m[1] !== undefined) tokens.push({ cls: m[1], text: m[2] });
        else if (m[3]) tokens.push({ cls: "", text: m[3] });
      }
      return tokens.length ? tokens : [{ cls: "", text: line }];
    } catch (e) {
      return [{ cls: "", text: line }];
    }
  }

  /* ---------- 布局：产出图元 ---------- */
  function layout() {
    const code = $("#code").value.replace(/\t/g, "    ");
    const lang = $("#lang").value;
    const theme = THEMES[$("#theme2").value];
    const fname = $("#fname").value || "code";
    const wrap = $("#wrap").checked;

    const lines = code.split("\n");
    const tokenLines = lines.map(l => tokenizeLine(l, lang));

    /* 测量 */
    const ctx = canvas.getContext("2d");
    ctx.font = `${FONT_SIZE}px ${FONT}`;
    const advance = (s) => ctx.measureText(s).width;

    const contentX = PAD + GUTTER;
    let maxW = 200;
    tokenLines.forEach(toks => {
      const w = toks.reduce((a, t) => a + advance(t.text), 0);
      if (w > maxW) maxW = w;
    });
    const codeW = wrap ? Math.max(maxW, 420) : maxW;
    const W = Math.min(1000, PAD * 2 + GUTTER + codeW);
    const clipX = PAD + GUTTER + codeW;

    /* 行布局：可能换行 */
    const rows = []; /* {tokens, lineNo} */
    tokenLines.forEach((toks, li) => {
      if (!wrap) {
        rows.push({ tokens: toks, lineNo: li + 1, clipped: null });
        return;
      }
      let cur = [], curW = 0;
      const pushRow = () => { if (cur.length) { rows.push({ tokens: cur, lineNo: li + 1, clipped: null }); cur = []; curW = 0; } };
      for (const t of toks) {
        const w = advance(t.text);
        if (curW + w > codeW && curW > 0) pushRow();
        cur.push(t); curW += w;
      }
      pushRow();
    });

    const H = PAD * 2 + TITLE_H + rows.length * LH + 10;
    return { W, H, rows, theme, fname, lang, contentX, clipX };
  }

  function colorOf(theme, cls) {
    if (!cls) return theme.text;
    if (cls.includes("comment") || cls.includes("quote")) return theme.comment;
    if (cls.includes("keyword") || cls.includes("literal") || cls.includes("doctag")) return theme.keyword;
    if (cls.includes("string") || cls.includes("regexp") || cls.includes("addition")) return theme.string;
    if (cls.includes("number") || cls.includes("symbol") || cls.includes("bullet")) return theme.number;
    if (cls.includes("title") || cls.includes("function") || cls.includes("section")) return theme.title;
    if (cls.includes("type") || cls.includes("class")) return theme.type;
    if (cls.includes("built_in")) return theme.built_in;
    if (cls.includes("attr") || cls.includes("attribute") || cls.includes("variable")) return theme.attr;
    if (cls.includes("meta")) return theme.meta;
    return theme.text;
  }

  /* ---------- 绘制 ---------- */
  function drawPrimitives(prims, dest) {
    const dpr = 2;
    canvas.width = prims.W * dpr; canvas.height = prims.H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const { theme, W, H } = prims;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = theme.panel;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(10, 10, W - 20, H - 20, 12);
    else ctx.rect(10, 10, W - 20, H - 20);
    ctx.fill();

    /* 标题栏 */
    theme.dot.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(34 + i * 22, 32, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = theme.text;
    ctx.font = `500 13px ${FONT}`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(prims.fname, 34 + theme.dot.length * 22 + 8, 32);
    ctx.fillStyle = theme.gutter;
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(prims.lang, W - 30, 32);
    ctx.strokeStyle = theme.gutter;
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(22, TITLE_H + 8); ctx.lineTo(W - 22, TITLE_H + 8); ctx.stroke();
    ctx.globalAlpha = 1;

    /* 代码 */
    ctx.font = `${FONT_SIZE}px ${FONT}`;
    ctx.textBaseline = "alphabetic";
    rows.forEach((row, ri) => {
      const baseY = PAD + TITLE_H + 16 + ri * LH;
      const firstRowOfLine = row.lineNo !== null && (ri === 0 || rows[ri - 1].lineNo !== row.lineNo);
      if (firstRowOfLine) {
        ctx.fillStyle = theme.gutter;
        ctx.textAlign = "right";
        ctx.fillText(String(row.lineNo), PAD + GUTTER - 14, baseY);
      }
      ctx.textAlign = "left";
      let cx = prims.contentX;
      for (const t of row.tokens) {
        const color = colorOf(theme, t.cls);
        ctx.fillStyle = color;
        ctx.fillText(t.text, cx, baseY);
        cx += ctx.measureText(t.text).width;
      }
      if (row.clipped) {
        ctx.fillStyle = theme.gutter;
        ctx.fillText("…", prims.clipX - 2, baseY);
      }
    });

    /* 预览图 */
    imgOut.src = canvas.toDataURL("image/png");
    imgOut.style.display = "";
  }

  /* ---------- SVG 导出 ---------- */
  function svgOf(prims) {
    const { theme, W, H } = prims;
    const s = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `<rect width="${W}" height="${H}" fill="${theme.bg}"/>`,
      `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="12" fill="${theme.panel}"/>`];
    theme.dot.forEach((c, i) => s.push(`<circle cx="${34 + i * 22}" cy="32" r="6" fill="${c}"/>`));
    s.push(`<text x="${34 + theme.dot.length * 22 + 8}" y="37" font-family="monospace" font-size="13" fill="${theme.text}">${GEWU.esc(prims.fname)}</text>`);
    s.push(`<text x="${W - 30}" y="36" font-family="monospace" font-size="11" text-anchor="end" fill="${theme.gutter}">${GEWU.esc(prims.lang)}</text>`);
    rows.forEach((row, ri) => {
      const baseY = PAD + TITLE_H + 16 + ri * LH;
      const first = row.lineNo !== null && (ri === 0 || rows[ri - 1].lineNo !== row.lineNo);
      if (first) s.push(`<text x="${PAD + GUTTER - 14}" y="${baseY + 5}" font-family="monospace" font-size="${FONT_SIZE}" text-anchor="end" fill="${theme.gutter}">${row.lineNo}</text>`);
      let cx = prims.contentX;
      for (const t of row.tokens) {
        s.push(`<text x="${cx}" y="${baseY + 5}" font-family="monospace" font-size="${FONT_SIZE}" fill="${colorOf(theme, t.cls)}">${GEWU.esc(t.text)}</text>`);
        cx += t.text.length * FONT_SIZE * 0.6;
      }
    });
    s.push("</svg>");
    return s.join("");
  }

  /* ---------- 事件 ---------- */
  let renderTimer = null;
  function render() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      const prims = layout();
      drawPrimitives(prims, canvas);
    }, 150);
  }
  $("#code").addEventListener("input", render);
  $("#lang").addEventListener("change", render);
  $("#theme2").addEventListener("change", render);
  $("#fname").addEventListener("input", render);
  $("#wrap").addEventListener("change", render);

  $("#dl-png").addEventListener("click", () => GEWU.downloadCanvas(canvas, "code-snapshot.png", 1));
  $("#dl-svg").addEventListener("click", () => {
    const prims = layout();
    GEWU.downloadText(svgOf(prims), "code-snapshot.svg", "image/svg+xml");
  });
  $("#copy").addEventListener("click", () => GEWU.copyText($("#code").value));

  /* 共享 rows 供 SVG 使用 */
  let rows = [];
  const _layout = layout;
  layout = function () {
    const prims = _layout();
    rows = prims.rows;
    return prims;
  };

  renderRelated($("#related"), ["K-01", "K-02", "R-02"]);
  $("#code").value = `import numpy as np

def fit_line(x, y):
    """最小二乘拟合 y = kx + b"""
    k = np.cov(x, y, ddof=1)[0, 1] / np.var(x, ddof=1)
    b = np.mean(y) - k * np.mean(x)
    return k, b

x = np.linspace(0, 10, 50)
y = 2.0 * x + 1.0 + np.random.normal(0, 0.5, 50)
k, b = fit_line(x, y)
print(f"k={k:.3f}, b={b:.3f}")  # 格物致知`;
  render();
})();
