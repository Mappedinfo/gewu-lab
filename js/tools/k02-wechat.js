/* K-02 公众号排版：MD → 微信兼容富文本（行内样式） */
(function () {
  "use strict";
  const $ = GEWU.$;
  const input = $("#md");
  const preview = $("#preview");

  marked.setOptions({ gfm: true, breaks: true });

  /* ---------- 渲染管线（与笔记台一致） ---------- */
  function renderDoc(src) {
    const codes = [];
    src = src.replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (m, lang, code) => {
      const idx = codes.length;
      let html;
      try { html = hljs.highlight(code, { language: lang || "plaintext" }).value; }
      catch (e) { html = GEWU.esc(code); }
      codes.push(html);
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

  /* ---------- 微信化：行内样式 ---------- */
  const WX = {
    h1: (s) => `<h1 style="font-size:22px;font-weight:bold;text-align:center;margin:24px 0 16px;color:#1a1a1a;letter-spacing:1px">${s}</h1>`,
    h2: (s) => `<h2 style="font-size:18px;font-weight:bold;margin:22px 0 12px;padding-left:10px;border-left:4px solid #C03A22;color:#1a1a1a;line-height:1.5">${s}</h2>`,
    h3: (s) => `<h3 style="font-size:16px;font-weight:bold;margin:18px 0 10px;color:#333">${s}</h3>`,
    p: (s) => `<p style="margin:10px 0;text-align:justify">${s}</p>`,
    blockquote: (s) => `<blockquote style="margin:14px 0;padding:10px 14px;background:#f7f7f7;border-left:4px solid #ddd;color:#666;border-radius:0 4px 4px 0">${s}</blockquote>`,
    pre: (s) => `<pre style="background:#f6f8fa;border-radius:6px;padding:14px 16px;overflow-x:auto;font-size:13px;line-height:1.7;margin:14px 0"><code>${s}</code></pre>`,
    code: (s) => `<code style="background:#f0f0f0;border-radius:3px;padding:2px 5px;font-size:14px;color:#C03A22">${s}</code>`,
    ul: (s) => `<ul style="margin:10px 0;padding-left:1.4em">${s}</ul>`,
    ol: (s) => `<ol style="margin:10px 0;padding-left:1.6em">${s}</ol>`,
    li: (s) => `<li style="margin:5px 0">${s}</li>`,
    hr: () => `<hr style="border:none;border-top:1px solid #eee;margin:22px 0">`,
    strong: (s) => `<strong style="font-weight:bold">${s}</strong>`,
    em: (s) => `<em style="font-style:italic">${s}</em>`,
    a: (s, href) => `<a href="${href}" style="color:#576b95;text-decoration:none">${s}</a>`,
    table: (s) => `<table style="border-collapse:collapse;margin:14px 0;width:100%;font-size:14px">${s}</table>`,
    th: (s) => `<th style="border:1px solid #ddd;padding:8px 10px;background:#f7f7f7;font-weight:bold">${s}</th>`,
    td: (s) => `<td style="border:1px solid #ddd;padding:8px 10px">${s}</td>`,
  };

  function wechatify(html) {
    let h = html;
    /* 表格 */
    h = h.replace(/<table>/g, () => WX.table("")).replace(/<\/table>/g, "</table>");
    h = h.replace(/<thead>|<\/thead>|<tbody>|<\/tbody>/g, "");
    h = h.replace(/<th>([\s\S]*?)<\/th>/g, (m, s) => WX.th(s));
    h = h.replace(/<td>([\s\S]*?)<\/td>/g, (m, s) => WX.td(s));
    h = h.replace(/<tr>/g, "<tr>").replace(/<\/tr>/g, "</tr>");
    /* 块级 */
    h = h.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, (m, s) => WX.h1(s));
    h = h.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (m, s) => WX.h2(s));
    h = h.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (m, s) => WX.h3(s));
    h = h.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, (m, s) => WX.h3(s));
    h = h.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (m, s) => WX.blockquote(s));
    h = h.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/g, (m, s) => WX.pre(s));
    h = h.replace(/<ul[^>]*>/g, () => WX.ul("")).replace(/<\/ul>/g, "</ul>");
    h = h.replace(/<ol[^>]*>/g, () => WX.ol("")).replace(/<\/ol>/g, "</ol>");
    h = h.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (m, s) => WX.li(s));
    h = h.replace(/<hr[^>]*>/g, () => WX.hr());
    h = h.replace(/<p[^>]*>/g, () => WX.p("")).replace(/<\/p>/g, "</p>");
    /* 行内 */
    h = h.replace(/<strong[^>]*>/g, () => WX.strong("")).replace(/<\/strong>/g, "</strong>");
    h = h.replace(/<em[^>]*>/g, () => WX.em("")).replace(/<\/em>/g, "</em>");
    h = h.replace(/<del[^>]*>([\s\S]*?)<\/del>/g, (m, s) => `<del style="text-decoration:line-through">${s}</del>`);
    h = h.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (m, s) => WX.code(s));
    h = h.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (m, href, s) => WX.a(s, href));
    h = h.replace(/<img[^>]*>/g, (m) => `<p style="color:#999;font-size:13px;text-align:center">[图片：本地图片未随文上传，请手动插入]</p>`);
    /* 公式容器保持 */
    h = h.replace(/<span class="katex/g, '<span class="katex');
    return h;
  }

  function render() {
    const src = input.value;
    const html = src.trim() ? wechatify(renderDoc(src)) : '<p style="color:#bbb">左侧输入 Markdown，这里实时预览。</p>';
    preview.innerHTML = html;
  }

  /* ---------- 导出 ---------- */
  function currentHTML() {
    return wechatify(renderDoc(input.value));
  }

  $("#copy-rich").addEventListener("click", async () => {
    const html = currentHTML();
    const plain = input.value;
    await GEWU.copyRichText(html, plain);
  });
  $("#copy-text").addEventListener("click", () => GEWU.copyText(input.value));
  $("#copy-html").addEventListener("click", () => GEWU.copyText(currentHTML()));
  $("#dl-html").addEventListener("click", () => {
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>公众号文章</title>
<link rel="stylesheet" href="../js/lib/katex.min.css">
<style>body{max-width:677px;margin:0 auto;padding:28px 22px;color:#3f3f3f;font-size:16px;line-height:1.9;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}</style>
</head><body>${currentHTML()}</body></html>`;
    GEWU.downloadText(html, "wechat-article.html", "text/html");
  });

  $("#sample").addEventListener("click", () => {
    input.value = `# 关于「本地处理」的三个问题

## 为什么文件不应该上传？

> 论文草稿、实验数据、未公开结果——它们属于研究者本人。

1. 上传意味着把信任交给第三方
2. 本地处理意味着**断网可用、关页即焚**
3. 纯前端工具没有服务器，也就没有可被攻击的对象

\`\`\`python
def local_only(data):
    """数据在浏览器里处理，从不离开本机"""
    return process(data)  # 100% local
\`\`\`

## 对读者而言意味着什么

- 打开即用，无需注册
- 速度来自本地计算，而非带宽
- 隐私是一个**默认值**，而不是设置项

方差公式：$\\sigma^2 = \\frac{1}{n}\\sum (x_i-\\bar{x})^2$

| 方案 | 上传 | 注册 | 速度 |
| --- | --- | --- | --- |
| 在线服务 | 是 | 是 | 看服务器 |
| 格物 | 否 | 否 | 看本机 |

---

*格物致知 · 让工具回归工具。*`;
    render();
  });

  input.addEventListener("input", render);
  renderRelated($("#related"), ["K-01", "K-03", "R-02"]);
  $("#sample").click();
})();
