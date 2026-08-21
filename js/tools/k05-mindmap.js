/* K-05 思维导图：缩进大纲 → 辐射布局 → PNG/SVG */
(function () {
  "use strict";
  const $ = GEWU.$;
  const canvas = $("#map");
  const W = 920, H = 620;

  const DEPTH_COLORS = ["#C03A22", "#25548F", "#3B6B4E", "#B07A1F", "#6B4F9E", "#2E7D9E"];

  /* ---------- 解析 ---------- */
  function parseTree(text) {
    const lines = text.split(/\r?\n/).map(l => l.replace(/\t/g, "    "));
    const items = lines
      .map(l => {
        const m = l.match(/^(\s*)(.*)$/);
        const indent = m[1].replace(/ {2}/g, "\t").length; /* 2空格=1级 */
        const content = m[2].replace(/^\s*[-*•]\s+/, "").trim();
        return { indent, content };
      })
      .filter(it => it.content);
    if (!items.length) return null;

    const root = { text: items[0].content, children: [], depth: 0, leaves: 1 };
    const stack = [{ indent: items[0].indent, node: root }];
    for (let i = 1; i < items.length; i++) {
      const it = items[i];
      while (stack.length > 1 && stack[stack.length - 1].indent >= it.indent) stack.pop();
      const parent = stack[stack.length - 1].node;
      const node = { text: it.content, children: [], depth: parent.depth + 1, leaves: 1, parent };
      parent.children.push(node);
      stack.push({ indent: it.indent, node });
    }
    countLeaves(root);
    return root;
  }
  function countLeaves(n) {
    if (!n.children.length) { n.leaves = 1; return 1; }
    n.leaves = n.children.reduce((a, c) => a + countLeaves(c), 0);
    return n.leaves;
  }

  /* ---------- 布局（辐射） ---------- */
  function layout(root) {
    const cx = W / 2, cy = H / 2;
    const R0 = 74, R = 105;
    const nodes = [];
    const maxDepth = maxDepthOf(root);

    function place(n, a0, a1) {
      const r = R0 + (n.depth === 0 ? 0 : R * (n.depth - 0.5) * Math.min(1, 6 / maxDepth));
      const ang = (a0 + a1) / 2;
      n.x = cx + Math.cos(ang) * r;
      n.y = cy + Math.sin(ang) * r;
      nodes.push(n);
      if (!n.children.length) return;
      const total = n.leaves;
      let acc = a0;
      n.children.forEach(c => {
        const span = (a1 - a0) * c.leaves / total;
        place(c, acc, acc + span);
        acc += span;
      });
    }
    place(root, -Math.PI / 2, Math.PI * 1.5);
    return nodes;
  }
  function maxDepthOf(n) { return 1 + (n.children.length ? Math.max(...n.children.map(maxDepthOf)) : 0); }

  /* ---------- 文本折行 ---------- */
  function wrapLabel(ctx, text, maxW) {
    ctx.font = '13px "Noto Sans SC", "PingFang SC", sans-serif';
    const lines = [];
    let cur = "";
    for (const ch of text) {
      if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  /* ---------- 绘制 ---------- */
  let lastLayout = [];

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.aspectRatio = `${W}/${H}`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue("--surface").trim() || "#FBF8EF";
    ctx.fillRect(0, 0, W, H);

    const root = parseTree($("#outline").value);
    if (!root) { lastLayout = []; return; }
    lastLayout = layout(root);

    /* 边 */
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = css.getPropertyValue("--line-strong").trim() || "#B6AA8C";
    lastLayout.forEach(n => {
      if (!n.parent) return;
      const p = n.parent;
      ctx.strokeStyle = DEPTH_COLORS[p.depth % DEPTH_COLORS.length];
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      const mx = (p.x + n.x) / 2 + (n.y - p.y) * 0.12;
      const my = (p.y + n.y) / 2 - (n.x - p.x) * 0.12;
      ctx.quadraticCurveTo(mx, my, n.x, n.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    /* 节点 */
    lastLayout.forEach(n => {
      const color = DEPTH_COLORS[n.depth % DEPTH_COLORS.length];
      const lines = wrapLabel(ctx, n.text, 130);
      const w = Math.max(64, ...lines.map(l => ctx.measureText(l).width) + 22);
      const h = Math.max(30, lines.length * 19 + 8);
      const x = n.x - w / 2, y = n.y - h / 2;

      ctx.fillStyle = n.depth === 0 ? color : css.getPropertyValue("--surface").trim() || "#FBF8EF";
      ctx.strokeStyle = color;
      ctx.lineWidth = n.depth === 0 ? 0 : 1.6;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, n.depth === 0 ? 10 : 8);
      else ctx.rect(x, y, w, h);
      ctx.fill();
      if (n.depth > 0) ctx.stroke();

      ctx.fillStyle = n.depth === 0 ? "#FBF8EF" : css.getPropertyValue("--ink").trim() || "#262117";
      ctx.font = '13px "Noto Sans SC", "PingFang SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((l, i) => {
        const ly = n.y + (i - (lines.length - 1) / 2) * 19;
        ctx.fillText(l, n.x, ly);
      });
    });
  }

  /* ---------- SVG 导出 ---------- */
  function svgOf() {
    const root = parseTree($("#outline").value);
    if (!root) return null;
    const nodes = layout(root);
    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--surface").trim() || "#FBF8EF";
    const ink = css.getPropertyValue("--ink").trim() || "#262117";
    const measure = document.createElement("canvas").getContext("2d");
    const s = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `<rect width="${W}" height="${H}" fill="${bg}"/>`];
    nodes.forEach(n => {
      if (!n.parent) return;
      const p = n.parent;
      const color = DEPTH_COLORS[p.depth % DEPTH_COLORS.length];
      const mx = (p.x + n.x) / 2 + (n.y - p.y) * 0.12;
      const my = (p.y + n.y) / 2 - (n.x - p.x) * 0.12;
      s.push(`<path d="M${p.x} ${p.y}Q${mx} ${my} ${n.x} ${n.y}" fill="none" stroke="${color}" stroke-width="1.6" opacity="0.55"/>`);
    });
    nodes.forEach(n => {
      const color = DEPTH_COLORS[n.depth % DEPTH_COLORS.length];
      const lines = wrapLabel(measure, n.text, 130);
      const w = Math.max(64, ...lines.map(l => measure.measureText(l).width) + 22);
      const h = Math.max(30, lines.length * 19 + 8);
      const x = n.x - w / 2, y = n.y - h / 2;
      const fill = n.depth === 0 ? color : bg;
      s.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${n.depth === 0 ? 10 : 8}" fill="${fill}"${n.depth > 0 ? ` stroke="${color}" stroke-width="1.6"` : ""}/>`);
      lines.forEach((l, i) => {
        const ly = n.y + (i - (lines.length - 1) / 2) * 19;
        s.push(`<text x="${n.x}" y="${ly + 5}" font-family="sans-serif" font-size="13" text-anchor="middle" fill="${n.depth === 0 ? "#FBF8EF" : ink}">${GEWU.esc(l)}</text>`);
      });
    });
    s.push("</svg>");
    return s.join("");
  }

  /* ---------- 事件 ---------- */
  $("#render").addEventListener("click", draw);
  $("#outline").addEventListener("input", draw);
  $("#dl-png").addEventListener("click", () => GEWU.downloadCanvas(canvas, "mindmap.png", 2));
  $("#dl-svg").addEventListener("click", () => {
    const svg = svgOf();
    if (svg) GEWU.downloadText(svg, "mindmap.svg", "image/svg+xml");
  });

  $("#sample").addEventListener("click", () => {
    $("#outline").value = `格物 · 科研工作流
  阅读
    文献清洗
      去重
      缺字段体检
      年份统计
    公式工坊
      KaTeX 渲染
      SVG / PNG 导出
  记录
    笔记台
      Markdown 双栏
      自动存档
  分析
    量纲换算
      10 类单位
      物理常数
    随机化设计
      种子复现
      均衡分组
  绘图
    函数绘图仪
    图表工坊
      5 种图表
    分布实验室
      8 种分布
    关系图谱
  传播
    知识卡片
    公众号排版
    代码分享图
    幻灯片速成
    思维导图`;
    draw();
  });

  renderRelated($("#related"), ["V-04", "V-02", "K-01"]);
  $("#sample").click();
})();
