/* K-04 幻灯片速成：MD 分页 → 16:9 放映 + 打印 PDF */
(function () {
  "use strict";
  const $ = GEWU.$;
  const input = $("#md");
  const stage = $("#stage");

  marked.setOptions({ gfm: true, breaks: true });

  function renderDoc(src) {
    const codes = [];
    src = src.replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (m, lang, code) => {
      const idx = codes.length;
      let html;
      try { html = hljs.highlight(code, { language: lang || "plaintext" }).value; }
      catch (e) { html = GEWU.esc(code); }
      codes.push(`<pre><code class="hljs">${html}</code></pre>`);
      return `\n<GEWU-CODE>${idx}</GEWU-CODE>\n`;
    });
    const maths = [];
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => {
      const idx = maths.length;
      maths.push(katex.renderToString(tex, { displayMode: true, throwOnError: false }));
      return `\n<GEWU-MATH>${idx}</GEWU-MATH>\n`;
    });
    src = src.replace(/\$([^$\n]+?)\$/g, (m, tex) => {
      const idx = maths.length;
      maths.push(katex.renderToString(tex, { throwOnError: false }));
      return `<GEWU-MATH>${idx}</GEWU-MATH>`;
    });
    let html = marked.parse(src);
    html = html.replace(/<GEWU-MATH>(\d+)<\/GEWU-MATH>/g, (m, i) => maths[+i]);
    html = html.replace(/<GEWU-CODE>(\d+)<\/GEWU-CODE>/g, (m, i) => codes[+i]);
    return html;
  }

  let total = 0, cur = 0;

  function renderSlides() {
    const src = input.value;
    const blocks = splitSlides(src);
    total = blocks.length;
    stage.innerHTML = blocks.map((b, i) => `
      <div class="slide-frame ${i === 0 ? "active" : ""}" data-i="${i}">
        <div class="md-preview">${renderDoc(b)}</div>
        <span class="slide-counter">${i + 1} / ${total}</span>
      </div>`).join("");
    cur = 0;
    updateCounter();
  }

  function splitSlides(src) {
    const blocks = [];
    let cur = [];
    for (const line of src.split(/\r?\n/)) {
      if (/^\s*---\s*$/.test(line)) {
        if (cur.some(l => l.trim())) blocks.push(cur.join("\n"));
        cur = [];
      } else cur.push(line);
    }
    if (cur.some(l => l.trim())) blocks.push(cur.join("\n"));
    return blocks.length ? blocks : [""];
  }

  function go(i) {
    cur = Math.max(0, Math.min(total - 1, i));
    document.querySelectorAll(".slide-frame").forEach((f, k) => f.classList.toggle("active", k === cur));
    updateCounter();
  }
  function updateCounter() {
    $("#counter").textContent = `第 ${cur + 1} / ${total} 页`;
  }

  window.addEventListener("keydown", e => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(cur + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(cur - 1); }
    if (e.key === "Home") go(0);
    if (e.key === "End") go(total - 1);
  });
  $("#next").addEventListener("click", () => go(cur + 1));
  $("#prev").addEventListener("click", () => go(cur - 1));

  $("#fs").addEventListener("click", () => {
    const body = document.body;
    if (document.fullscreenElement) document.exitFullscreen();
    else body.requestFullscreen?.();
  });

  $("#print").addEventListener("click", () => window.print());

  $("#dl-html").addEventListener("click", () => {
    const slides = splitSlides(input.value).map(b =>
      `<section style="width:100%;aspect-ratio:16/9;padding:56px;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;justify-content:center">${renderDoc(b)}</section>`).join("");
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>幻灯片</title>
<link rel="stylesheet" href="../js/lib/katex.min.css">
<style>
body{margin:0;background:#fff;font-family:"Noto Sans SC","PingFang SC",sans-serif;color:#262117;line-height:1.8}
section{font-size:24px}
h1{font-family:"Noto Serif SC",serif;font-size:1.8em;text-align:center}
h2{font-family:"Noto Serif SC",serif;font-size:1.4em}
pre{background:#F4EFE2;border:1px solid #D8CEB6;border-radius:8px;padding:12px;overflow:auto;font-size:16px}
code{font-family:monospace}
blockquote{border-left:4px solid #C03A22;margin:0;padding-left:14px;color:#5F5745}
table{border-collapse:collapse}td,th{border:1px solid #D8CEB6;padding:6px 10px}
</style></head><body>${slides}</body></html>`;
    GEWU.downloadText(html, "slides.html", "text/html");
  });

  $("#sample").addEventListener("click", () => {
    input.value = `# 格物 · 科研工具集

### 纯前端 · 零上传 · 无账号

**格物致知**：让工具回归工具

---

## 为什么专注科研工作流？

- 不复制 80+ 的大而全工具箱
- 只做 14 件，件件落在真实工序上

> 读 → 记 → 析 → 绘 → 写 → 传

---

## 一条科研流水线

1. **阅读** — 公式、文献清洗
2. **记录** — 笔记台（含 $\\LaTeX$ 公式）
3. **分析** — 量纲、随机化
4. **绘图** — 函数、图表、分布、图谱
5. **写作** — 公式与笔记再加工
6. **传播** — 卡片、公众号、代码图、幻灯片

---

## 分布实验室示例

$$f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$

\`\`\`python
# 正态分布 CDF
import math, statistics
data = [1, 2, 3, 4, 5]
print(statistics.mean(data))
\`\`\`

---

## 谢谢

**格物致知 · 研 · 视 · 传**

用 \`---\` 分页，按 ← → 翻页，Ctrl+P 打印 PDF`;
    renderSlides();
  });

  input.addEventListener("input", renderSlides);
  renderRelated($("#related"), ["K-01", "K-02", "R-02"]);
  $("#sample").click();
})();
