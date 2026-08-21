# 格物 GEWU · 科研工具集

> 格物致知 —— 研究事物，获得知识。
> 一个面向 **科研 · 可视化 · 知识传播** 的纯前端工具集合，灵感参考 [meTool.online](https://metool.online/)，但刻意做得更窄、更深。

**线上地址**：https://mappedinfo.github.io/gewu-lab/

## 与通用工具箱（MeTool 类）的差异

| | 通用工具箱 | 格物 GEWU |
| --- | --- | --- |
| 规模 | 80+ 工具（图片/视频/游戏/魔法） | **18 件**，只服务科研工作流 |
| 组织 | 按文件类型分类 | 按工作流工序编排：读 → 记 → 析 → 绘 → 写 → 传 |
| 社交 | 登录、反馈、留言 | **刻意不做**：无账号、无留言、无表单 |
| 数据 | 多数本地，部分第三方存储 | 100% 本地：localStorage + Blob 导出 |
| 追踪 | 分析脚本 + 广告 | 零分析、零广告、零追踪 |

## 工具清单（18 件，全本地处理）

### 研 · 科研（R）
| 编号 | 工具 | 说明 |
| --- | --- | --- |
| R-01 | 公式工坊 | LaTeX 实时渲染，符号面板，导出 SVG / PNG（KaTeX） |
| R-02 | 笔记台 | Markdown 双栏 + $公式$ + 代码高亮，自动存档，导出 PDF/HTML/MD |
| R-03 | 文献清洗 | BibTeX 体检：查重、缺字段、年份异常；按类型/年份统计 |
| R-04 | 量纲换算 | 10 类科学单位换算 + 物理常数速查表 |
| R-05 | 随机化设计 | 种子随机数 / 抽样 / 均衡分组，同种子可复现 |
| R-06 | 代数工作台（插件） | 浏览器内符号计算：SymPy 求导/积分/方程，Pyodide WASM 本地运行 |

### 视 · 可视化（V）
| 编号 | 工具 | 说明 |
| --- | --- | --- |
| V-01 | 函数绘图仪 | 多函数曲线，拖拽平移、滚轮缩放，导出 SVG / PNG |
| V-02 | 图表工坊 | CSV → 折线/散点/柱状/直方/饼图 + 统计摘要 |
| V-03 | 分布实验室 | 8 种分布 PDF/CDF、临界值、双分布对比（手写数值算法） |
| V-04 | 关系图谱 | 边表即图，力导向布局、可拖拽、有向箭头 |
| V-05 | 色卡实验室（插件） | 15 色学术配色档案：8 组搭配、全屏对比/剧场、图像取色 |
| V-06 | 图表编辑器（插件） | Mermaid 图表实时编辑：流程图/时序图/类图/ER 图，导出 PNG |
| V-07 | AI 硬件性价比（插件） | 本地跑 AI 的硬件能力 × 自部署价格交互散点图 |

### 传 · 知识传播（K）
| 编号 | 工具 | 说明 |
| --- | --- | --- |
| K-01 | 知识卡片 | MD 自动分页成竖版卡片，4 主题 × 2 比例，导出长图 |
| K-02 | 公众号排版 | MD → 微信兼容富文本（行内样式直出），复制即粘贴 |
| K-03 | 代码分享图 | 代码 → 高亮分享图，4 主题，导出 PNG / SVG |
| K-04 | 幻灯片速成 | MD + `---` 分页成 16:9 幻灯片，打印即 PDF |
| K-05 | 思维导图 | 缩进大纲 → 辐射导图，导出 SVG / PNG |

## 插件体系

格物支持把已有项目（React/Vue/Vite 应用、静态工具、在线服务）以统一契约接入为原生工具：

- **manifest 驱动**：每个插件一个 `plugins/<id>/gewu.plugin.json`（名称/分类/图标/入口/版本/仓库）
- **统一工具壳**：插件页 = `tools/tool.html?id=<id>`，由 `js/loader.js` 渲染壳层并挂载
- **shadow DOM 隔离**：bundle 插件样式不污染宿主，设计令牌与明暗主题可继承
- **一键接入/更新**：`node scripts/embed.mjs add|update|remove <repo>`，目录自动重新生成

```bash
# 示例：接入 / 更新 / 移除
node scripts/embed.mjs add mappedinfo/palette-lab --id v05-palette --code V-05 --cat V --name 色卡实验室
node scripts/embed.mjs update v05-palette
node scripts/embed.mjs remove v05-palette
```

当前插件：**R-06 代数工作台**（mappedinfo/math）、**V-05 色卡实验室**（mappedinfo/palette-lab，经 gewu 适配层原生挂载）、**V-06 图表编辑器**（mappedinfo/mermaid）、**V-07 AI 硬件性价比**（mappedinfo/ShouldIBuy）。

详细契约与适配层写法见 [docs/PLUGINS.md](docs/PLUGINS.md)。

## 技术栈

- 原生 HTML / CSS / JavaScript —— **无框架、无构建、无后端**（插件除外：现有项目自带构建）
- 本地化依赖：`js/lib/`（marked、KaTeX、highlight.js，均下载到本地，可离线运行）
- 目录数据源：`js/catalog.js`（手写 14 件）+ `js/catalog.plugins.js`（脚本生成）驱动首页、页脚与相关工具推荐
- 导出全部走浏览器 Blob / Canvas：SVG、PNG（2×/4× 超采样）、HTML、CSV

## 本地运行

```bash
# 方式一：直接双击 index.html（现代浏览器即可）
# 方式二：本地服务
cd gewu-lab
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 目录结构

```
gewu-lab/
├── index.html          # 首页：hero、工作流、目录筛选、原则
├── about.html          # 关于页：理念、差异对照、技术栈
├── css/base.css        # 设计系统（学术标本馆美学：宣纸 + 蓝图纸 + 朱砂）
├── js/
│   ├── catalog.js      # 手写工具目录（研/视/传 14 件 + 图标 + 缩略图）
│   ├── catalog.plugins.js  # 插件目录（scripts/gen-catalog.mjs 自动生成）
│   ├── plugin.js       # 插件宿主运行时（GEWU_PLUGIN 注册表 + 插件 API）
│   ├── loader.js       # 插件加载器（tools/tool.html?id=<id> 统一工具壳）
│   ├── site.js         # 页头页脚注入、主题切换、通用工具函数
│   ├── index.js        # 首页渲染与筛选
│   ├── lib/            # 本地化第三方库（marked / katex / highlight.js）
│   └── tools/          # 手写工具脚本（r01-* / v01-* / k01-*）
├── plugins/            # 插件目录（每个插件一个文件夹 + gewu.plugin.json）
├── scripts/            # embed.mjs（接入/更新 CLI）+ gen-catalog.mjs（目录生成器）
├── docs/PLUGINS.md     # 插件开发指南
└── tools/              # 手写工具页面 + tool.html（插件统一壳）
```

## 设计说明

- **美学**：学术标本馆 —— 宣纸底色、蓝图纸网格、朱砂印章红、衬线标题 + 等宽编号，每件工具是一张「标本卡」
- **动效**：首页入场渐显、卡片悬停上浮、滚动浮现（IntersectionObserver）
- **主题**：明 / 暗双主题，偏好存 localStorage
- **可访问性**：语义化标签、键盘可操作（幻灯片方向键翻页）、focus 状态

## License

MIT —— 随便用，格物致知。
