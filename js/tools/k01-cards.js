/* K-01 知识卡片：MD → canvas 竖版卡片 / 长图导出 */
(function () {
  "use strict";
  const $ = GEWU.$;

  const THEMES = {
    paper:     { bg: "#F7F1E2", ink: "#2B2620", accent: "#C03A22", sub: "#8A8170", code: "#EFE6CE", line: "#D8CEB6" },
    indigo:    { bg: "#20395E", ink: "#F2F0E8", accent: "#E8B84B", sub: "#B4C8DE", code: "#2A4A75", line: "#3D5A85" },
    vermilion: { bg: "#F6E9E0", ink: "#3A241C", accent: "#C03A22", sub: "#9A7B6E", code: "#EED8CC", line: "#E0C8B8" },
    ink:       { bg: "#17150F", ink: "#E9E2CF", accent: "#D8A03C", sub: "#8F8770", code: "#241F16", line: "#33301F" },
  };

  let cards = [];
  let current = 0;

  /* ---------- Markdown 分块 ---------- */
  function splitCards(src) {
    const lines = src.split(/\r?\n/);
    const docTitle = (lines.find(l => /^# /.test(l)) || "").replace(/^#\s+/, "").trim();
    const blocks = [];
    let cur = [];
    for (const line of lines) {
      if (/^\s*---\s*$/.test(line) || /^##\s+/.test(line)) {
        if (cur.length) blocks.push(cur);
        cur = [line];
      } else {
        cur.push(line);
      }
    }
    if (cur.length) blocks.push(cur);
    if (!blocks.length) blocks.push([]);

    return blocks.map(b => {
      const title = (b.find(l => /^##\s+/.test(l)) || "").replace(/^##\s+/, "").trim();
      const body = b.filter(l => !/^##\s+/.test(l));
      return { title, body, docTitle };
    });
  }

  /* ---------- 行内解析：**bold** `code` ---------- */
  function inlineRuns(text, theme, baseSize) {
    const runs = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) runs.push({ text: text.slice(last, m.index), style: null });
      if (m[1].startsWith("**")) runs.push({ text: m[1].slice(2, -2), style: "bold", color: theme.ink });
      else runs.push({ text: m[1].slice(1, -1), style: "code", color: theme.accent });
      last = m.index + m[1].length;
    }
    if (last < text.length) runs.push({ text: text.slice(last), style: null });
    return runs;
  }

  function wrapRuns(ctx, runs, maxW) {
    const lines = [];
    let cur = [], curW = 0;
    const flush = () => { if (cur.length) { lines.push(cur); cur = []; curW = 0; } };
    for (const run of runs) {
      ctx.font = runFont(run);
      for (const ch of run.text) {
        const w = ctx.measureText(ch).width;
        if (curW + w > maxW && curW > 0) flush();
        cur.push({ ch, run });
        curW += w;
      }
    }
    flush();
    return lines;
  }
  function runFont(run, base) {
    if (run.style === "bold") return `700 ${base}px "Noto Serif SC", "Songti SC", serif`;
    if (run.style === "code") return `${base - 2}px "JetBrains Mono", monospace`;
    return `${base}px "Noto Sans SC", "PingFang SC", sans-serif`;
  }

  /* ---------- 卡片绘制 ---------- */
  function drawCard(canvas, card, idx, total, themeKey, ratio) {
    const theme = THEMES[themeKey];
    const W = 720, H = ratio === "11" ? 720 : 960;
    const dpr = 2;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    const pad = 64;
    const maxW = W - pad * 2;
    let y = pad;

    /* 顶部装饰：主题 + 序号 */
    ctx.fillStyle = theme.accent;
    ctx.fillRect(pad, y, 46, 5);
    y += 18;
    ctx.fillStyle = theme.sub;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText("GEWU · 知识卡片", pad, y);
    ctx.textAlign = "right";
    ctx.fillText(`${idx + 1} / ${total}`, W - pad, y);
    ctx.textAlign = "left";
    y += 34;

    /* 文档标题（第一张） */
    if (idx === 0 && card.docTitle) {
      ctx.fillStyle = theme.ink;
      ctx.font = '900 42px "Noto Serif SC", "Songti SC", serif';
      wrapRuns(ctx, [{ text: card.docTitle, style: null }], maxW).forEach((line, i) => {
        const lh = 56;
        ctx.fillText(line.map(r => r.ch).join(""), pad, y + i * lh);
      });
      y += Math.ceil(wrapRuns(ctx, [{ text: card.docTitle, style: null }], maxW).length) * 56 + 8;
    }

    /* 卡片标题 */
    if (card.title) {
      ctx.fillStyle = theme.accent;
      ctx.font = '700 34px "Noto Serif SC", "Songti SC", serif';
      const tLines = wrapRuns(ctx, [{ text: card.title, style: null }], maxW);
      tLines.forEach((line, i) => ctx.fillText(line.map(r => r.ch).join(""), pad, y + i * 46));
      y += tLines.length * 46 + 6;
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(pad, y - 8, 58, 3);
      ctx.globalAlpha = 1;
      y += 22;
    }

    /* 正文 */
    const bodyFontBase = ratio === "11" ? 24 : 27;
    let size = bodyFontBase;
    let bodyStartY = y;
    while (size > 17) {
      const fit = drawBody(ctx, card.body, pad, maxW, size, theme, true, 0);
      if (fit <= H - bodyStartY - 90) break;
      size -= 2;
    }
    drawBody(ctx, card.body, pad, maxW, size, theme, false, bodyStartY);

    /* 底部 */
    ctx.fillStyle = theme.sub;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText("格物致知 · 纯前端生成", pad, H - 34);

    canvas._scale = dpr;
  }

  /* 返回正文底部 y；dry 模式只测高（startY 传 0） */
  function drawBody(ctx, body, x, maxW, size, theme, dry, startY) {
    const lh = size * 1.72;
    let y = startY || 0;
    let cur = y;
    const maxLines = dry ? Infinity : Math.floor((99999 - y) / lh);
    let lineCount = 0;

    const drawTextLine = (text, font, color) => {
      const runs = inlineRuns(text, theme, size);
      const lines = wrapRuns(ctx, runs, maxW);
      if (dry) { cur += lines.length * lh; return; }
      ctx.font = font;
      ctx.fillStyle = color;
      lines.forEach(line => {
        if (lineCount >= maxLines) return;
        let cx = x;
        line.forEach(({ ch, run }) => {
          ctx.font = runFont(run, size);
          ctx.fillStyle = run.style === "bold" ? theme.ink : run.style === "code" ? theme.accent : color;
          ctx.fillText(ch, cx, cur + size);
          cx += ctx.measureText(ch).width;
        });
        cur += lh;
        lineCount++;
      });
    };

    for (const raw of body) {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) { cur += lh * 0.55; continue; }
      if (/^###?\s+/.test(line)) {
        const t = line.replace(/^#+\s+/, "");
        cur += lh * 0.3;
        const runs = inlineRuns(t, theme, size + 4);
        const hLines = wrapRuns(ctx, runs, maxW);
        if (dry) { cur += hLines.length * lh; }
        else {
          hLines.forEach(l => {
            let cx = x;
            l.forEach(({ ch, run }) => { ctx.font = runFont(run, size + 4); ctx.fillStyle = theme.ink; ctx.fillText(ch, cx, cur + size + 4); cx += ctx.measureText(ch).width; });
            cur += lh;
          });
        }
        cur += lh * 0.15;
        continue;
      }
      if (/^\s*[-*•]\s+/.test(line)) {
        const t = line.replace(/^\s*[-*•]\s+/, "");
        if (!dry) {
          ctx.fillStyle = theme.accent;
          ctx.beginPath();
          ctx.arc(x + 5, cur + size * 0.55, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        drawTextLine(t, "", theme.ink);
        continue;
      }
      if (/^\s*>\s?/.test(line)) {
        const t = line.replace(/^\s*>\s?/, "");
        if (!dry) {
          ctx.fillStyle = theme.line;
          ctx.fillRect(x, cur + 2, 4, lh * 0.8);
        }
        const indent = x + 18;
        const oldCur = cur;
        /* 引用：画到临时位置再推进——直接画 */
        cur += 2;
        drawTextLineIndent(t, indent, theme.sub);
        cur = oldCur + lh * 1.15;
        continue;
      }
      if (/^\s*```/.test(line)) { cur += lh * 0.5; continue; }
      drawTextLine(line, "", theme.ink);
    }
    return cur;

    function drawTextLineIndent(text, indent, color) {
      const runs = inlineRuns(text, theme, size);
      const lines = wrapRuns(ctx, runs, maxW - 18);
      if (dry) { cur += lines.length * lh; return; }
      lines.forEach(line => {
        let cx = indent;
        line.forEach(({ ch, run }) => {
          ctx.font = runFont(run, size);
          ctx.fillStyle = run.style === "bold" ? color : run.style === "code" ? theme.accent : color;
          ctx.fillText(ch, cx, cur + size);
          cx += ctx.measureText(ch).width;
        });
        cur += lh;
      });
    }
  }

  /* ---------- 渲染 ---------- */
  function render() {
    const src = $("#md").value;
    const theme = $("#theme").value;
    const ratio = $("#ratio").value;
    cards = splitCards(src);
    const pv = $("#preview");
    pv.innerHTML = "";
    cards.forEach((c, i) => {
      const canvas = document.createElement("canvas");
      canvas.style.cssText = `width:min(340px,100%);height:auto;border-radius:8px;box-shadow:var(--shadow)`;
      canvas.dataset.idx = i;
      drawCard(canvas, c, i, cards.length, theme, ratio);
      pv.appendChild(canvas);
    });
    if (!cards.length) pv.innerHTML = '<span class="muted mono">输入内容后生成卡片</span>';
    current = 0;
  }

  $("#render").addEventListener("click", render);
  $("#theme").addEventListener("change", render);
  $("#ratio").addEventListener("change", render);
  $("#md").addEventListener("input", () => { /* 手动生成，避免频繁重绘 */ });
  $("#md").addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") render();
  });

  $("#dl-one").addEventListener("click", () => {
    const c = document.querySelector(`#preview canvas[data-idx="${current}"]`);
    const all = document.querySelectorAll("#preview canvas");
    if (!all.length) return GEWU.toast("先生成卡片");
    const canvas = all[current] || all[0];
    const name = cards[current] && cards[current].title ? cards[current].title.slice(0, 12) : "card";
    GEWU.downloadCanvas(canvas, `card-${current + 1}-${name}.png`, 1);
  });

  $("#dl-all").addEventListener("click", () => {
    const canvases = document.querySelectorAll("#preview canvas");
    if (!canvases.length) return GEWU.toast("先生成卡片");
    const gap = 24;
    const totalH = Array.from(canvases).reduce((a, c) => a + c.height / c._scale + gap, 0) - gap;
    const W = canvases[0].width / canvases[0]._scale;
    const out = document.createElement("canvas");
    const scale = 2;
    out.width = W * scale; out.height = totalH * scale;
    const ctx = out.getContext("2d");
    ctx.scale(scale, scale);
    let y = 0;
    canvases.forEach(c => {
      const h = c.height / c._scale;
      ctx.fillStyle = THEMES[$("#theme").value].bg;
      ctx.fillRect(0, y, W, h);
      ctx.drawImage(c, 0, y, W, h);
      y += h + gap;
    });
    out.toBlob(b => GEWU.downloadBlob(b, "cards-long.png"), "image/png");
  });

  $("#sample").addEventListener("click", () => {
    $("#md").value = `# 如何高效读论文

## 第一步：粗读
- 先读摘要、图表与结论，不碰方法细节
- 问自己：**它解决了什么问题？**
- 用一句话写下来，作为笔记锚点

> 读论文不是为了读完，而是为了建立索引。

## 第二步：精读
1. 把方法拆成输入、处理、输出三段
2. 关注实验设置：数据集、指标、基线
3. 标注存疑点，带着问题去查原文

\`key insight\` 一定要记下原文页码。

## 第三步：内化
- 用自己的话复述一遍（费曼技巧）
- 与已有知识建立连接
- 一周后回来重读批注`;
    render();
  });

  renderRelated($("#related"), ["K-02", "K-03", "R-02"]);
  $("#sample").click();
})();
