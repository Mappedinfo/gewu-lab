/* ============================================================
   格物 GEWU · 插件目录（由 scripts/gen-catalog.mjs 自动生成）
   数据源：plugins 目录下各插件的 gewu.plugin.json —— 请勿手工编辑
   重新生成：node scripts/gen-catalog.mjs
   ============================================================ */
const GEWU_PLUGINS = [
  {
    "code": "R-06",
    "cat": "R",
    "name": "代数工作台",
    "en": "Visual Sage",
    "href": "tools/tool.html?id=r06-visual-sage",
    "desc": "浏览器内符号计算（Pyodide WASM + SymPy）：选任务→填参数→自动生成代码并出结果——求导、积分、极限、方程求解、矩阵运算。",
    "tags": [
      "符号计算",
      "SymPy",
      "Pyodide"
    ],
    "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 19c2-6 4-10 7-12s5-2 7-1\"/><path d=\"M5 5h6M8 8h4\"/><path d=\"M5 19h14\"/><text x=\"16\" y=\"17\" font-size=\"11\" font-family=\"serif\">∑</text></svg>",
    "thumb": "<svg viewBox=\"0 0 120 80\">\n  <rect width=\"120\" height=\"80\" fill=\"var(--paper)\"/>\n  <rect x=\"12\" y=\"14\" width=\"96\" height=\"30\" rx=\"4\" fill=\"var(--surface)\" stroke=\"var(--line-strong)\"/>\n  <text x=\"20\" y=\"34\" font-family=\"serif\" font-size=\"15\" fill=\"var(--ink)\">∫ x² dx</text>\n  <path d=\"M84 18l14 8-14 8z\" fill=\"var(--accent)\" opacity=\".85\"/>\n  <text x=\"20\" y=\"40\" font-family=\"monospace\" font-size=\"8.5\" fill=\"var(--ink-3)\">sympy.integrate(x**2, x)</text>\n  <rect x=\"12\" y=\"50\" width=\"96\" height=\"20\" rx=\"4\" fill=\"var(--green-soft)\" stroke=\"var(--green)\" stroke-opacity=\".5\" stroke-dasharray=\"3 3\"/>\n  <text x=\"20\" y=\"64\" font-family=\"serif\" font-size=\"12\" fill=\"var(--green-ink)\">= x³/3 + C</text>\n  <text x=\"12\" y=\"10\" font-family=\"monospace\" font-size=\"8\" fill=\"var(--ink-3)\">Pyodide · SymPy · 本地 WASM</text>\n</svg>",
    "plugin": true,
    "version": "c494abb",
    "repo": "mappedinfo/math"
  },
  {
    "code": "V-05",
    "cat": "V",
    "name": "色卡实验室",
    "en": "Palette Lab",
    "href": "tools/tool.html?id=v05-palette",
    "desc": "15 色学术配色档案：色值解析、8 组搭配方案、全屏对比与剧场、图像取色提取（React 应用经 gewu 适配层原生挂载）。",
    "tags": [
      "配色",
      "对比度",
      "取色"
    ],
    "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"9\" height=\"9\" rx=\"2\" fill=\"currentColor\" opacity=\".85\" stroke=\"none\"/><rect x=\"12\" y=\"12\" width=\"9\" height=\"9\" rx=\"2\" fill=\"currentColor\" opacity=\".5\" stroke=\"none\"/><rect x=\"6\" y=\"13\" width=\"8\" height=\"8\" rx=\"2\" fill=\"none\"/></svg>",
    "thumb": "<svg viewBox=\"0 0 120 80\">\n      <rect width=\"120\" height=\"80\" fill=\"var(--paper)\"/>\n      <g stroke=\"#000\" stroke-opacity=\".14\" stroke-width=\"1\">\n        <rect x=\"16\" y=\"12\" width=\"26\" height=\"18\" fill=\"#FFE59D\"/>\n        <rect x=\"47\" y=\"12\" width=\"26\" height=\"18\" fill=\"#64BBCF\"/>\n        <rect x=\"78\" y=\"12\" width=\"26\" height=\"18\" fill=\"#9E1D1C\"/>\n        <rect x=\"16\" y=\"35\" width=\"26\" height=\"18\" fill=\"#EE1969\"/>\n        <rect x=\"47\" y=\"35\" width=\"26\" height=\"18\" fill=\"#90E0D6\"/>\n        <rect x=\"78\" y=\"35\" width=\"26\" height=\"18\" fill=\"#61AC4C\"/>\n        <rect x=\"16\" y=\"58\" width=\"26\" height=\"18\" fill=\"#CCA4E3\"/>\n        <rect x=\"47\" y=\"58\" width=\"26\" height=\"18\" fill=\"#6583E0\"/>\n        <rect x=\"78\" y=\"58\" width=\"26\" height=\"18\" fill=\"#008E6B\"/>\n      </g>\n      <text x=\"16\" y=\"10\" font-family=\"monospace\" font-size=\"8\" fill=\"var(--ink-3)\">15 色 · 8 组搭配</text>\n    </svg>",
    "plugin": true,
    "version": "1.0.0",
    "repo": "mappedinfo/palette-lab"
  },
  {
    "code": "V-06",
    "cat": "V",
    "name": "图表编辑器",
    "en": "Mermaid Diagram",
    "href": "tools/tool.html?id=v06-mermaid",
    "desc": "Mermaid 图表实时编辑器：流程图、时序图、类图、ER 图、甘特图——输入即渲染，缩放预览，导出 PNG，复制语法。",
    "tags": [
      "图表",
      "Mermaid",
      "流程图"
    ],
    "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"><rect x=\"3\" y=\"4\" width=\"6\" height=\"5\" rx=\"1.5\"/><rect x=\"15\" y=\"4\" width=\"6\" height=\"5\" rx=\"1.5\"/><rect x=\"9\" y=\"15\" width=\"6\" height=\"5\" rx=\"1.5\"/><path d=\"M9 6.5h6M12 9v6M15 8.5l3 2.5M6 8.5l3 2.5\"/></svg>",
    "thumb": "<svg viewBox=\"0 0 120 80\">\n  <rect width=\"120\" height=\"80\" fill=\"var(--paper)\"/>\n  <rect x=\"14\" y=\"12\" width=\"22\" height=\"16\" rx=\"3\" fill=\"var(--surface)\" stroke=\"var(--accent)\" stroke-width=\"1.5\"/>\n  <rect x=\"84\" y=\"12\" width=\"22\" height=\"16\" rx=\"3\" fill=\"var(--surface)\" stroke=\"var(--blue)\" stroke-width=\"1.5\"/>\n  <rect x=\"46\" y=\"52\" width=\"28\" height=\"16\" rx=\"3\" fill=\"var(--surface)\" stroke=\"var(--green)\" stroke-width=\"1.5\"/>\n  <path d=\"M36 20h48M47 28l10 24M73 28l-10 24\" fill=\"none\" stroke=\"var(--line-strong)\" stroke-width=\"1.6\"/>\n  <circle cx=\"47\" cy=\"28\" r=\"2.4\" fill=\"var(--accent)\"/><circle cx=\"73\" cy=\"28\" r=\"2.4\" fill=\"var(--blue)\"/>\n  <text x=\"14\" y=\"10\" font-family=\"monospace\" font-size=\"8\" fill=\"var(--ink-3)\">flowchart · sequence · class</text>\n</svg>",
    "plugin": true,
    "version": "1.0.0",
    "repo": "mappedinfo/mermaidreader"
  },
  {
    "code": "V-07",
    "cat": "V",
    "name": "AI 硬件性价比",
    "en": "Should I Buy",
    "href": "tools/tool.html?id=v07-shouldibuy",
    "desc": "交互式散点图：本地跑 AI 模型的硬件能力 × 自部署价格——按显存/价格/功耗筛选，找出最适合你的本地推理设备。",
    "tags": [
      "硬件",
      "性价比",
      "散点图"
    ],
    "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"><path d=\"M4 19V6M20 19H4M19 19V9\"/><circle cx=\"9\" cy=\"14\" r=\"2\" fill=\"currentColor\" opacity=\".5\" stroke=\"none\"/><circle cx=\"14\" cy=\"11\" r=\"2\" fill=\"currentColor\" opacity=\".8\" stroke=\"none\"/><circle cx=\"17\" cy=\"15\" r=\"2\" fill=\"currentColor\" opacity=\".3\" stroke=\"none\"/></svg>",
    "thumb": "<svg viewBox=\"0 0 120 80\">\n  <rect width=\"120\" height=\"80\" fill=\"var(--paper)\"/>\n  <path d=\"M24 64h84M28 64V16\" stroke=\"var(--line-strong)\" stroke-width=\"1.4\"/>\n  <g fill=\"var(--blue)\" opacity=\".85\">\n    <circle cx=\"34\" cy=\"52\" r=\"3.2\"/><circle cx=\"46\" cy=\"44\" r=\"3.2\"/><circle cx=\"58\" cy=\"48\" r=\"3.2\"/>\n    <circle cx=\"70\" cy=\"36\" r=\"3.2\"/><circle cx=\"82\" cy=\"40\" r=\"3.2\"/><circle cx=\"94\" cy=\"28\" r=\"3.2\"/>\n  </g>\n  <g fill=\"var(--accent)\">\n    <circle cx=\"40\" cy=\"56\" r=\"3\"/><circle cx=\"64\" cy=\"50\" r=\"3\"/><circle cx=\"88\" cy=\"34\" r=\"3\"/>\n  </g>\n  <text x=\"24\" y=\"76\" font-family=\"monospace\" font-size=\"8.5\" fill=\"var(--ink-3)\">硬件能力 × 自部署价格</text>\n</svg>",
    "plugin": true,
    "version": "1.0.0",
    "repo": "mappedinfo/ShouldIBuy"
  }
];
