/* R-02 笔记台：Markdown + KaTeX 公式 + 代码高亮 + 自动存档 */
(function () {
  "use strict";
  const $ = GEWU.$;
  const input = $("#md-input");
  const preview = $("#preview");
  const KEY = "gewu-notes-draft";

  marked.setOptions({ gfm: true, breaks: true });

  /* ---------- 渲染管线：代码块 → 公式 → Markdown ---------- */
  function renderDoc(src) {
    const codes = [];
    src = src.replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (m, lang, code) => {
      const idx = codes.length;
      let html;
      try {
        html = hljs.highlight(code, { language: lang || "plaintext" }).value;
      } catch (e) {
        html = GEWU.esc(code);
      }
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

    let html;
    try { html = marked.parse(src); } catch (e) { html = GEWU.esc(src); }
    html = html.replace(/<GEWU-MATH>(\d+)<\/GEWU-MATH>/g, (m, i) => maths[+i]);
    html = html.replace(/<GEWU-CODE>(\d+)<\/GEWU-CODE>/g, (m, i) => codes[+i]);
    return html;
  }

  function render() {
    const src = input.value;
    preview.innerHTML = src.trim()
      ? renderDoc(src)
      : '<span class="muted mono">在左侧开始书写，这里会实时渲染。</span>';
    updateStats(src);
  }

  /* ---------- 统计 ---------- */
  function updateStats(src) {
    const chars = src.replace(/\s/g, "").length;
    const lines = src ? src.split("\n").length : 0;
    const words = (src.match(/[\u4e00-\u9fa5]|[A-Za-z0-9]+/g) || []).length;
    $("#stats").textContent = `字符 ${chars} · 词 ${words} · 行 ${lines}`;
  }

  /* ---------- 自动存档 ---------- */
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, input.value);
        $("#save-state").textContent = "已自动保存 " + new Date().toLocaleTimeString();
      } catch (e) { /* 隐私模式等场景静默失败 */ }
    }, 500);
  }
  input.addEventListener("input", () => { render(); save(); });
  input.addEventListener("keydown", e => {
    /* Tab 插入两个空格 */
    if (e.key === "Tab") {
      e.preventDefault();
      const s = input.selectionStart;
      input.value = input.value.slice(0, s) + "  " + input.value.slice(input.selectionEnd);
      input.selectionStart = input.selectionEnd = s + 2;
    }
  });

  /* ---------- 载入 / 恢复 ---------- */
  const SAMPLE = `# 科研笔记示例

> 格物致知：通过研究事物获得知识。

## 为什么要本地处理？

- 论文与实验数据属于研究者本人
- 上传即意味着信任第三方
- 纯前端意味着**断网可用、关页即焚**

## 公式

正态分布密度：

$$f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$

行内公式如 $E=mc^2$ 也可以混排。

## 代码

\`\`\`python
import numpy as np
x = np.linspace(0, 1, 100)
print(f"mean = {x.mean():.4f}")
\`\`\`

## 待办

- [x] 读文献
- [ ] 画图
- [ ] 写周报
`;

  $("#sample").addEventListener("click", () => { input.value = SAMPLE; render(); save(); });
  $("#clear").addEventListener("click", () => {
    if (confirm("确定清空当前笔记？")) { input.value = ""; render(); save(); }
  });

  /* ---------- 导出 ---------- */
  $("#print").addEventListener("click", () => window.print());

  $("#dl-md").addEventListener("click", () =>
    GEWU.downloadText(input.value, "notes.md", "text/markdown"));

  function exportHTML() {
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>笔记</title>
<link rel="stylesheet" href="../js/lib/katex.min.css">
<style>
body{font-family:"Noto Sans SC","PingFang SC",sans-serif;max-width:760px;margin:40px auto;padding:0 24px;color:#262117;line-height:1.8}
h1,h2,h3{font-family:"Noto Serif SC","Songti SC",serif}
pre{background:#F4EFE2;border:1px solid #D8CEB6;border-radius:8px;padding:12px;overflow:auto}
code{font-family:monospace;font-size:.92em}
blockquote{border-left:3px solid #C03A22;margin:0;padding-left:14px;color:#5F5745}
img{max-width:100%}
table{border-collapse:collapse}td,th{border:1px solid #D8CEB6;padding:6px 10px}
</style></head><body>
${renderDoc(input.value)}
</body></html>`;
  }
  $("#dl-html").addEventListener("click", () =>
    GEWU.downloadText(exportHTML(), "notes.html", "text/html"));
  $("#copy-html").addEventListener("click", async () => {
    const plain = input.value;
    const html = renderDoc(input.value);
    if (!(await GEWU.copyRichText(html, plain))) GEWU.toast("已尝试复制，请粘贴到支持富文本的地方");
  });

  /* ---------- 恢复草稿 ---------- */
  (function restore() {
    try {
      const draft = localStorage.getItem(KEY);
      if (draft) { input.value = draft; $("#save-state").textContent = "已恢复上次草稿"; }
    } catch (e) {}
  })();

  renderRelated($("#related"), ["R-01", "R-03", "K-01"]);
  render();
})();
