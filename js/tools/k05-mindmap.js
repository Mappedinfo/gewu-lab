/* K-05 思维导图：缩进大纲 → 4 种布局 × 6 套配色 × 节点形状/连线风格 → 自适应画布 → SVG/PNG */
(function () {
  "use strict";
  const $ = GEWU.$;
  const $$ = GEWU.$$;
  const canvas = $("#map");
  const info = $("#map-info");
  const meas = document.createElement("canvas").getContext("2d");

  const FONT   = '13px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_B = '14px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_S = '600 12px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_XS = '10.5px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  const LINE_H = 19;      /* 盒子内行距 */
  const GAP = 16;         /* 同层节点间距（逻辑图/组织图） */
  const COL_GAP = 46;     /* 逻辑图列间距 */
  const ROW_GAP = 42;     /* 组织图行间距 */
  const MAX_TEXT = 150;   /* 文本单行最大宽度（决定换行） */

  /* ---------- 配置 ---------- */
  const LAYOUTS = ["tree", "radial", "org", "fishbone"];
  const SHAPES = ["rounded", "ellipse", "capsule", "hex"];
  const LINES = ["curve", "straight", "elbow"];
  const PATTERNS = ["none", "grid", "dots", "diag"];
  const BG_PRESETS = [
    { id: "theme", name: "跟随主题" },
    { id: "#FFFFFF", name: "纯白" },
    { id: "#F4EFE2", name: "宣纸" },
    { id: "#E7EDF2", name: "淡青" },
    { id: "#1C1913", name: "墨夜" },
  ];
  const PALETTES = [
    { id: "danqing", name: "丹青", colors: ["#C03A22", "#25548F", "#3B6B4E", "#B07A1F", "#6B4F9E", "#2E7D9E"] },
    { id: "qingbi",  name: "青碧", colors: ["#1F4E79", "#2E6B8F", "#3A8A7A", "#4E9A64", "#5C8FC7", "#8E7CC3"] },
    { id: "dailan",  name: "黛蓝", colors: ["#16324F", "#1F4E79", "#2E75B6", "#4A90C4", "#6FAFD8", "#96C3E0"] },
    { id: "ziteng",  name: "紫藤", colors: ["#40245C", "#5B3A8C", "#7A5CB8", "#9A7FD0", "#AF9BD8", "#C7B5E3"] },
    { id: "qiushi",  name: "秋实", colors: ["#8C3B1E", "#B0502C", "#C4761F", "#B08A2F", "#7A8F3C", "#5C7A99"] },
    { id: "shimo",   name: "石墨", colors: ["#2B2B2B", "#4A4A4A", "#6B6B6B", "#8C8C8C", "#A6A6A6", "#BFBFBF"] },
  ];

  /* ---------- 状态（记住用户选择） ---------- */
  let state = { layout: "tree", palette: "danqing", shape: "rounded", line: "curve", bg: "theme", pattern: "none" };
  try {
    const saved = JSON.parse(localStorage.getItem("gewu-k05-style") || "null");
    if (saved && LAYOUTS.includes(saved.layout) && PALETTES.some(p => p.id === saved.palette)
      && SHAPES.includes(saved.shape) && LINES.includes(saved.line)
      && PATTERNS.includes(saved.pattern)
      && (saved.bg === "theme" || /^#[0-9a-fA-F]{6}$/.test(saved.bg))) Object.assign(state, saved);
  } catch (_) {}

  function palette() { return PALETTES.find(p => p.id === state.palette) || PALETTES[0]; }
  function depthColor(d) { return palette().colors[d % palette().colors.length]; }

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

    const root = { text: items[0].content, children: [], depth: 0, leaves: 1, parent: null };
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

  /* ---------- 测宽 / 换行 ---------- */
  function wrapText(ctx, text, maxW) {
    const lines = [];
    let cur = "";
    for (const ch of text) {
      if (cur && ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }
  function measureAll(root) {
    (function walk(n) {
      meas.font = n.depth === 0 ? FONT_B : FONT;
      n.lines = wrapText(meas, n.text, MAX_TEXT);
      const wMax = Math.max(...n.lines.map(l => meas.measureText(l).width));
      n.w = Math.max(56, wMax + (n.depth === 0 ? 32 : 24));
      n.h = Math.max(30, n.lines.length * LINE_H + (n.depth === 0 ? 22 : 14));
      n.children.forEach(walk);
    })(root);
  }
  function walkAll(n, fn) { fn(n); n.children.forEach(c => walkAll(c, fn)); }

  /* ---------- 布局：逻辑图（左→右） ---------- */
  function placeTree(root) {
    const byDepth = [];
    walkAll(root, n => { (byDepth[n.depth] = byDepth[n.depth] || []).push(n); });
    const colX = []; let x = 0;
    for (let d = 0; d < byDepth.length; d++) { colX[d] = x; x += Math.max(...byDepth[d].map(n => n.w)) + COL_GAP; }
    (function place(n) {
      if (!n.children.length) { n._rel = 0; n._span = n.h; return; }
      let total = 0;
      n.children.forEach(c => { place(c); total += c._span; });
      total += GAP * (n.children.length - 1);
      n._span = Math.max(n.h, total);
      let y = -total / 2;
      n.children.forEach(c => { c._rel = y + c._span / 2; y += c._span + GAP; });
    })(root);
    (function assign(n, y) { n.x = colX[n.depth]; n.y = y; n.children.forEach(c => assign(c, y + c._rel)); })(root, 0);
  }

  /* ---------- 布局：组织图（上→下） ---------- */
  function placeOrg(root) {
    const byDepth = [];
    walkAll(root, n => { (byDepth[n.depth] = byDepth[n.depth] || []).push(n); });
    const rowY = []; let y = 0;
    for (let d = 0; d < byDepth.length; d++) { rowY[d] = y; y += Math.max(...byDepth[d].map(n => n.h)) + ROW_GAP; }
    (function place(n) {
      if (!n.children.length) { n._rel = 0; n._span = n.w; return; }
      let total = 0;
      n.children.forEach(c => { place(c); total += c._span; });
      total += GAP * (n.children.length - 1);
      n._span = Math.max(n.w, total);
      let xx = -total / 2;
      n.children.forEach(c => { c._rel = xx + c._span / 2; xx += c._span + GAP; });
    })(root);
    (function assign(n, x) { n.x = x; n.y = rowY[n.depth]; n.children.forEach(c => assign(c, x + c._rel)); })(root, 0);
  }

  /* ---------- 布局：辐射图（中心向外） ---------- */
  function placeRadial(root) {
    const byDepth = [];
    walkAll(root, n => { (byDepth[n.depth] = byDepth[n.depth] || []).push(n); });
    const R0 = 78, RING_PAD = 56;
    /* 环半径需同时满足：环向堆叠高度 + 该环所有盒宽排满圆周长（72% 利用率） */
    const hReq = d => R0 + byDepth.slice(1, d + 1).reduce((a, grp) => a + Math.max(...grp.map(n => n.h)) + RING_PAD, 0);
    const wReq = d => 46 + (byDepth[d] || []).reduce((a, n) => a + n.w, 0) / (2 * Math.PI * 0.72);
    const req = byDepth.map((g, d) => Math.max(hReq(d), wReq(d)));
    const rAt = d => { if (d === 0) return 0; let m = 0; for (let j = 1; j <= d; j++) m = Math.max(m, req[j]); return m; };
    (function place(n, a0, a1) {
      const r = rAt(n.depth);
      const ang = (a0 + a1) / 2;
      n.ang = ang;
      n.x = Math.cos(ang) * r; n.y = Math.sin(ang) * r;
      if (!n.children.length) return;
      let acc = a0;
      n.children.forEach(c => {
        const span = (a1 - a0) * c.leaves / n.leaves;
        place(c, acc, acc + span);
        acc += span;
      });
    })(root, -Math.PI / 2, Math.PI * 1.5);

    /* 同环防重叠：按角度推挤 3 轮 */
    for (let d = 1; d < byDepth.length; d++) {
      const ring = byDepth[d];
      if (ring.length < 2) continue;
      const r = rAt(d);
      ring.sort((a, b) => a.ang - b.ang);
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length];
          let da = (b.ang - a.ang) % (Math.PI * 2);
          if (da < 0) da += Math.PI * 2;
          const need = (a.w + b.w) / (2 * r) + 0.045;
          if (da < need) { const push = (need - da) / 2; a.ang -= push; b.ang += push; }
        }
      }
      ring.forEach(n => { n.x = Math.cos(n.ang) * r; n.y = Math.sin(n.ang) * r; });
    }
  }

  /* ---------- 布局：鱼骨图（头在左，因果大骨上下交错） ---------- */
  function placeFishbone(root) {
    const ANG = 0.62;                        /* 大骨与中脊夹角 ≈35.5° */
    const COS = Math.cos(ANG), SIN = Math.sin(ANG);
    root.x = root.w / 2 + 30; root.y = 0;    /* 鱼头 */
    const mains = root.children;
    let baseX = root.w + 52;                 /* 中脊起点（紧跟鱼头） */
    let spineEnd = baseX;
    mains.forEach((m, i) => {
      const up = i % 2 === 0;                /* 大骨上下交错 */
      const subs = m.children;
      const boneLen = 92 + subs.length * 62;
      const ex = baseX + COS * boneLen;
      const ey = (up ? -1 : 1) * SIN * boneLen;
      m.x = ex + COS * (8 + m.w / 2);
      m.y = ey + (up ? -1 : 1) * SIN * (8 + m.h / 2);
      m._boneStart = { x: baseX, y: 0 };
      m._boneEnd = { x: ex, y: ey };
      subs.forEach((s, j) => {
        const t = (j + 1) / (subs.length + 1);
        const px = baseX + (ex - baseX) * t;
        const py = ey * t;
        const rib = up ? -46 : 46;
        s.x = px;                            /* 文字中心（中骨头侧） */
        s.y = py + rib - 7;
        s._textOnly = true;                  /* 鱼骨小骨：文字标签，不画盒子 */
        s._rib = { x1: px, y1: py, x2: px, y2: py + rib };
        let sub = [];
        (function deep(n) { n.children.forEach(c => { sub.push(c.text); deep(c); }); })(s);
        s._subText = (sub.join(" · ") || "").slice(0, 64);
        meas.font = FONT_S;
        let tw = meas.measureText(s.text).width;
        if (s._subText) { meas.font = FONT_XS; tw = Math.max(tw, meas.measureText(s._subText).width); }
        s.tw = tw + 10; s.th = 17 + (s._subText ? 13 : 0);
        s.children.forEach(c => (c._skip = true));  /* 第 3 层起合并为小字 */
      });
      spineEnd = Math.max(spineEnd, ex);
      baseX = ex + 46;
    });
    root._spine = { x1: root.x + root.w / 2, y1: 0, x2: spineEnd + 14, y2: 0 };
  }

  /* ---------- 建模：布局 + 归一化 + 边 ---------- */
  function buildModel(text) {
    const root = parseTree(text);
    if (!root) return null;
    measureAll(root);
    if (state.layout === "fishbone") placeFishbone(root);
    else if (state.layout === "radial") placeRadial(root);
    else if (state.layout === "org") placeOrg(root);
    else placeTree(root);

    /* 归一化到 (pad, pad) 并求视口 */
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    walkAll(root, n => {
      if (n._skip) return;
      const ex = n._textOnly ? n.tw / 2 + 4 : n.w / 2;
      const ey = n._textOnly ? n.th / 2 + 4 : n.h / 2;
      if (n.x - ex < minX) minX = n.x - ex;
      if (n.y - ey < minY) minY = n.y - ey;
      if (n.x + ex > maxX) maxX = n.x + ex;
      if (n.y + ey > maxY) maxY = n.y + ey;
    });
    const pad = 30;
    const dx = pad - minX, dy = pad - minY;
    walkAll(root, n => {
      n.x += dx; n.y += dy;
      if (n._rib) { n._rib.x1 += dx; n._rib.y1 += dy; n._rib.x2 += dx; n._rib.y2 += dy; }
      if (n._boneStart) { n._boneStart.x += dx; n._boneStart.y += dy; n._boneEnd.x += dx; n._boneEnd.y += dy; }
    });
    if (root._spine) { root._spine.x1 += dx; root._spine.y1 += dy; root._spine.x2 += dx; root._spine.y2 += dy; }
    const vb = {
      w: Math.max(720, Math.round((maxX - minX) + pad * 2)),
      h: Math.max(420, Math.round((maxY - minY) + pad * 2)),
    };
    const lineStyle = state.line === "elbow" && !(state.layout === "tree" || state.layout === "org") ? "straight" : state.line;
    return { root, vb, edges: buildEdges(root, lineStyle) };
  }

  function buildEdges(root, lineStyle) {
    const edges = [];
    walkAll(root, n => {
      if (!n.parent || n._skip) return;
      const p = n.parent;
      const color = depthColor(p.depth);

      /* 鱼骨：中脊 + 大骨线 + 小骨竖线 */
      if (state.layout === "fishbone") {
        if (n._textOnly) {
          edges.push({ d: `M${n._rib.x1} ${n._rib.y1} L${n._rib.x2} ${n._rib.y2}`, color, a: 0.7 });
          return;
        }
        if (n === root.children[0]) edges.push({ d: `M${root._spine.x1} ${root._spine.y1} L${root._spine.x2} ${root._spine.y2}`, color: depthColor(0), a: 0.85, w: 1.8 });
        const b = n._boneStart, e = n._boneEnd;
        edges.push({ d: `M${b.x} ${b.y} L${e.x} ${e.y}`, color, a: 0.8, w: 1.6 });
        return;
      }

      let x1, y1, x2, y2;
      if (state.layout === "tree") { x1 = p.x + p.w / 2; y1 = p.y; x2 = n.x - n.w / 2; y2 = n.y; }
      else if (state.layout === "org") { x1 = p.x; y1 = p.y + p.h / 2; x2 = n.x; y2 = n.y - n.h / 2; }
      else { x1 = p.x; y1 = p.y; x2 = n.x; y2 = n.y; }

      const dx = x2 - x1, dy = y2 - y1;
      let d;
      if (lineStyle === "straight") d = `M${x1} ${y1} L${x2} ${y2}`;
      else if (lineStyle === "elbow") {
        if (state.layout === "tree") { const mx = x1 + dx / 2; d = `M${x1} ${y1} L${mx} ${y1} L${mx} ${y2} L${x2} ${y2}`; }
        else { const my = y1 + dy / 2; d = `M${x1} ${y1} L${x1} ${my} L${x2} ${my} L${x2} ${y2}`; }
      } else {
        if (state.layout === "tree") d = `M${x1} ${y1} C${x1 + dx * 0.45} ${y1}, ${x2 - dx * 0.45} ${y2}, ${x2} ${y2}`;
        else if (state.layout === "org") d = `M${x1} ${y1} C${x1} ${y1 + dy * 0.45}, ${x2} ${y2 - dy * 0.45}, ${x2} ${y2}`;
        else { const mx = x1 + dx / 2 + dy * 0.16, my = y1 + dy / 2 - dx * 0.16; d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`; }
      }
      edges.push({ d, color });
    });
    return edges;
  }

  /* ---------- 主题 / 背景 ---------- */
  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(n >> 16 & 255) + 0.7152 * f(n >> 8 & 255) + 0.0722 * f(n & 255);
  }
  function theme() {
    const css = getComputedStyle(document.documentElement);
    const bg = state.bg === "theme"
      ? (css.getPropertyValue("--surface").trim() || "#FBF8EF")
      : state.bg;
    /* 依据背景明暗自动配文字颜色，保证任意底色可读 */
    const dark = luminance(bg) < 0.35;
    return {
      bg,
      ink: dark ? "#E9E2CE" : "#262117",
      ink2: dark ? "#A79E87" : "#5F5745",
    };
  }

  /* ---------- 背景花纹 ---------- */
  function drawPattern(ctx, vb, t) {
    const p = state.pattern;
    if (p === "none") return;
    ctx.save();
    ctx.strokeStyle = t.ink;
    ctx.fillStyle = t.ink;
    ctx.lineWidth = 1;
    if (p === "grid") {
      ctx.globalAlpha = 0.07;
      const step = 24;
      ctx.beginPath();
      for (let x = 0; x <= vb.w; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, vb.h); }
      for (let y = 0; y <= vb.h; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(vb.w, y + .5); }
      ctx.stroke();
    } else if (p === "dots") {
      ctx.globalAlpha = 0.13;
      const step = 22, r = 1.1;
      ctx.beginPath();
      for (let y = step / 2; y < vb.h; y += step) {
        for (let x = step / 2; x < vb.w; x += step) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
      }
      ctx.fill();
    } else if (p === "diag") {
      ctx.globalAlpha = 0.06;
      const step = 26;
      ctx.beginPath();
      for (let d = -vb.h; d < vb.w + vb.h; d += step) { ctx.moveTo(d, 0); ctx.lineTo(d + vb.h, vb.h); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function patternDefs(t) {
    const ink = t.ink;
    if (state.pattern === "grid") return { defs: `<pattern id="gbg" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 24 L24 24 M24 0 L24 24" fill="none" stroke="${ink}" stroke-width="1" opacity="0.07"/></pattern>`, url: "url(#gbg)" };
    if (state.pattern === "dots") return { defs: `<pattern id="pbg" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.1" fill="${ink}" opacity="0.13"/></pattern>`, url: "url(#pbg)" };
    if (state.pattern === "diag") return { defs: `<pattern id="dbg" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0 0 L26 26" fill="none" stroke="${ink}" stroke-width="1" opacity="0.06"/></pattern>`, url: "url(#dbg)" };
    return null;
  }

  /* ---------- 路径 ---------- */
  function roundedPath(p, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    p.moveTo(x + r, y);
    p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
    p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
    p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
    p.closePath();
  }
  function hexD(x, y, w, h) {
    const k = Math.min(w, h) * 0.28;
    return `M${x + k} ${y} L${x + w - k} ${y} L${x + w} ${y + h / 2} L${x + w - k} ${y + h} L${x + k} ${y + h} L${x} ${y + h / 2} Z`;
  }
  function nodePath(n, shape) {
    const p = new Path2D();
    const x = n.x - n.w / 2, y = n.y - n.h / 2;
    if (shape === "ellipse") p.ellipse(n.x, n.y, n.w / 2, n.h / 2, 0, 0, Math.PI * 2);
    else if (shape === "hex") p.addPath(new Path2D(hexD(x, y, n.w, n.h)));
    else roundedPath(p, x, y, n.w, n.h, shape === "capsule" ? n.h / 2 : 8);
    return p;
  }

  /* ---------- 绘制画布 ---------- */
  function drawScene(ctx, model) {
    const t = theme();
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, model.vb.w, model.vb.h);
    drawPattern(ctx, model.vb, t);

    ctx.lineCap = "round"; ctx.lineJoin = "round";
    model.edges.forEach(e => {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = e.w || 1.6;
      ctx.globalAlpha = e.a == null ? 0.55 : e.a;
      ctx.stroke(new Path2D(e.d));
    });
    ctx.globalAlpha = 1;

    const nodes = [];
    walkAll(model.root, n => { if (!n._skip) nodes.push(n); });
    nodes.sort((a, b) => a.depth - b.depth);
    nodes.forEach(n => {
      if (n._textOnly) {
        ctx.font = FONT_S;
        ctx.fillStyle = t.ink;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(n.text, n.x, n.y);
        if (n._subText) {
          ctx.font = FONT_XS;
          ctx.fillStyle = t.ink2;
          ctx.fillText(n._subText, n.x, n.y + 13);
        }
        return;
      }
      const color = depthColor(n.depth);
      const p = nodePath(n, state.shape);
      if (n.depth === 0) { ctx.fillStyle = color; ctx.fill(p); }
      else {
        ctx.fillStyle = t.bg; ctx.fill(p);
        ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke(p);
      }
      ctx.font = n.depth === 0 ? FONT_B : FONT;
      ctx.fillStyle = n.depth === 0 ? "#FBF8EF" : t.ink;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      n.lines.forEach((l, i) => ctx.fillText(l, n.x, n.y + (i - (n.lines.length - 1) / 2) * LINE_H));
    });
  }

  /* ---------- 预览显示：适配/缩放，画布盒随内容自适应 ---------- */
  let zoom = "fit"; /* "fit" 或 0.4~3 的倍率 */
  try {
    const z = parseFloat(localStorage.getItem("gewu-k05-zoom") || "");
    if (isFinite(z) && z >= 0.4 && z <= 3) zoom = z;
  } catch (_) {}

  function fitCanvas(vb) {
    const box = canvas.parentElement;
    const availW = Math.max(200, box.clientWidth - 2);
    const maxH = Math.min(860, Math.round(window.innerHeight * 0.66));
    let dispW, dispH;
    if (zoom === "fit") {
      dispW = availW;
      dispH = dispW * vb.h / vb.w;
      if (dispH > maxH) { dispH = maxH; dispW = dispH * vb.w / vb.h; }
    } else {
      dispW = availW * zoom;
      dispH = dispW * vb.h / vb.w;
    }
    canvas.style.width = Math.round(dispW) + "px";
    canvas.style.height = Math.round(dispH) + "px";
    canvas.style.marginLeft = Math.max(0, Math.round((availW - dispW) / 2)) + "px";
    updateZoomUI();
  }
  function updateZoomUI() {
    const v = $("#zoom-val");
    if (v) v.textContent = zoom === "fit" ? "适配" : Math.round(zoom * 100) + "%";
  }
  function setZoom(z) {
    zoom = z;
    try { localStorage.setItem("gewu-k05-zoom", String(z)); } catch (_) {}
    render();
  }

  function render() {
    const model = buildModel($("#outline").value);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const ctx = canvas.getContext("2d");
    if (!model) {
      const vb = { w: 760, h: 300 };
      canvas.width = vb.w * dpr; canvas.height = vb.h * dpr;
      fitCanvas(vb);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = theme();
      ctx.fillStyle = t.bg; ctx.fillRect(0, 0, vb.w, vb.h);
      ctx.font = FONT; ctx.fillStyle = t.ink2;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("在左侧输入大纲（第一行为中心主题），导图将自动生成", vb.w / 2, vb.h / 2);
      if (info) info.textContent = "—";
      return;
    }
    canvas.width = Math.round(model.vb.w * dpr);
    canvas.height = Math.round(model.vb.h * dpr);
    fitCanvas(model.vb);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene(ctx, model);
    if (info) info.textContent = `${model.vb.w} × ${model.vb.h}`;
  }

  /* ---------- SVG 导出 ---------- */
  function svgOf() {
    const model = buildModel($("#outline").value);
    if (!model) return null;
    const t = theme();
    const esc = GEWU.esc;
    const pat = patternDefs(t);
    const s = [`<svg xmlns="http://www.w3.org/2000/svg" width="${model.vb.w}" height="${model.vb.h}" viewBox="0 0 ${model.vb.w} ${model.vb.h}">`,
      `<rect width="${model.vb.w}" height="${model.vb.h}" fill="${t.bg}"/>`];
    if (pat) { s.push(`<defs>${pat.defs}</defs>`); s.push(`<rect width="${model.vb.w}" height="${model.vb.h}" fill="${pat.url}"/>`); }
    model.edges.forEach(e => s.push(`<path d="${e.d}" fill="none" stroke="${e.color}" stroke-width="${e.w || 1.6}" stroke-linecap="round" opacity="${e.a == null ? 0.55 : e.a}"/>`));
    const nodes = [];
    walkAll(model.root, n => { if (!n._skip) nodes.push(n); });
    nodes.sort((a, b) => a.depth - b.depth);
    nodes.forEach(n => {
      if (n._textOnly) {
        s.push(`<text x="${n.x}" y="${n.y + 4}" font-size="12" font-weight="600" text-anchor="middle" fill="${t.ink}">${esc(n.text)}</text>`);
        if (n._subText) s.push(`<text x="${n.x}" y="${n.y + 17}" font-size="10.5" text-anchor="middle" fill="${t.ink2}">${esc(n._subText)}</text>`);
        return;
      }
      const color = depthColor(n.depth);
      const x = n.x - n.w / 2, y = n.y - n.h / 2;
      const fill = n.depth === 0 ? color : t.bg;
      const stroke = n.depth > 0 ? ` stroke="${color}" stroke-width="1.6"` : "";
      if (state.shape === "ellipse") s.push(`<ellipse cx="${n.x}" cy="${n.y}" rx="${n.w / 2}" ry="${n.h / 2}" fill="${fill}"${stroke}/>`);
      else if (state.shape === "hex") s.push(`<path d="${hexD(x, y, n.w, n.h)}" fill="${fill}"${stroke}/>`);
      else s.push(`<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${state.shape === "capsule" ? n.h / 2 : 8}" fill="${fill}"${stroke}/>`);
      const fs = n.depth === 0 ? 14 : 13;
      n.lines.forEach((l, i) => s.push(`<text x="${n.x}" y="${n.y + (i - (n.lines.length - 1) / 2) * LINE_H + 5}" font-family="'Noto Sans SC','PingFang SC',sans-serif" font-size="${fs}" text-anchor="middle" fill="${n.depth === 0 ? "#FBF8EF" : t.ink}">${esc(l)}</text>`));
    });
    s.push("</svg>");
    return s.join("");
  }

  /* ---------- UI ---------- */
  function setState(k, v) {
    state[k] = v;
    try { localStorage.setItem("gewu-k05-style", JSON.stringify(state)); } catch (_) {}
    syncUI();
    render();
  }
  function syncUI() {
    $$("#seg-layout button").forEach(b => b.classList.toggle("active", b.dataset.v === state.layout));
    $$("#seg-shape button").forEach(b => b.classList.toggle("active", b.dataset.v === state.shape));
    $$("#seg-line button").forEach(b => b.classList.toggle("active", b.dataset.v === state.line));
    $$("#seg-pattern button").forEach(b => b.classList.toggle("active", b.dataset.v === state.pattern));
    $$("#palettes .pal").forEach(b => b.classList.toggle("active", b.dataset.v === state.palette));
    $$("#bg-palettes .bgsw").forEach(b => b.classList.toggle("active", b.dataset.v === state.bg));
    const custom = $("#bg-custom");
    if (custom) {
      if (/^#[0-9a-fA-F]{6}$/.test(state.bg)) custom.value = state.bg;
      custom.classList.toggle("active", /^#[0-9a-fA-F]{6}$/.test(state.bg));
    }
  }

  function initUI() {
    $$("#seg-layout button").forEach(b => b.addEventListener("click", () => setState("layout", b.dataset.v)));
    $$("#seg-shape button").forEach(b => b.addEventListener("click", () => setState("shape", b.dataset.v)));
    $$("#seg-line button").forEach(b => b.addEventListener("click", () => setState("line", b.dataset.v)));
    $$("#seg-pattern button").forEach(b => b.addEventListener("click", () => setState("pattern", b.dataset.v)));

    const holder = $("#palettes");
    PALETTES.forEach(p => {
      const b = document.createElement("button");
      b.className = "pal";
      b.type = "button";
      b.dataset.v = p.id;
      b.title = p.name;
      b.setAttribute("aria-label", `配色：${p.name}`);
      b.innerHTML = p.colors.map(c => `<i style="background:${c}"></i>`).join("");
      b.addEventListener("click", () => setState("palette", p.id));
      holder.appendChild(b);
    });

    const bgHolder = $("#bg-palettes");
    BG_PRESETS.forEach(p => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bgsw";
      b.dataset.v = p.id;
      b.title = p.name;
      b.setAttribute("aria-label", `背景：${p.name}`);
      if (p.id === "theme") b.classList.add("theme");
      else b.style.background = p.id;
      b.addEventListener("click", () => setState("bg", p.id));
      bgHolder.appendChild(b);
    });
    const custom = $("#bg-custom");
    if (custom) custom.addEventListener("input", () => setState("bg", custom.value));

    syncUI();
  }

  /* ---------- 事件 ---------- */
  $("#render").addEventListener("click", render);
  $("#outline").addEventListener("input", render);
  const zOut = $("#zoom-out"), zIn = $("#zoom-in"), zFit = $("#zoom-fit");
  if (zOut) zOut.addEventListener("click", () => setZoom(Math.max(0.4, (zoom === "fit" ? 1 : zoom) / 1.25)));
  if (zIn) zIn.addEventListener("click", () => setZoom(Math.min(3, (zoom === "fit" ? 1 : zoom) * 1.25)));
  if (zFit) zFit.addEventListener("click", () => setZoom("fit"));
  window.addEventListener("resize", render);
  if ("MutationObserver" in window) {
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  $("#dl-png").addEventListener("click", () => {
    const model = buildModel($("#outline").value);
    if (!model) { GEWU.toast("请先输入大纲"); return; }
    const out = document.createElement("canvas");
    const s = 2;
    out.width = Math.round(model.vb.w * s);
    out.height = Math.round(model.vb.h * s);
    const ctx = out.getContext("2d");
    ctx.setTransform(s, 0, 0, s, 0, 0);
    drawScene(ctx, model);
    out.toBlob(b => { if (b) GEWU.downloadBlob(b, `mindmap-${state.layout}-${state.palette}.png`); }, "image/png");
  });
  $("#dl-svg").addEventListener("click", () => {
    const svg = svgOf();
    if (svg) GEWU.downloadText(svg, `mindmap-${state.layout}-${state.palette}.svg`, "image/svg+xml");
    else GEWU.toast("请先输入大纲");
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
    render();
  });

  renderRelated($("#related"), ["V-04", "V-02", "K-01"]);
  initUI();
  $("#sample").click();
})();
