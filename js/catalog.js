/* ============================================================
   格物 GEWU · 工具目录（单一数据源）
   三大主题：研 R / 视 V / 传 K
   ============================================================ */

const GEWU_CATS = {
  R: { name: "研 · 科研", key: "R", color: "accent", cls: "accent",
       desc: "阅读、记录、写作与实验设计的日常科研工具" },
  V: { name: "视 · 可视化", key: "V", color: "blue", cls: "blue",
       desc: "把数据、函数与分布画出来，让规律可见" },
  K: { name: "传 · 知识传播", key: "K", color: "green", cls: "green",
       desc: "把知识整理成可分享、可传播的形式" },
};

const GEWU_CATALOG = [
  /* ============ 研 · 科研 ============ */
  {
    code: "R-01", cat: "R", name: "公式工坊", en: "LaTeX Formula",
    href: "tools/r01-formula.html",
    desc: "LaTeX 公式实时渲染，符号面板一键插入，导出 SVG / 高清 PNG。",
    tags: ["LaTeX", "数学", "导出"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 9h4l2.5 8L13 5l2.5 12L18 9h2"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <path d="M12 22h14l6 24 9-32 7 32 5-16h6" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="8" y1="56" x2="112" y2="56" stroke="var(--line)" stroke-dasharray="4 4"/>
      <text x="12" y="70" font-family="serif" font-size="10" fill="var(--ink-3)">E=mc² · ∫f(x)dx</text>
    </svg>`
  },
  {
    code: "R-02", cat: "R", name: "笔记台", en: "Markdown Notes",
    href: "tools/r02-notes.html",
    desc: "Markdown 双栏笔记，支持 $公式$、代码高亮，自动存档，导出 PDF / HTML。",
    tags: ["Markdown", "笔记", "公式"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <rect x="14" y="12" width="46" height="56" rx="3" fill="var(--surface)" stroke="var(--line-strong)"/>
      <line x1="20" y1="22" x2="54" y2="22" stroke="var(--ink)" stroke-width="3"/>
      <line x1="20" y1="30" x2="54" y2="30" stroke="var(--ink-2)" stroke-width="1.6"/>
      <line x1="20" y1="36" x2="50" y2="36" stroke="var(--ink-2)" stroke-width="1.6"/>
      <line x1="20" y1="42" x2="54" y2="42" stroke="var(--ink-2)" stroke-width="1.6"/>
      <line x1="20" y1="48" x2="44" y2="48" stroke="var(--ink-2)" stroke-width="1.6"/>
      <line x1="20" y1="54" x2="52" y2="54" stroke="var(--ink-2)" stroke-width="1.6"/>
      <text x="70" y="34" font-family="monospace" font-size="12" fill="var(--accent)">$\\sum$</text>
      <text x="70" y="52" font-family="serif" font-size="11" fill="var(--ink-2)">记录 · 分析 · 写作</text>
    </svg>`
  },
  {
    code: "R-03", cat: "R", name: "文献清洗", en: "BibTeX Cleaner",
    href: "tools/r03-bibclean.html",
    desc: "BibTeX 条目体检：查重、缺字段提醒、按年份/类型统计，一键整理导出。",
    tags: ["BibTeX", "文献", "LaTeX"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 13l2 2 4-4.5"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <rect x="18" y="16" width="30" height="40" rx="2" fill="var(--surface)" stroke="var(--line-strong)"/>
      <rect x="26" y="22" width="14" height="2.5" fill="var(--ink)"/>
      <rect x="26" y="28" width="14" height="2.5" fill="var(--ink-2)"/>
      <rect x="26" y="34" width="10" height="2.5" fill="var(--ink-2)"/>
      <rect x="62" y="14" width="38" height="44" rx="2" fill="var(--surface)" stroke="var(--line-strong)"/>
      <rect x="68" y="20" width="26" height="2.5" fill="var(--ink)"/>
      <rect x="68" y="26" width="26" height="2.5" fill="var(--ink-2)"/>
      <rect x="68" y="32" width="20" height="2.5" fill="var(--ink-2)"/>
      <rect x="68" y="38" width="24" height="2.5" fill="var(--ink-2)"/>
      <path d="M74 48l4 4 8-9" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="18" y="70" font-family="monospace" font-size="9" fill="var(--ink-3)">KEY · YEAR · TYPE</text>
    </svg>`
  },
  {
    code: "R-04", cat: "R", name: "量纲换算", en: "Units & Constants",
    href: "tools/r04-units.html",
    desc: "科学单位换算（含科学计数法输出）与常用物理常数速查表。",
    tags: ["单位", "物理常数", "科学计数法"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 3v18M5 7l14 10M19 7L5 17"/><circle cx="12" cy="12" r="2"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <path d="M22 52h76" stroke="var(--line-strong)" stroke-width="1.5"/>
      <path d="M22 52V24M98 52V30" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
      <line x1="22" y1="34" x2="98" y2="24" stroke="var(--ink-2)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="60" cy="29" r="3" fill="var(--blue)"/>
      <text x="22" y="70" font-family="monospace" font-size="9" fill="var(--ink-3)">1 J = 1 kg·m²/s²</text>
      <text x="76" y="70" font-family="monospace" font-size="9" fill="var(--ink-3)">c = 299 792 458 m/s</text>
    </svg>`
  },
  {
    code: "R-05", cat: "R", name: "随机化设计", en: "Randomizer",
    href: "tools/r05-random.html",
    desc: "可复现的种子随机数、随机抽样与均衡分组——实验设计的公平性保障。",
    tags: ["随机化", "抽样", "实验设计"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/><path d="M10 7h4a4 4 0 0 1 4 4v3M14 17h-4a4 4 0 0 1-4-4v-3"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <rect x="16" y="16" width="22" height="22" rx="4" fill="var(--surface)" stroke="var(--line-strong)"/>
      <circle cx="27" cy="27" r="3.2" fill="var(--accent)"/>
      <rect x="82" y="42" width="22" height="22" rx="4" fill="var(--surface)" stroke="var(--line-strong)"/>
      <circle cx="93" cy="53" r="3.2" fill="var(--blue)"/>
      <path d="M38 27h16a8 8 0 0 1 8 8v10a8 8 0 0 0 8 8h12M82 27h-8a8 8 0 0 0-8 8v10a8 8 0 0 1-8 8h-4" fill="none" stroke="var(--ink-2)" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="5 4"/>
      <text x="16" y="72" font-family="monospace" font-size="9" fill="var(--ink-3)">SEED 42 → 组A/组B 均衡</text>
    </svg>`
  },

  /* ============ 视 · 可视化 ============ */
  {
    code: "V-01", cat: "V", name: "函数绘图仪", en: "Function Plotter",
    href: "tools/v01-plot.html",
    desc: "多函数二维绘图：拖动平移、滚轮缩放，导出 SVG / PNG，适合曲线推演。",
    tags: ["函数", "坐标系", "SVG"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 4v16h18"/><path d="M4 15c3-8 5 2 8-6s4 4 8-5"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <path d="M20 66h88M32 10v60" stroke="var(--line-strong)" stroke-width="1.4"/>
      <path d="M32 66c6-14 14-30 22-34 8-4 12 2 20-4s14-10 24-16" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M32 40c8-4 14-8 22-10s14 2 22-2 14-8 24-12" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"/>
      <circle cx="96" cy="26" r="2.6" fill="var(--accent)"/>
      <text x="20" y="14" font-family="monospace" font-size="8.5" fill="var(--ink-3)">y = sin(x) · e^x</text>
    </svg>`
  },
  {
    code: "V-02", cat: "V", name: "图表工坊", en: "Chart Studio",
    href: "tools/v02-chart.html",
    desc: "粘贴 CSV 即出图：折线、散点、柱状、直方图、饼图，附统计摘要，导出图片。",
    tags: ["CSV", "统计", "图表"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 20V9M10 20V4M16 20v-8M22 20H2"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <path d="M22 62h84M28 62V20" stroke="var(--line-strong)" stroke-width="1.3"/>
      <rect x="34" y="44" width="12" height="18" fill="var(--accent)" opacity=".85"/>
      <rect x="52" y="34" width="12" height="28" fill="var(--accent)" opacity=".6"/>
      <rect x="70" y="24" width="12" height="38" fill="var(--accent)" opacity=".4"/>
      <path d="M34 42l12-6 12 4 12-12 12 6" fill="none" stroke="var(--blue)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="28" y="76" font-family="monospace" font-size="8.5" fill="var(--ink-3)">mean 2.31 · sd 0.47</text>
    </svg>`
  },
  {
    code: "V-03", cat: "V", name: "分布实验室", en: "Distribution Lab",
    href: "tools/v03-dist.html",
    desc: "正态 / t / χ² / F / 二项 / 泊松等分布：参数滑杆、临界值表、双分布对比。",
    tags: ["概率", "统计", "教学"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 18c5-12 8 4 9-3s3-11 9-2"/><path d="M3 18h18" opacity=".5"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <path d="M20 60h84" stroke="var(--line-strong)" stroke-width="1.3"/>
      <path d="M20 60c8-32 18-38 26-38s16 6 22 24 10 14 16 0 10-18 18-20" fill="none" stroke="var(--blue)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M60 22v38" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="4 3"/>
      <text x="50" y="16" font-family="monospace" font-size="8.5" fill="var(--accent)">μ</text>
      <text x="20" y="76" font-family="monospace" font-size="8.5" fill="var(--ink-3)">N(μ,σ²) · t(df) · χ²(k)</text>
    </svg>`
  },
  {
    code: "V-04", cat: "V", name: "关系图谱", en: "Graph Viz",
    href: "tools/v04-graph.html",
    desc: "边表即点成图：力导向布局、可拖拽节点、有向/无向，导出 PNG。",
    tags: ["网络", "力导向", "图论"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="8" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M7.8 7.2l7.4.6M7.2 7.8l4 8M16.6 9.6l-3.4 7"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <g stroke="var(--line-strong)" stroke-width="1.3">
        <line x1="60" y1="26" x2="24" y2="50"/><line x1="60" y1="26" x2="96" y2="46"/>
        <line x1="60" y1="26" x2="60" y2="62"/><line x1="24" y1="50" x2="96" y2="46"/>
        <line x1="24" y1="50" x2="60" y2="62"/><line x1="96" y1="46" x2="60" y2="62"/>
      </g>
      <circle cx="60" cy="26" r="7" fill="var(--accent)"/>
      <circle cx="24" cy="50" r="6" fill="var(--blue)"/>
      <circle cx="96" cy="46" r="6" fill="var(--blue)"/>
      <circle cx="60" cy="62" r="5.5" fill="var(--green)"/>
      <text x="20" y="76" font-family="monospace" font-size="8.5" fill="var(--ink-3)">6 节点 · 8 边 · 度分布</text>
    </svg>`
  },

  /* ============ 传 · 知识传播 ============ */
  {
    code: "K-01", cat: "K", name: "知识卡片", en: "Knowledge Cards",
    href: "tools/k01-cards.html",
    desc: "Markdown 自动分页成知识卡片：四种主题、两种比例，导出 PNG 长图。",
    tags: ["卡片", "Markdown", "分享"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8M8 14h5"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <rect x="30" y="12" width="60" height="56" rx="4" fill="var(--surface)" stroke="var(--line-strong)" transform="rotate(-3 60 40)"/>
      <line x1="38" y1="24" x2="82" y2="24" stroke="var(--ink)" stroke-width="3.4" transform="rotate(-3 60 40)"/>
      <line x1="38" y1="32" x2="78" y2="32" stroke="var(--ink-2)" stroke-width="1.7" transform="rotate(-3 60 40)"/>
      <line x1="38" y1="38" x2="72" y2="38" stroke="var(--ink-2)" stroke-width="1.7" transform="rotate(-3 60 40)"/>
      <line x1="38" y1="44" x2="80" y2="44" stroke="var(--ink-2)" stroke-width="1.7" transform="rotate(-3 60 40)"/>
      <rect x="66" y="54" width="16" height="8" rx="2" fill="var(--accent)" transform="rotate(-3 60 40)"/>
      <text x="20" y="14" font-family="monospace" font-size="8" fill="var(--green)">3:4 · 1:1</text>
    </svg>`
  },
  {
    code: "K-02", cat: "K", name: "公众号排版", en: "WeChat Publisher",
    href: "tools/k02-wechat.html",
    desc: "Markdown 一键转公众号兼容富文本，预览即所得，复制即粘贴。",
    tags: ["公众号", "Markdown", "富文本"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 6h16M4 10h10M4 14h16M4 18h7"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <rect x="14" y="16" width="42" height="8" fill="var(--surface)" stroke="var(--line-strong)"/>
      <rect x="14" y="30" width="92" height="34" rx="2" fill="var(--surface)" stroke="var(--line-strong)"/>
      <line x1="20" y1="38" x2="100" y2="38" stroke="var(--ink)" stroke-width="2.6"/>
      <line x1="20" y1="44" x2="96" y2="44" stroke="var(--ink-2)" stroke-width="1.5"/>
      <line x1="20" y1="50" x2="88" y2="50" stroke="var(--ink-2)" stroke-width="1.5"/>
      <line x1="20" y1="56" x2="92" y2="56" stroke="var(--ink-2)" stroke-width="1.5"/>
      <text x="14" y="74" font-family="monospace" font-size="8.5" fill="var(--green)">复制即粘贴 · 格式完整</text>
    </svg>`
  },
  {
    code: "K-03", cat: "K", name: "代码分享图", en: "Code Snapshot",
    href: "tools/k03-codeimg.html",
    desc: "代码转精美分享图：语法高亮、行号、四种主题，导出 PNG / SVG。",
    tags: ["代码", "高亮", "分享"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <rect x="14" y="12" width="92" height="56" rx="4" fill="var(--surface)" stroke="var(--line-strong)"/>
      <circle cx="26" cy="20" r="2.6" fill="var(--accent)"/><circle cx="34" cy="20" r="2.6" fill="#D8A03C"/><circle cx="42" cy="20" r="2.6" fill="var(--green)"/>
      <text x="20" y="36" font-family="monospace" font-size="7.5" fill="var(--ink-3)">01</text><rect x="30" y="29" width="34" height="5" rx="1" fill="var(--blue)" opacity=".5"/><rect x="68" y="29" width="26" height="5" rx="1" fill="var(--accent)" opacity=".45"/>
      <text x="20" y="46" font-family="monospace" font-size="7.5" fill="var(--ink-3)">02</text><rect x="30" y="39" width="52" height="5" rx="1" fill="var(--ink-2)" opacity=".35"/>
      <text x="20" y="56" font-family="monospace" font-size="7.5" fill="var(--ink-3)">03</text><rect x="30" y="49" width="20" height="5" rx="1" fill="var(--green)" opacity=".55"/><rect x="54" y="49" width="30" height="5" rx="1" fill="var(--blue)" opacity=".4"/>
      <text x="20" y="66" font-family="monospace" font-size="7.5" fill="var(--ink-3)">04</text><rect x="30" y="59" width="42" height="5" rx="1" fill="var(--ink-2)" opacity=".3"/>
    </svg>`
  },
  {
    code: "K-04", cat: "K", name: "幻灯片速成", en: "MD Slides",
    href: "tools/k04-slides.html",
    desc: "用 Markdown 与 `---` 分页速成 16:9 幻灯片，方向键翻页，打印即 PDF。",
    tags: ["演示", "Markdown", "组会"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 20h8M12 17v3"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <rect x="22" y="14" width="76" height="44" rx="3" fill="var(--surface)" stroke="var(--line-strong)"/>
      <rect x="28" y="20" width="40" height="6" rx="1" fill="var(--ink)"/>
      <rect x="28" y="31" width="60" height="3" rx="1" fill="var(--ink-2)" opacity=".6"/>
      <rect x="28" y="37" width="52" height="3" rx="1" fill="var(--ink-2)" opacity=".6"/>
      <rect x="28" y="43" width="56" height="3" rx="1" fill="var(--ink-2)" opacity=".6"/>
      <path d="M82 40l14 8-14 8z" fill="var(--accent)" opacity=".8"/>
      <text x="22" y="74" font-family="monospace" font-size="8.5" fill="var(--ink-3)">3 / 12 · 方向键翻页</text>
    </svg>`
  },
  {
    code: "K-05", cat: "K", name: "思维导图", en: "Mind Map",
    href: "tools/k05-mindmap.html",
    desc: "缩进文本即成导图：辐射布局、分层配色，导出 SVG / PNG，理清知识结构。",
    tags: ["导图", "结构", "大纲"],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="2.6"/><circle cx="4" cy="6" r="1.8"/><circle cx="20" cy="6" r="1.8"/><circle cx="6" cy="19" r="1.8"/><circle cx="18" cy="19" r="1.8"/><path d="M10.6 10.6L5.6 7.4M13.4 10.6l5-3.4M10.8 13.8l-4.2 4.2M13.2 13.8l4.2 4.2"/></svg>`,
    thumb: `<svg viewBox="0 0 120 80">
      <rect width="120" height="80" fill="var(--paper)"/>
      <g stroke="var(--line-strong)" stroke-width="1.3">
        <line x1="56" y1="40" x2="22" y2="18"/><line x1="56" y1="40" x2="22" y2="62"/>
        <line x1="56" y1="40" x2="98" y2="18"/><line x1="56" y1="40" x2="98" y2="62"/>
      </g>
      <rect x="42" y="28" width="28" height="24" rx="4" fill="var(--accent)"/>
      <text x="49" y="45" font-family="serif" font-size="9" fill="#FBF8EF">格物</text>
      <rect x="8" y="12" width="20" height="12" rx="3" fill="var(--blue)"/>
      <rect x="8" y="56" width="20" height="12" rx="3" fill="var(--blue)"/>
      <rect x="92" y="12" width="20" height="12" rx="3" fill="var(--green)"/>
      <rect x="92" y="56" width="20" height="12" rx="3" fill="var(--green)"/>
    </svg>`
  },
];

/* 科研工作流（首页） */
const GEWU_FLOW = [
  { no: "01", nm: "阅读", tl: "文献与公式", links: ["R-01", "R-03"] },
  { no: "02", nm: "记录", tl: "笔记与存档", links: ["R-02"] },
  { no: "03", nm: "分析", tl: "量纲与随机化", links: ["R-04", "R-05"] },
  { no: "04", nm: "绘图", tl: "函数·图表·分布", links: ["V-01", "V-02", "V-03"] },
  { no: "05", nm: "建模", tl: "关系与结构", links: ["V-04", "K-05"] },
  { no: "06", nm: "传播", tl: "卡片·排版·演示", links: ["K-01", "K-02", "K-03", "K-04"] },
];

/* 工具查找辅助 */
const GEWU_BY_CODE = {};
GEWU_CATALOG.forEach(t => GEWU_BY_CODE[t.code] = t);

/* 渲染「相关工具」 */
function renderRelated(el, codes) {
  if (!el) return;
  el.innerHTML = (codes || []).map(c => {
    const t = GEWU_BY_CODE[c]; if (!t) return "";
    return `<a class="rel-card" href="${t.href}">
      <span class="code">${t.code} · ${GEWU_CATS[t.cat].name}</span>
      <span class="name">${t.name}</span>
      <p class="d">${t.desc}</p>
    </a>`;
  }).join("");
}
