# 格物 GEWU · 插件开发指南

插件体系让任何项目（纯静态页面、React/Vue 应用、在线服务）以统一契约接入格物，
成为目录里的一件原生工具。核心原则：**manifest 声明一切，脚本完成搬运，目录自动生成**。

## 三种接入模式

| 模式 | entry.type | 适用 | 原生度 |
| --- | --- | --- | --- |
| bundle（推荐） | `bundle` | 现有前端项目（React/Vue/Vite…） | 高：shadow DOM 隔离 + 主题跟随 + 设计令牌继承 |
| vanilla | `vanilla` | 手写小工具（单个 HTML 片段） | 高 |
| iframe | `iframe` | 重型 / 纯在线应用 | 低（明确为在线版） |

## 一、bundle 模式（现有项目接入）

### 1. 项目里加一个 gewu 适配入口 `src/gewu-main.jsx`

```jsx
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import indexCss from './index.css?inline';
import appCss from './App.css?inline';

/* CSS 作用域化：:root → :host，body → :host，[data-theme] → :host([data-theme]) */
const scopeCss = css => css
  .replace(/:root\b/g, ':host')
  .replace(/body::before/g, ':host::before')
  .replace(/(^|[,}\s])body(?=[\s{.:,])/g, '$1:host')
  .replace(/\[data-theme=['"]dark['"]\]/g, ":host([data-theme='dark'])");

if (window.GEWU_PLUGIN) {
  window.GEWU_PLUGIN.register({
    id: 'my-tool',                              // 与 manifest.id 一致
    mount(container, api) {
      const shadow = window.GEWU_PLUGIN.attachShadow(container);
      shadow.innerHTML = `<style>${scopeCss(indexCss)}</style><style>${scopeCss(appCss)}</style><div id="root"></div>`;
      const root = createRoot(shadow.querySelector('#root'));
      root.render(<App />);
      return () => root.unmount();              // 可选卸载钩子
    },
  });
} else {
  /* 独立运行时自动降级：直接挂到 #root */
  const root = createRoot(document.getElementById('root'));
  root.render(<App />);
}
```

### 2. 加构建配置 `vite.gewu.config.js`

```js
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-gewu',
    rollupOptions: {
      input: 'src/gewu-main.jsx',
      output: { entryFileNames: 'gewu-plugin.js', chunkFileNames: 'gewu-[name]-[hash].js' },
    },
  },
})
```

`package.json` 加脚本：`"build:gewu": "vite build --config vite.gewu.config.js"`

> ⚠️ 样式不要走普通 `import './App.css'`（会被 Vite 注入宿主文档造成样式泄漏），
> 统一用 `?inline` 导入并在 shadow 中注入。入口文件自行 `import './App.css'` 的，
> 请把该导入移到 `main.jsx`（独立构建入口）。

### 3. 宿主感知（可选但推荐）

应用通过 `api` 获得宿主能力，避免污染宿主页面：

```js
api.theme.get()                                  // 当前主题 'light' | 'dark'
api.themeRoot                                    // 主题应写到的容器（而非 documentElement）
api.find('#foo')                                 // 跨 shadow 查找元素
api.ui.toast('…')                                // 宿主 toast
api.file.downloadText(text, name, mime)          // 宿主下载
api.data.get/set(key, val, ns)                   // 命名空间 localStorage
api.math.fmtSci/fmtNum/parseCSV                  // 宿主数学/解析工具
```

参考实现：`Mappedinfo/palette-lab`（`src/gewu-main.jsx`、`vite.gewu.config.js`、`src/App.jsx` 的 `getThemeRoot/findEl`）。

## 二、接入命令（在 gewu-lab 仓库执行）

```bash
# 接入：拉取 → npm install → npm run build:gewu（无则回退 vite build --base=./）→ 拷入 → 生成目录
node scripts/embed.mjs add mappedinfo/palette-lab \
  --id v05-palette --code V-05 --cat V --name 色卡实验室 \
  --en "Palette Lab" --desc "…" --tags 配色,对比度

# 更新：重新拉取 + 构建，版本号自动取自仓库 package.json
node scripts/embed.mjs update v05-palette

# 移除
node scripts/embed.mjs remove v05-palette

# 仅重新生成目录（手动改过 manifest 后）
node scripts/gen-catalog.mjs
```

环境变量：`GEWU_EMBED_CACHE`（仓库缓存目录，默认 /tmp/gewu-embed）、`GEWU_NPM_CACHE`（npm 缓存）。

## 三、插件清单（gewu.plugin.json）

生成于 `plugins/<id>/gewu.plugin.json`，`update` 时保留全部自定义字段：

```json
{
  "id": "v05-palette",
  "code": "V-05",
  "cat": "V",
  "name": "色卡实验室",
  "en": "Palette Lab",
  "desc": "一句话描述（会显示在卡片与工具页）",
  "tags": ["配色", "对比度"],
  "icon": "<svg…>",          // 24×24 行内 SVG（目录图标）
  "thumb": "<svg…>",         // 120×80 行内 SVG（卡片缩略图）
  "entry": { "type": "bundle", "entry": "gewu-plugin.js" },
  "version": "1.0.0",
  "repo": "mappedinfo/palette-lab"
}
```

`cat` 取值：`R`（研·科研）/ `V`（视·可视化）/ `K`（传·知识传播）。

## 四、目录与页面如何联动

- `scripts/gen-catalog.mjs` → 生成 `js/catalog.plugins.js`（`GEWU_PLUGINS`）
- `js/catalog.js` 加载时自动合并插件条目 → 首页卡片、页脚、相关推荐、工作流全部自动更新
- 工具页统一为 `tools/tool.html?id=<id>`，由 `js/loader.js` 渲染壳层（面包屑/标题/元信息/相关工具）并挂载插件
- 宿主运行时 `js/plugin.js` 提供 `window.GEWU_PLUGIN` 注册表与插件 API，主题隔离由 shadow DOM + `data-theme` 容器属性保证

## 五、检查清单

- [ ] `build:gewu` 产出 `dist-gewu/gewu-plugin.js`（无额外 css 资产）
- [ ] manifest 的 `entry.entry` 与产物文件名一致
- [ ] 应用不写 `document.documentElement.dataset.theme`（写 `api.themeRoot`）
- [ ] 独立运行（无 `GEWU_PLUGIN`）时应用仍可整页工作
- [ ] `node scripts/gen-catalog.mjs` 后首页出现新卡片、计数正确

## 六、自动同步（GitHub Actions）

`embed.mjs sync` 会逐个检查插件 manifest 的 `sourceCommit` 与源仓库远端 HEAD：
有差异才重建嵌入并更新版本号，无差异则不动。

- **本地手动同步**：`node scripts/embed.mjs sync`
- **每日自动同步**：`.github/workflows/sync-plugins.yml` 每天 03:23 UTC 运行一次，
  有更新时自动提交并推送（触发 Pages 重建），无更新则零提交
- **手动触发**：仓库 Actions 页 → sync-plugins → Run workflow

manifest 同步相关字段：

| 字段 | 说明 |
| --- | --- |
| `sync` | `bundle`（构建后整目录拷贝，默认）或 `copy`（按文件列表拷贝，纯静态工具） |
| `sourcePath` | copy 型：源仓库内的子目录（如 `visual-sage`），提交检测按该路径粒度 |
| `files` | copy 型：需要拷贝的文件列表（相对 sourcePath） |
| `sourceCommit` | 上次构建时源仓库（或路径）的 HEAD，自动维护，勿手改 |
| `repo` | 源仓库 `org/repo`（必须与 GitHub 实际仓库名一致） |
