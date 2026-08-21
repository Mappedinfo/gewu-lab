/* R-03 文献清洗：BibTeX 解析 / 体检 / 统计 / 整理 */
(function () {
  "use strict";
  const $ = GEWU.$;
  const input = $("#bib-input");

  const REQUIRED = {
    article: ["author", "title", "journal", "year"],
    book: ["author", "title", "publisher", "year"],
    inproceedings: ["author", "title", "booktitle", "year"],
    conference: ["author", "title", "booktitle", "year"],
    phdthesis: ["author", "title", "school", "year"],
    mastersthesis: ["author", "title", "school", "year"],
    techreport: ["author", "title", "institution", "year"],
    unpublished: ["author", "title", "note"],
  };
  const TYPE_NAMES = {
    article: "期刊论文", book: "专著", inproceedings: "会议论文", conference: "会议论文",
    phdthesis: "博士论文", mastersthesis: "硕士论文", techreport: "技术报告",
    misc: "其他", unpublished: "未发表", proceedings: "会议文集",
  };

  let state = { entries: [], issues: [], deduped: false };

  /* ---------- 解析 ---------- */
  function parseBibtex(text) {
    const entries = [];
    const startRe = /@(\w+)\s*\{\s*([^,\s{}]+)\s*,/g;
    const starts = [];
    let m;
    while ((m = startRe.exec(text))) {
      starts.push({ type: m[1], key: m[2], start: m.index, bodyStart: startRe.lastIndex });
    }
    for (let i = 0; i < starts.length; i++) {
      const s = starts[i];
      const end = i + 1 < starts.length ? starts[i + 1].start : text.length;
      let depth = 1, j = s.bodyStart;
      while (j < end && depth > 0) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") depth--;
        j++;
      }
      const body = text.slice(s.bodyStart, Math.max(s.bodyStart, j - 1));
      entries.push({
        type: s.type.toLowerCase(), key: s.key,
        fields: parseFields(body),
        raw: text.slice(s.start, Math.min(j, end)),
      });
    }
    return entries;
  }

  function parseFields(body) {
    const fields = {};
    const parts = splitTopLevel(body);
    for (const part of parts) {
      const mm = part.match(/^([\w-]+)\s*=\s*([\s\S]+)$/);
      if (!mm) continue;
      const name = mm[1].toLowerCase();
      let val = mm[2].trim();
      const b = val.match(/^\{([\s\S]*)\}$/);
      if (b) val = b[1];
      else {
        const q = val.match(/^"([\s\S]*)"$/);
        if (q) val = q[1];
      }
      fields[name] = val;
    }
    return fields;
  }

  function splitTopLevel(body) {
    const parts = []; let depth = 0, cur = "";
    for (const ch of body) {
      if (ch === "{" || ch === "(") depth++;
      else if (ch === "}" || ch === ")") depth--;
      if (ch === "," && depth === 0) { parts.push(cur); cur = ""; }
      else cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    return parts.map(p => p.trim()).filter(Boolean);
  }

  /* ---------- 体检 ---------- */
  function audit(entries) {
    const issues = [];
    const seen = new Map();
    const now = new Date().getFullYear();
    entries.forEach((e, i) => {
      const tag = `${e.type}/${e.key}`;
      const fields = e.fields;
      if (seen.has(e.key)) {
        issues.push({ sev: "error", msg: `重复键：${e.key}（第 ${seen.get(e.key) + 1} 条与第 ${i + 1} 条）` });
      }
      seen.set(e.key, i);

      const req = REQUIRED[e.type] || [];
      for (const f of req) {
        if (!fields[f] || !fields[f].trim()) {
          issues.push({ sev: "warn", msg: `${tag} 缺少必填字段 ${f}` });
        }
      }
      if (fields.year) {
        const y = parseInt(fields.year, 10);
        if (!/^\d{4}$/.test(fields.year.trim()) || y < 1500 || y > now + 1) {
          issues.push({ sev: "warn", msg: `${tag} 年份异常：${fields.year}` });
        }
      }
      for (const f of ["author", "title"]) {
        if (fields[f] && /unknown|n\.a\.|TODO/i.test(fields[f])) {
          issues.push({ sev: "info", msg: `${tag} 字段 ${f} 疑似占位值` });
        }
      }
      if (fields.author && /^[^,]+$/i.test(fields.author.trim()) && !/ and /i.test(fields.author)) {
        /* 单一作者且无 and，可能是格式问题，仅提示 */
        issues.push({ sev: "info", msg: `${tag} author 仅有单个名字，请核对格式` });
      }
    });
    return issues;
  }

  /* ---------- 统计 ---------- */
  function computeStats(entries) {
    const byType = {}, years = [];
    entries.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });
    const yearMap = {};
    entries.forEach(e => {
      const y = e.fields.year;
      if (/^\d{4}$/.test(y)) yearMap[y] = (yearMap[y] || 0) + 1;
    });
    Object.keys(yearMap).sort().forEach(y => years.push([y, yearMap[y]]));
    return { byType, years };
  }

  /* ---------- 渲染 ---------- */
  let yearCanvas = null;

  function render() {
    const text = input.value;
    const entries = parseBibtex(text);
    state.entries = entries;
    state.issues = audit(entries);
    const stats = computeStats(entries);

    $("#entry-count").textContent = `${entries.length} 条 · ${state.issues.filter(i => i.sev === "error").length} 错误 / ${state.issues.filter(i => i.sev === "warn").length} 警告`;

    const typeNames = Object.keys(stats.byType).sort();
    $("#stats").innerHTML = entries.length === 0
      ? '<span class="muted mono">等待粘贴 BibTeX…</span>'
      : `<div style="display:flex;flex-wrap:wrap;gap:6px">${typeNames.map(t =>
          `<span class="chip ${t === "article" ? "accent" : ""}" title="${TYPE_NAMES[t] || t}">${TYPE_NAMES[t] || t} · ${stats.byType[t]}</span>`).join("")}
        </div>
        <div class="muted mono" style="font-size:.74rem;margin-top:8px">共 ${entries.length} 条 · ${new Set(entries.map(e => e.key)).size} 个唯一键</div>`;

    $("#issues").innerHTML = state.issues.length === 0
      ? '<span style="color:var(--green);font-family:var(--font-mono);font-size:.8rem">✓ 未发现问题</span>'
      : `<ul style="margin:0;padding-left:1.2em;font-size:.8rem;color:var(--ink-2);line-height:1.7">${state.issues.map(i =>
          `<li style="color:${i.sev === "error" ? "var(--accent)" : i.sev === "warn" ? "#B07A1F" : "var(--ink-3)"}">${i.msg}</li>`).join("")}</ul>`;

    drawYearChart(stats.years);
  }

  function drawYearChart(years) {
    const canvas = $("#year-chart");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 400, H = canvas.clientHeight || 110;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const max = Math.max(1, ...years.map(y => y[1]));
    const padL = 30, padB = 18, padT = 8;
    const bw = (W - padL) / Math.max(1, years.length);
    years.forEach(([y, n], i) => {
      const h = (n / max) * (H - padB - padT);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#C03A22";
      ctx.globalAlpha = 0.35 + 0.65 * (n / max);
      ctx.fillRect(padL + i * bw + bw * 0.2, H - padB - h, bw * 0.6, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink-3").trim();
      ctx.font = "9px monospace";
      if (years.length <= 30) ctx.fillText(y, padL + i * bw + bw * 0.2, H - 6);
    });
  }

  /* ---------- 操作 ---------- */
  $("#dedupe").addEventListener("click", () => {
    const seen = new Set();
    const kept = [];
    state.entries.forEach(e => {
      if (!seen.has(e.key)) { seen.add(e.key); kept.push(e); }
    });
    input.value = kept.map(e => e.raw.trim()).join("\n\n");
    state.deduped = true;
    render();
    GEWU.toast(`已去重：${state.entries.length} → ${kept.length} 条`);
  });

  $("#sort").addEventListener("change", ev => {
    const mode = ev.target.value;
    if (!mode) return;
    const arr = state.entries.slice();
    if (mode === "key") arr.sort((a, b) => a.key.localeCompare(b.key));
    if (mode === "year-desc") arr.sort((a, b) => (b.fields.year || "").localeCompare(a.fields.year || ""));
    if (mode === "type") arr.sort((a, b) => a.type.localeCompare(b.type) || a.key.localeCompare(b.key));
    input.value = arr.map(e => e.raw.trim()).join("\n\n");
    render();
  });

  $("#copy-keys").addEventListener("click", () => {
    const keys = [...new Set(state.entries.map(e => e.key))];
    if (!keys.length) return GEWU.toast("暂无条目");
    GEWU.copyText(keys.join("\n"));
  });

  $("#copy-result").addEventListener("click", () => {
    if (!input.value.trim()) return GEWU.toast("暂无内容");
    GEWU.copyText(input.value);
  });

  $("#dl").addEventListener("click", () => {
    if (!input.value.trim()) return GEWU.toast("暂无内容");
    GEWU.downloadText(input.value, "cleaned.bib", "application/x-bibtex");
  });

  $("#sample").addEventListener("click", () => {
    input.value = `@article{goodfellow2014gan,
  author  = {Goodfellow, Ian and Pouget-Abadie, Jean and Mirza, Mehdi},
  title   = {Generative Adversarial Nets},
  journal = {NeurIPS},
  year    = {2014}
}

@article{goodfellow2014gan,
  author = {Goodfellow, Ian},
  title  = {Generative Adversarial Nets (duplicate copy)},
  journal = {NIPS},
  year   = {2014}
}

@article{vaswani2017attention,
  author  = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki},
  title   = {Attention Is All You Need},
  journal = {NeurIPS},
  year    = {2017}
}

@inproceedings{he2016deep,
  author  = {He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing},
  title   = {Deep Residual Learning for Image Recognition},
  booktitle = {CVPR},
  year    = {2016}
}

@phdthesis{shiqi2026thesis,
  author = {Shiqi},
  title  = {TODO: title not decided yet},
  school = {HKUST(GZ)},
  year   = {2026}
}

@book{murphy2022probml,
  author    = {Murphy, Kevin P.},
  title     = {Probabilistic Machine Learning},
  publisher = {MIT Press},
  year      = {2022}
}

@misc{unknownAuthor2020,
  title  = {A paper with missing author},
  year   = {1800}
}`;
    render();
  });

  input.addEventListener("input", () => { state.deduped = false; render(); });

  renderRelated($("#related"), ["R-02", "R-01", "K-04"]);
  render();
})();
