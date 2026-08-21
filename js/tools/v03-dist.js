/* V-03 分布实验室：八种分布 PDF/CDF/分位数 + 双分布对比 */
(function () {
  "use strict";
  const $ = GEWU.$;
  const canvas = $("#canvas");
  const W = 820, H = 430;

  /* ============ 数值基础 ============ */
  function logGamma(z) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function betacf(a, b, x) {
    const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function betainc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function gammaincP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      let sum = 1 / a, term = sum;
      for (let n = 1; n < 300; n++) {
        term *= x / (a + n); sum += term;
        if (Math.abs(term) < 1e-15 * sum) break;
      }
      return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
    }
    const FPMIN = 1e-300, EPS = 3e-14;
    let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (let i = 1; i < 300; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
  }
  function erf(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }

  /* ============ 分布定义 ============ */
  const DISTS = {
    normal: {
      name: "正态分布", params: [
        { key: "mu", label: "均值 μ", min: -5, max: 5, step: 0.1, def: 0 },
        { key: "sigma", label: "标准差 σ", min: 0.1, max: 5, step: 0.1, def: 1 },
      ],
      pdf(p, x) { const z = (x - p.mu) / p.sigma; return Math.exp(-z * z / 2) / (p.sigma * Math.sqrt(2 * Math.PI)); },
      cdf(p, x) { return 0.5 * (1 + erf((x - p.mu) / (p.sigma * Math.SQRT2))); },
      mean(p) { return p.mu; }, variance(p) { return p.sigma * p.sigma; },
    },
    t: {
      name: "学生 t 分布", params: [
        { key: "nu", label: "自由度 ν", min: 1, max: 60, step: 1, def: 10 },
      ],
      pdf(p, x) {
        const v = p.nu;
        return Math.exp(logGamma((v + 1) / 2) - logGamma(v / 2) - 0.5 * Math.log(v * Math.PI)
          - (v + 1) / 2 * Math.log(1 + x * x / v));
      },
      cdf(p, x) {
        const v = p.nu;
        const q = betainc(v / 2, 0.5, v / (v + x * x));
        return x >= 0 ? 1 - q / 2 : q / 2;
      },
      mean() { return 0; }, variance(p) { return p.nu > 2 ? p.nu / (p.nu - 2) : NaN; },
    },
    chi2: {
      name: "卡方分布", params: [
        { key: "k", label: "自由度 k", min: 1, max: 60, step: 1, def: 5 },
      ],
      pdf(p, x) {
        if (x <= 0) return 0;
        const k = p.k;
        return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - k / 2 * Math.log(2) - logGamma(k / 2));
      },
      cdf(p, x) { return x <= 0 ? 0 : gammaincP(p.k / 2, x / 2); },
      mean(p) { return p.k; }, variance(p) { return 2 * p.k; },
    },
    f: {
      name: "F 分布", params: [
        { key: "d1", label: "自由度 d₁", min: 1, max: 60, step: 1, def: 5 },
        { key: "d2", label: "自由度 d₂", min: 1, max: 60, step: 1, def: 10 },
      ],
      pdf(p, x) {
        if (x <= 0) return 0;
        const a = p.d1 / 2, b = p.d2 / 2;
        return Math.exp(a * Math.log(p.d1 * x) + b * Math.log(p.d2)
          - (a + b) * Math.log(p.d1 * x + p.d2) - Math.log(x)
          - (logGamma(a) + logGamma(b) - logGamma(a + b)));
      },
      cdf(p, x) {
        if (x <= 0) return 0;
        return betainc(p.d1 / 2, p.d2 / 2, p.d1 * x / (p.d1 * x + p.d2));
      },
      mean(p) { return p.d2 > 2 ? p.d2 / (p.d2 - 2) : NaN; },
      variance(p) {
        return (p.d2 > 4) ? 2 * p.d2 * p.d2 * (p.d1 + p.d2 - 2) / (p.d1 * (p.d2 - 2) ** 2 * (p.d2 - 4)) : NaN;
      },
    },
    binom: {
      name: "二项分布", params: [
        { key: "n", label: "试验次数 n", min: 1, max: 200, step: 1, def: 20 },
        { key: "p", label: "成功概率 p", min: 0.01, max: 0.99, step: 0.01, def: 0.5 },
      ],
      pmf(p, k) {
        if (k < 0 || k > p.n || !Number.isInteger(k)) return 0;
        return Math.exp(logGamma(p.n + 1) - logGamma(k + 1) - logGamma(p.n - k + 1)
          + k * Math.log(p.p) + (p.n - k) * Math.log(1 - p.p));
      },
      pdf(p, x) { return this.pmf(p, Math.round(x)); },
      cdf(p, x) {
        const k = Math.floor(x);
        let s = 0;
        for (let i = 0; i <= k; i++) s += this.pmf(p, i);
        return Math.min(1, s);
      },
      mean(p) { return p.n * p.p; }, variance(p) { return p.n * p.p * (1 - p.p); },
    },
    poisson: {
      name: "泊松分布", params: [
        { key: "lam", label: "均值 λ", min: 0.1, max: 50, step: 0.1, def: 5 },
      ],
      pmf(p, k) {
        if (k < 0 || !Number.isInteger(k)) return 0;
        return Math.exp(-p.lam + k * Math.log(p.lam) - logGamma(k + 1));
      },
      pdf(p, x) { return this.pmf(p, Math.round(x)); },
      cdf(p, x) {
        const k = Math.floor(x);
        let s = 0;
        for (let i = 0; i <= k; i++) s += this.pmf(p, i);
        return Math.min(1, s);
      },
      mean(p) { return p.lam; }, variance(p) { return p.lam; },
    },
    exp: {
      name: "指数分布", params: [
        { key: "lam", label: "速率 λ", min: 0.05, max: 10, step: 0.05, def: 1 },
      ],
      pdf(p, x) { return x < 0 ? 0 : p.lam * Math.exp(-p.lam * x); },
      cdf(p, x) { return x < 0 ? 0 : 1 - Math.exp(-p.lam * x); },
      mean(p) { return 1 / p.lam; }, variance(p) { return 1 / (p.lam * p.lam); },
    },
    uniform: {
      name: "均匀分布", params: [
        { key: "a", label: "下限 a", min: -10, max: 10, step: 0.5, def: 0 },
        { key: "b", label: "上限 b", min: -10, max: 10, step: 0.5, def: 6 },
      ],
      pdf(p, x) { return (x >= p.a && x <= p.b) ? 1 / (p.b - p.a) : 0; },
      cdf(p, x) {
        if (x < p.a) return 0;
        if (x > p.b) return 1;
        return (x - p.a) / (p.b - p.a);
      },
      mean(p) { return (p.a + p.b) / 2; }, variance(p) { return (p.b - p.a) ** 2 / 12; },
    },
  };

  const DIST_ORDER = ["normal", "t", "chi2", "f", "binom", "poisson", "exp", "uniform"];

  function quantile(D, p, x0, x1) {
    let lo = x0, hi = x1;
    for (let i = 0; i < 90; i++) {
      const mid = (lo + hi) / 2;
      if (D.cdf(p, mid) < 0.5) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ============ 状态与 UI ============ */
  const state = { dist: "normal", dist2: "", params: {}, params2: {} };

  function defaults(def) {
    const o = {};
    def.params.forEach(pp => o[pp.key] = pp.def);
    return o;
  }
  state.params = defaults(DISTS.normal);
  state.params2 = defaults(DISTS.normal);

  function renderParams() {
    const D = DISTS[state.dist];
    $("#params").innerHTML = D.params.map(pp => `
      <div class="field">
        <label>${pp.label} = <b id="pv-${state.dist}-${pp.key}" class="mono">${state.params[pp.key]}</b></label>
        <input type="range" data-d="main" data-k="${pp.key}" min="${pp.min}" max="${pp.max}" step="${pp.step}" value="${state.params[pp.key]}">
      </div>`).join("");
    const D2 = DISTS[state.dist2];
    $("#params2").innerHTML = D2 ? D2.params.map(pp => `
      <div class="field">
        <label>${pp.label} = <b id="pv2-${pp.key}" class="mono">${state.params2[pp.key]}</b></label>
        <input type="range" data-d="cmp" data-k="${pp.key}" min="${pp.min}" max="${pp.max}" step="${pp.step}" value="${state.params2[pp.key]}">
      </div>`).join("") : "";
  }

  $("#dist").addEventListener("change", e => {
    state.dist = e.target.value;
    state.params = defaults(DISTS[state.dist]);
    renderParams(); render();
  });
  $("#dist2").addEventListener("change", e => {
    state.dist2 = e.target.value;
    state.params2 = defaults(DISTS[state.dist2] || DISTS.normal);
    renderParams(); render();
  });
  $("#params").addEventListener("input", e => {
    const r = e.target;
    if (r.dataset.d !== "main") return;
    state.params[r.dataset.k] = parseFloat(r.value);
    const lab = $("#pv-" + state.dist + "-" + r.dataset.k);
    if (lab) lab.textContent = r.value;
    render();
  });
  $("#params2").addEventListener("input", e => {
    const r = e.target;
    if (r.dataset.d !== "cmp") return;
    state.params2[r.dataset.k] = parseFloat(r.value);
    const lab = $("#pv2-" + r.dataset.k);
    if (lab) lab.textContent = r.value;
    render();
  });
  $("#x").addEventListener("input", render);
  $("#x-mean").addEventListener("click", () => {
    $("#x").value = DISTS[state.dist].mean(state.params);
    render();
  });

  /* ============ 绘制 ============ */
  function xRange(D, p) {
    switch (state.dist) {
      case "normal": return [p.mu - 4.5 * p.sigma, p.mu + 4.5 * p.sigma];
      case "t": return [quantile(D, p, -50, 0), quantile(D, p, 0, 50)];
      case "chi2": return [0, quantile(D, p, 0.01, 500)];
      case "f": return [0, quantile(D, p, 0.01, 500)];
      case "binom": return [-1, p.n + 1];
      case "poisson": return [-1, quantile(D, p, 0.01, 500) + 1];
      case "exp": return [0, quantile(D, p, 0.01, 100)];
      case "uniform": return [p.a, p.b];
    }
    return [-5, 5];
  }
  function isDiscrete() { return state.dist === "binom" || state.dist === "poisson"; }

  function render() {
    const D = DISTS[state.dist];
    const p = state.params;
    const [lo, hi] = xRange(D, p);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.aspectRatio = `${W}/${H}`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const C = {
      bg: css.getPropertyValue("--surface").trim() || "#FBF8EF",
      grid: css.getPropertyValue("--line").trim() || "#D8CEB6",
      axis: css.getPropertyValue("--line-strong").trim() || "#B6AA8C",
      text: css.getPropertyValue("--ink-3").trim() || "#8D8470",
      ink: css.getPropertyValue("--ink").trim() || "#262117",
    };
    const color = getComputedStyle(document.documentElement).getPropertyValue("--blue").trim() || "#25548F";
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#C03A22";
    const green = getComputedStyle(document.documentElement).getPropertyValue("--green").trim() || "#3B6B4E";

    const m = { l: 52, r: 16, t: 30, b: 38 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;

    /* 找 y 上限 */
    let ymax = 0;
    const N = 400;
    const samples = [];
    for (let k = 0; k <= N; k++) {
      const x = lo + (hi - lo) * k / N;
      const y = D.pdf(p, x);
      samples.push([x, y]);
      if (isFinite(y) && y > ymax) ymax = y;
    }
    const D2 = DISTS[state.dist2];
    let samples2 = null;
    if (D2) {
      samples2 = [];
      for (let k = 0; k <= N; k++) {
        const x = lo + (hi - lo) * k / N;
        const y = D2.pdf(state.params2, x);
        samples2.push([x, y]);
        if (isFinite(y) && y > ymax) ymax = y;
      }
    }
    ymax *= 1.12;

    const X = x => m.l + (x - lo) / (hi - lo) * pw;
    const Y = y => m.t + (1 - y / ymax) * ph;

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    /* 网格 */
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    ctx.fillStyle = C.text;
    const yStep = niceY(ymax / 4);
    for (let y = 0; y <= ymax + 1e-9; y += yStep) {
      ctx.beginPath(); ctx.moveTo(m.l, Y(y)); ctx.lineTo(W - m.r, Y(y)); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(GEWU.fmtNum(y, 3), m.l - 6, Y(y));
    }
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(m.l, m.t); ctx.lineTo(m.l, H - m.b); ctx.lineTo(W - m.r, H - m.b); ctx.stroke();

    /* x 刻度 */
    ctx.fillStyle = C.text; ctx.textAlign = "center"; ctx.textBaseline = "top";
    const xStep = niceY((hi - lo) / 8);
    for (let x = Math.ceil(lo / xStep) * xStep; x <= hi; x += xStep) {
      ctx.fillText(GEWU.fmtNum(x, 4), X(x), H - m.b + 6);
    }

    /* P(X ≤ x) 阴影 */
    const xv = parseFloat($("#x").value);
    if (isFinite(xv) && xv > lo && xv < hi) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.moveTo(X(Math.max(lo, Math.min(hi, xv))), m.t + ph);
      for (let k = 0; k <= N; k++) {
        const [x, y] = samples[k];
        if (x > xv) break;
        ctx.lineTo(X(x), Y(y));
      }
      ctx.lineTo(X(xv), m.t + ph);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(X(xv), m.t); ctx.lineTo(X(xv), m.t + ph); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* 主曲线 */
    ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.lineJoin = "round";
    ctx.beginPath();
    let pen = false;
    samples.forEach(([x, y]) => {
      if (!isFinite(y) || y < 0) { pen = false; return; }
      if (!pen) { ctx.moveTo(X(x), Y(y)); pen = true; } else ctx.lineTo(X(x), Y(y));
    });
    ctx.stroke();

    /* 离散点柱 */
    if (isDiscrete()) {
      ctx.fillStyle = color;
      for (let x = Math.ceil(lo); x <= Math.floor(hi); x++) {
        const y = D.pdf(p, x);
        if (y <= 0) continue;
        ctx.beginPath(); ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(y)); ctx.lineWidth = 1; ctx.strokeStyle = color; ctx.stroke();
        ctx.beginPath(); ctx.arc(X(x), Y(y), 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* 对比曲线 */
    if (samples2) {
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath();
      pen = false;
      samples2.forEach(([x, y]) => {
        if (!isFinite(y) || y < 0) { pen = false; return; }
        if (!pen) { ctx.moveTo(X(x), Y(y)); pen = true; } else ctx.lineTo(X(x), Y(y));
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.text; ctx.font = '11px "JetBrains Mono", monospace'; ctx.textAlign = "left";
      ctx.fillText("— " + D2.name, m.l + 8, m.t + 4);
    }

    ctx.fillStyle = C.ink; ctx.font = '600 13px "Noto Serif SC", serif'; ctx.textAlign = "left";
    ctx.fillText(`${D.name}  PDF`, m.l + 8, m.t + 4);

    renderStats(D, p, xv);
  }

  function niceY(range) {
    const raw = range / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const mm of [1, 2, 2.5, 5, 10]) if (raw <= mm * mag) return mm * mag;
    return 10 * mag;
  }

  function renderStats(D, p, xv) {
    const mean = D.mean(p), variance = D.variance(p);
    const P = isFinite(xv) ? D.cdf(p, xv) : null;
    const qs = [0.025, 0.05, 0.95, 0.975].map(q => {
      /* 分位数：二分搜索 */
      let lo = -1e6, hi = 1e6;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if (D.cdf(p, mid) < q) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    });
    $("#stats").innerHTML = `
      <div class="form-row" style="gap:14px;margin-bottom:6px">
        <span><b>均值</b> ${GEWU.fmtNum(mean, 5)}</span>
        <span><b>方差</b> ${isFinite(variance) ? GEWU.fmtNum(variance, 5) : "未定义"}</span>
        ${P !== null ? `<span style="color:var(--blue)"><b>P(X ≤ ${GEWU.fmtNum(xv, 4)})</b> = ${GEWU.fmtNum(P, 6)}</span>
         <span style="color:var(--accent)"><b>P(X > ${GEWU.fmtNum(xv, 4)})</b> = ${GEWU.fmtNum(1 - P, 6)}</span>` : ""}
      </div>
      <div class="muted mono" style="font-size:.72rem">常用临界值：q0.025=${GEWU.fmtNum(qs[0], 5)} · q0.05=${GEWU.fmtNum(qs[1], 5)} · q0.95=${GEWU.fmtNum(qs[2], 5)} · q0.975=${GEWU.fmtNum(qs[3], 5)}</div>`;
  }

  /* ---------- 导出 ---------- */
  $("#dl-png").addEventListener("click", () => GEWU.downloadCanvas(canvas, "distribution.png", 2));
  $("#dl-png4").addEventListener("click", () => GEWU.downloadCanvas(canvas, "distribution@4x.png", 4));

  renderRelated($("#related"), ["V-02", "V-01", "R-05"]);
  renderParams();
  render();
})();
