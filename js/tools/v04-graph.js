/* V-04 关系图谱：力导向布局 + 拖拽 + 有向箭头 + PNG 导出 */
(function () {
  "use strict";
  const $ = GEWU.$;
  const canvas = $("#graph");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  let nodes = [], edges = [], nodeMap = {};
  let simTimer = null, running = false;
  let dragNode = null;

  /* ---------- 解析 ---------- */
  function parseEdges(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const edgeList = [];
    const map = {};
    for (const line of lines) {
      const parts = line.split(/[,\s\t]+/).filter(Boolean);
      if (parts.length < 2) continue;
      const [a, b] = parts;
      const w = parts.length >= 3 ? parseFloat(parts[2]) : 1;
      if (!map[a]) map[a] = { id: a, deg: 0 };
      if (!map[b]) map[b] = { id: b, deg: 0 };
      edgeList.push({ a, b, w: isFinite(w) && w > 0 ? w : 1 });
    }
    return { edgeList, map };
  }

  function build() {
    const { edgeList, map } = parseEdges($("#edges").value);
    nodes = Object.values(map);
    edges = edgeList;
    nodeMap = map;
    nodes.forEach((n, i) => {
      const ang = i / nodes.length * Math.PI * 2;
      n.x = W / 2 + Math.cos(ang) * 140;
      n.y = H / 2 + Math.sin(ang) * 110;
      n.vx = 0; n.vy = 0;
    });
    edges.forEach(e => { nodeMap[e.a].deg++; nodeMap[e.b].deg++; });
  }

  /* ---------- 力模拟 ---------- */
  const K_REP = 2200, K_SPRING = 0.06, LEN = 90, K_CENTER = 0.012, DT = 0.35, MAXV = 8;

  function step() {
    /* 斥力 */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 4) { d2 = 4; dx = (Math.random() - 0.5) * 4; dy = (Math.random() - 0.5) * 4; }
        const d = Math.sqrt(d2);
        const f = K_REP / d2;
        const fx = dx / d * f, fy = dy / d * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    /* 弹簧 */
    for (const e of edges) {
      const a = nodeMap[e.a], b = nodeMap[e.b];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = K_SPRING * (d - LEN) * e.w;
      const fx = dx / d * f, fy = dy / d * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
    /* 向心 */
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * K_CENTER;
      n.vy += (H / 2 - n.y) * K_CENTER;
    }
    let maxDisp = 0;
    for (const n of nodes) {
      n.vx = Math.max(-MAXV, Math.min(MAXV, n.vx));
      n.vy = Math.max(-MAXV, Math.min(MAXV, n.vy));
      n.x += n.vx * DT; n.y += n.vy * DT;
      n.x = Math.max(14, Math.min(W - 14, n.x));
      n.y = Math.max(14, Math.min(H - 14, n.y));
      n.vx *= 0.86; n.vy *= 0.86;
      maxDisp = Math.max(maxDisp, Math.abs(n.vx) + Math.abs(n.vy));
    }
    draw();
    return maxDisp;
  }

  function startSim() {
    stopSim();
    running = true;
    let iter = 0;
    simTimer = setInterval(() => {
      const d = step();
      if (++iter > 900 || d < 0.06) stopSim();
    }, 16);
  }
  function stopSim() {
    if (simTimer) { clearInterval(simTimer); simTimer = null; }
    running = false;
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--surface").trim() || "#FBF8EF";
    const lineC = css.getPropertyValue("--line-strong").trim() || "#B6AA8C";
    const textC = css.getPropertyValue("--ink-3").trim() || "#8D8470";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const directed = $("#directed").checked;
    const showLabels = $("#labels").checked;
    const maxDeg = Math.max(1, ...nodes.map(n => n.deg));

    /* 边 */
    for (const e of edges) {
      const a = nodeMap[e.a], b = nodeMap[e.b];
      if (!a || !b) continue;
      ctx.strokeStyle = lineC;
      ctx.globalAlpha = 0.28 + 0.5 * Math.min(1, e.w / 3);
      ctx.lineWidth = 0.8 + Math.min(2.6, e.w * 0.7);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (directed) {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const r = nodeR(b);
        const hx = b.x - Math.cos(ang) * (r + 6), hy = b.y - Math.sin(ang) * (r + 6);
        ctx.fillStyle = lineC;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9);
        ctx.lineTo(hx + Math.cos(ang + 2.5) * 9, hy + Math.sin(ang + 2.5) * 9);
        ctx.lineTo(hx + Math.cos(ang - 2.5) * 9, hy + Math.sin(ang - 2.5) * 9);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* 节点 */
    const colorBlue = css.getPropertyValue("--blue").trim() || "#25548F";
    const colorAccent = css.getPropertyValue("--accent").trim() || "#C03A22";
    const colorGreen = css.getPropertyValue("--green").trim() || "#3B6B4E";
    for (const n of nodes) {
      const r = nodeR(n);
      const t = n.deg / maxDeg;
      ctx.fillStyle = t > 0.66 ? colorAccent : t > 0.33 ? colorBlue : colorGreen;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = bg; ctx.lineWidth = 2; ctx.stroke();
      if (showLabels) {
        ctx.fillStyle = textC;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(n.id, n.x, n.y + r + 4);
      }
    }
  }
  function nodeR(n) {
    const maxDeg = Math.max(1, ...nodes.map(x => x.deg));
    return 6 + 8 * (n.deg / maxDeg);
  }

  /* ---------- 拖拽 ---------- */
  canvas.addEventListener("mousedown", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * W;
    const my = (e.clientY - rect.top) / rect.height * H;
    for (const n of nodes) {
      const d = Math.hypot(n.x - mx, n.y - my);
      if (d < Math.max(14, nodeR(n) + 6)) { dragNode = n; stopSim(); n.vx = n.vy = 0; break; }
    }
  });
  window.addEventListener("mouseup", () => { dragNode = null; startSim(); });
  canvas.addEventListener("mousemove", e => {
    if (!dragNode) return;
    const rect = canvas.getBoundingClientRect();
    dragNode.x = (e.clientX - rect.left) / rect.width * W;
    dragNode.y = (e.clientY - rect.top) / rect.height * H;
    draw();
  });

  /* ---------- 统计 ---------- */
  function renderStats() {
    if (!nodes.length) { $("#stats").innerHTML = '<span class="muted">输入边表后显示统计</span>'; return; }
    const degs = nodes.map(n => n.deg).sort((a, b) => b - a);
    const avg = degs.reduce((a, b) => a + b, 0) / Math.max(1, nodes.length);
    $("#stats").innerHTML = `
      <div class="form-row" style="gap:14px;margin-bottom:4px">
        <span><b>节点</b> ${nodes.length}</span>
        <span><b>边</b> ${edges.length}</span>
        <span><b>平均度</b> ${GEWU.fmtNum(avg, 3)}</span>
      </div>
      <div class="muted" style="font-size:.74rem">度最高的节点：${nodes.slice().sort((a, b) => b.deg - a.deg).slice(0, 4).map(n => `${n.id}(${n.deg})`).join(" · ")}</div>`;
  }

  /* ---------- 事件 ---------- */
  $("#layout").addEventListener("click", () => { build(); startSim(); renderStats(); });
  $("#directed").addEventListener("change", draw);
  $("#labels").addEventListener("change", draw);
  $("#sample").addEventListener("click", () => {
    $("#edges").value = `Transformer,Attention
Transformer,Self-Attention
Transformer,Multi-Head
Transformer,Positional Encoding
Attention,Scaled Dot-Product
Attention,Softmax
Multi-Head,Attention
Multi-Head,Concat
BERT,Transformer
BERT,Pre-training
GPT,Transformer
GPT,Decoder
GPT,Autoregressive
LLaMA,Transformer
LLaMA,RoPE
RoPE,Positional Encoding
ViT,Transformer
ViT,Patch Embedding
ViT,Image Classification
CLIP,Vision Encoder
CLIP,Text Encoder
CLIP,Contrastive Learning
DALL-E,CLIP
Diffusion,UNet
Stable Diffusion,Diffusion
Stable Diffusion,CLIP
Stable Diffusion,VAE
ResNet,Residual Connection
ResNet,Image Classification
ViT,ResNet`;
    build(); startSim(); renderStats();
  });
  $("#dl-png").addEventListener("click", () => GEWU.downloadCanvas(canvas, "graph.png", 2));

  renderRelated($("#related"), ["V-03", "V-02", "K-05"]);
  build(); startSim(); renderStats();
})();
