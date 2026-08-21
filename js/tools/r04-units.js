/* R-04 量纲换算：科学单位换算 + 物理常数速查 */
(function () {
  "use strict";
  const $ = GEWU.$;

  /* 单位表：factor 为相对基准单位的换算系数；温度用 fn 特殊处理 */
  const CATS = [
    { name: "长度", base: "米 (m)",
      units: [["米 (m)", 1], ["千米 (km)", 1e3], ["厘米 (cm)", 1e-2], ["毫米 (mm)", 1e-3], ["微米 (μm)", 1e-6], ["纳米 (nm)", 1e-9], ["埃 (Å)", 1e-10], ["英寸 (in)", 0.0254], ["英尺 (ft)", 0.3048], ["英里 (mi)", 1609.344], ["海里 (nmi)", 1852], ["光年 (ly)", 9.4607304725808e15], ["天文单位 (AU)", 1.495978707e11], ["秒差距 (pc)", 3.0856775814913673e16]] },
    { name: "质量", base: "千克 (kg)",
      units: [["千克 (kg)", 1], ["克 (g)", 1e-3], ["毫克 (mg)", 1e-6], ["吨 (t)", 1e3], ["磅 (lb)", 0.45359237], ["盎司 (oz)", 0.028349523125], ["原子质量单位 (u)", 1.66053906660e-27]] },
    { name: "时间", base: "秒 (s)",
      units: [["秒 (s)", 1], ["毫秒 (ms)", 1e-3], ["微秒 (μs)", 1e-6], ["纳秒 (ns)", 1e-9], ["分钟 (min)", 60], ["小时 (h)", 3600], ["天 (d)", 86400], ["年 (yr)", 31557600]] },
    { name: "温度", base: "开尔文 (K)",
      units: [["开尔文 (K)", 1], ["摄氏度 (°C)", 0], ["华氏度 (°F)", 0], ["兰氏度 (°R)", 0]], special: "temp" },
    { name: "能量", base: "焦耳 (J)",
      units: [["焦耳 (J)", 1], ["千焦 (kJ)", 1e3], ["电子伏 (eV)", 1.602176634e-19], ["千电子伏 (keV)", 1.602176634e-16], ["兆电子伏 (MeV)", 1.602176634e-13], ["吉电子伏 (GeV)", 1.602176634e-10], ["卡路里 (cal)", 4.184], ["千卡 (kcal)", 4184], ["千瓦时 (kWh)", 3.6e6], ["尔格 (erg)", 1e-7]] },
    { name: "压力", base: "帕斯卡 (Pa)",
      units: [["帕斯卡 (Pa)", 1], ["千帕 (kPa)", 1e3], ["兆帕 (MPa)", 1e6], ["巴 (bar)", 1e5], ["毫巴 (mbar)", 100], ["标准大气压 (atm)", 101325], ["毫米汞柱 (mmHg)", 133.322387415], ["托 (Torr)", 133.32236842105263], ["磅力/平方英寸 (psi)", 6894.757293168]] },
    { name: "功率", base: "瓦特 (W)",
      units: [["瓦特 (W)", 1], ["千瓦 (kW)", 1e3], ["兆瓦 (MW)", 1e6], ["马力 (hp)", 745.6998715822702], ["分贝毫瓦 (dBm)", 0.001]] },
    { name: "速度", base: "米每秒 (m/s)",
      units: [["米/秒 (m/s)", 1], ["千米/时 (km/h)", 1 / 3.6], ["英里/时 (mph)", 0.44704], ["节 (kn)", 0.5144444444444445], ["马赫 (Ma)", 340.29], ["光速 (c)", 299792458]] },
    { name: "数据存储", base: "字节 (B)",
      units: [["字节 (B)", 1], ["千字节 (KB)", 1e3], ["兆字节 (MB)", 1e6], ["吉字节 (GB)", 1e9], ["太字节 (TB)", 1e12], ["拍字节 (PB)", 1e15], ["比特 (bit)", 0.125]] },
    { name: "角度", base: "弧度 (rad)",
      units: [["弧度 (rad)", 1], ["度 (°)", Math.PI / 180], ["角分 (′)", Math.PI / 10800], ["角秒 (″)", Math.PI / 648000], ["转 (rev)", 2 * Math.PI]] },
    { name: "频率", base: "赫兹 (Hz)",
      units: [["赫兹 (Hz)", 1], ["千赫 (kHz)", 1e3], ["兆赫 (MHz)", 1e6], ["吉赫 (GHz)", 1e9], ["太赫 (THz)", 1e12]] },
  ];

  const catEl = $("#cat"), fromEl = $("#from"), toEl = $("#to");
  catEl.innerHTML = CATS.map((c, i) => `<option value="${i}">${c.name}</option>`).join("");

  function fillUnits() {
    const c = CATS[+catEl.value];
    fromEl.innerHTML = c.units.map((u, i) => `<option value="${i}">${u[0]}</option>`).join("");
    toEl.innerHTML = c.units.map((u, i) => `<option value="${i}">${u[0]}</option>`).join("");
    toEl.value = Math.min(1, c.units.length - 1);
    convert();
  }
  catEl.addEventListener("change", fillUnits);
  fromEl.addEventListener("change", convert);
  toEl.addEventListener("change", convert);
  $("#val").addEventListener("input", convert);
  $("#sci").addEventListener("change", convert);
  $("#swap").addEventListener("click", () => {
    const t = fromEl.value; fromEl.value = toEl.value; toEl.value = t;
    convert();
  });

  function convert() {
    const c = CATS[+catEl.value];
    const val = parseFloat($("#val").value);
    const res = $("#result"), det = $("#result-detail"), chain = $("#chain");
    if (!isFinite(val)) { res.textContent = "—"; det.textContent = ""; chain.textContent = ""; return; }
    const ui = +fromEl.value, uj = +toEl.value;
    const sci = $("#sci").checked;
    const fmt = sci ? GEWU.fmtSci : GEWU.fmtNum;

    if (c.special === "temp") {
      const K = { 0: v => v, 1: v => v + 273.15, 2: v => (v + 459.67) * 5 / 9, 3: v => v * 5 / 9 }[ui](val);
      const out = { 0: k => k, 1: k => k - 273.15, 2: k => k * 9 / 5 - 459.67, 3: k => k * 9 / 5 }[uj](K);
      res.textContent = fmt(out) + " " + c.units[uj][0];
      det.textContent = `= ${GEWU.fmtSci(K, 6)} K`;
      chain.textContent = "温度采用线性换算：°C → K 加 273.15；°F → K 先加 459.67 再乘 5/9";
      return;
    }

    const base = val * c.units[ui][1];
    const out = base / c.units[uj][1];
    res.textContent = fmt(out) + " " + c.units[uj][0];
    det.textContent = `= ${GEWU.fmtSci(base, 6)} ${c.base}`;
    chain.textContent = `${fmt(val)} ${c.units[ui][0]} × ${GEWU.fmtSci(c.units[ui][1], 4)} ÷ ${GEWU.fmtSci(c.units[uj][1], 4)} = ${fmt(out)} ${c.units[uj][0]}`;
  }

  /* ---------- 物理常数 ---------- */
  const CONSTS = [
    ["真空光速 c", "299 792 458", "m/s"],
    ["普朗克常数 h", "6.626 070 15×10⁻³⁴", "J·s"],
    ["约化普朗克常数 ħ", "1.054 571 817×10⁻³⁴", "J·s"],
    ["引力常数 G", "6.674 30×10⁻¹¹", "m³·kg⁻¹·s⁻²"],
    ["元电荷 e", "1.602 176 634×10⁻¹⁹", "C"],
    ["玻尔兹曼常数 kB", "1.380 649×10⁻²³", "J/K"],
    ["阿伏伽德罗常数 NA", "6.022 140 76×10²³", "mol⁻¹"],
    ["摩尔气体常数 R", "8.314 462 618", "J/(mol·K)"],
    ["真空介电常数 ε₀", "8.854 187 8128×10⁻¹²", "F/m"],
    ["真空磁导率 μ₀", "1.256 637 06212×10⁻⁶", "N/A²"],
    ["电子质量 me", "9.109 383 7015×10⁻³¹", "kg"],
    ["质子质量 mp", "1.672 621 923 69×10⁻²⁷", "kg"],
    ["精细结构常数 α", "7.297 352 5693×10⁻³", "—"],
    ["电子伏特 eV", "1.602 176 634×10⁻¹⁹", "J"],
    ["标准大气压 atm", "101 325", "Pa"],
    ["玻尔半径 a₀", "5.291 772 109 03×10⁻¹¹", "m"],
  ];
  $("#consts").innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:.78rem">
    <tr><th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)">常数</th>
    <th style="text-align:right;padding:6px 10px;border-bottom:1px solid var(--line)">数值</th>
    <th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)">单位</th></tr>
    ${CONSTS.map(c => `<tr data-v="${GEWU.esc(c[1])} ${GEWU.esc(c[2])}" style="cursor:pointer" title="点击复制">
      <td style="padding:5px 10px;border-bottom:1px dashed var(--line)">${c[0]}</td>
      <td style="padding:5px 10px;border-bottom:1px dashed var(--line);text-align:right;font-family:var(--font-mono);white-space:nowrap">${c[1]}</td>
      <td style="padding:5px 10px;border-bottom:1px dashed var(--line)">${c[2]}</td></tr>`).join("")}
  </table>`;
  $("#consts").addEventListener("click", ev => {
    const tr = ev.target.closest("tr[data-v]");
    if (tr) GEWU.copyText(tr.dataset.v);
  });

  renderRelated($("#related"), ["R-05", "R-06", "V-03"]);
  fillUnits();
})();
