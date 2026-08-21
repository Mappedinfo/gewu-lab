/* R-01 公式工坊：KaTeX 实时渲染 + 符号面板 + SVG/PNG 导出 */
(function () {
  "use strict";
  const $ = GEWU.$;

  const input = $("#latex-input");
  const preview = $("#preview");
  const displayChk = $("#display");
  const sample = $("#sample");

  /* ---------- 渲染 ---------- */
  let renderTimer = null;
  function render() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      const latex = input.value.trim();
      if (!latex) { preview.innerHTML = '<span class="muted mono">输入 LaTeX 后此处实时渲染</span>'; return; }
      try {
        preview.innerHTML = "";
        katex.render(latex, preview, {
          displayMode: displayChk.checked,
          throwOnError: false,
          strict: false,
        });
      } catch (e) {
        preview.innerHTML = '<span style="color:var(--accent)">渲染失败：' + GEWU.esc(e.message) + "</span>";
      }
    }, 120);
  }
  input.addEventListener("input", render);
  displayChk.addEventListener("change", render);
  sample.addEventListener("change", () => {
    if (sample.value) { input.value = sample.value; render(); }
  });

  /* ---------- 符号面板 ---------- */
  const SYMBOL_GROUPS = [
    { name: "希腊字母", items: [
      ["\\alpha", "α"], ["\\beta", "β"], ["\\gamma", "γ"], ["\\delta", "δ"], ["\\epsilon", "ε"],
      ["\\theta", "θ"], ["\\lambda", "λ"], ["\\mu", "μ"], ["\\pi", "π"], ["\\sigma", "σ"],
      ["\\omega", "ω"], ["\\phi", "φ"], ["\\psi", "ψ"], ["\\Delta", "Δ"], ["\\Sigma", "Σ"],
      ["\\Omega", "Ω"], ["\\infty", "∞"], ["\\partial", "∂"],
    ]},
    { name: "运算符", items: [
      ["\\times", "×"], ["\\div", "÷"], ["\\pm", "±"], ["\\cdot", "·"], ["\\leq", "≤"],
      ["\\geq", "≥"], ["\\neq", "≠"], ["\\approx", "≈"], ["\\propto", "∝"], ["\\in", "∈"],
      ["\\subset", "⊂"], ["\\cup", "∪"], ["\\cap", "∩"], ["\\sum", "∑"], ["\\prod", "∏"],
      ["\\int", "∫"], ["\\oint", "∮"], ["\\nabla", "∇"],
    ]},
    { name: "结构", items: [
      ["\\frac{a}{b}", "a/b"], ["\\sqrt{x}", "√x"], ["\\sqrt[n]{x}", "ⁿ√x"], ["\\hat{x}", "x̂"],
      ["\\bar{x}", "x̄"], ["\\vec{x}", "x⃗"], ["\\dot{x}", "ẋ"], ["\\binom{n}{k}", "(ⁿₖ)"],
      ["\\lim_{x\\to 0}", "lim"], ["\\int_{a}^{b}", "∫ₐᵇ"], ["\\sum_{i=1}^{n}", "∑ᵢ"],
      ["\\text{中文}", "文"],
    ]},
    { name: "箭头", items: [
      ["\\to", "→"], ["\\rightarrow", "→"], ["\\leftarrow", "←"], ["\\Rightarrow", "⇒"],
      ["\\Leftrightarrow", "⇔"], ["\\mapsto", "↦"], ["\\longrightarrow", "⟶"], ["\\uparrow", "↑"],
    ]},
    { name: "括号", items: [
      ["\\left( \\right)", "( )"], ["\\left[ \\right]", "[ ]"], ["\\left\\{ \\right\\}", "{ }"],
      ["\\left| \\right|", "| |"], ["\\langle", "⟨"], ["\\rangle", "⟩"],
      ["\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", "矩阵"],
      ["\\begin{cases} x \\\\ y \\end{cases}", "分段"],
    ]},
  ];

  const symEl = $("#symbols");
  symEl.innerHTML = SYMBOL_GROUPS.map(g => `
    <div style="margin-bottom:8px">
      <div style="font-size:.68rem;color:var(--ink-3);font-family:var(--font-mono);letter-spacing:.1em;margin-bottom:4px">${g.name}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${g.items.map(it => `<button class="sym-btn" data-latex="${GEWU.esc(it[0])}" title="${GEWU.esc(it[0])}" style="font-family:var(--font-mono);font-size:.78rem;padding:4px 9px;border:1px solid var(--line);border-radius:5px;background:var(--surface);color:var(--ink);cursor:pointer">${it[1]}</button>`).join("")}
      </div>
    </div>`).join("");

  function insertAtCursor(ta, text) {
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    const pos = s + text.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    render();
  }
  symEl.addEventListener("click", ev => {
    const b = ev.target.closest(".sym-btn");
    if (b) insertAtCursor(input, b.dataset.latex);
  });

  /* ---------- 导出 ---------- */
  function currentLatex() { return input.value.trim(); }

  function latexToSVG(latex, display) {
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-9999px;top:0;visibility:hidden";
    document.body.appendChild(holder);
    try {
      katex.render(latex, holder, { displayMode: display, throwOnError: false });
    } finally {}
    const el = holder.querySelector(".katex");
    const w = Math.ceil(el.getBoundingClientRect().width);
    const h = Math.ceil(el.getBoundingClientRect().height);
    const pad = Math.max(10, Math.round(h * 0.22));
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + pad * 2}" viewBox="0 0 ${w + pad * 2} ${h + pad * 2}">` +
      `<rect width="100%" height="100%" fill="#ffffff"/>` +
      `<foreignObject x="${pad}" y="${pad}" width="${w}" height="${h}">${el.outerHTML}</foreignObject></svg>`;
    holder.remove();
    return svg;
  }

  async function svgToPNGBlob(svg, scale) {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement("canvas");
    c.width = img.width * scale; c.height = img.height * scale;
    const ctx = c.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    return new Promise(res => c.toBlob(res, "image/png"));
  }

  $("#copy-latex").addEventListener("click", () => GEWU.copyText(currentLatex()));
  $("#copy-svg").addEventListener("click", async () => {
    const svg = latexToSVG(currentLatex(), displayChk.checked);
    await GEWU.copyText(svg);
  });
  $("#dl-svg").addEventListener("click", () => {
    GEWU.downloadText(latexToSVG(currentLatex(), displayChk.checked), "formula.svg", "image/svg+xml");
  });
  $("#dl-png").addEventListener("click", async () => {
    const svg = latexToSVG(currentLatex(), displayChk.checked);
    const blob = await svgToPNGBlob(svg, 2);
    GEWU.downloadBlob(blob, "formula@2x.png");
  });
  $("#dl-png4").addEventListener("click", async () => {
    const svg = latexToSVG(currentLatex(), displayChk.checked);
    const blob = await svgToPNGBlob(svg, 4);
    GEWU.downloadBlob(blob, "formula@4x.png");
  });

  /* ---------- 相关工具 ---------- */
  renderRelated($("#related"), ["R-02", "R-03", "R-04"]);
  render();
})();
