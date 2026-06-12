# Moni UI Skill

把 UI 截图、设计稿、App 参考图交给 Codex，生成可点击的 React 网页或 App demo，并在需要真实视觉资产的位置调用内置 `image_gen` 生成位图。

Turn UI screenshots and design references into clickable Vite + React + TypeScript demos with shadcn components, code-rendered UI, and real built-in `image_gen` visual assets.

一句话：**一张 UI 参考图 -> 可点击 demo + 真正落地的生图资产。**

快速安装和调用见 [QUICK_START.md](./QUICK_START.md)。

这个 skill 适合：

- 将 UI 参考图复刻成可预览、可点击的前端 demo
- 区分哪些内容应该用代码实现，哪些内容应该生成图片资产
- 默认交付 Vite + React + TypeScript + shadcn 项目
- 统一使用同一套前端工程架构、tokens、组件分层和验证脚本
- 默认优先从 `moni-ui-foundation` 拉取最新公共基座；任务结束生成 reuse review，帮助沉淀可复用组件和 tokens
- 编排 Codex 内置能力：`imagegen` 负责真实生图，Browser/Playwright 负责预览、截图、点击和 DOM 检查
- 为首屏主视觉、卡片缩略图、复杂插画、纹理、产品图、抠图等资产生成并接回页面
- 做手机 App 参考图时，交付带 iOS 外边框的可交互预览

[教程演示视频](https://v.douyin.com/MJLektzxKpM/)

## 为什么不一样

- 不是把整张 UI 烘焙成一张图片，而是保留真实可交互的文字、按钮和布局。
- 不是只用 CSS/SVG 临摹复杂视觉，而是把主视觉、插画、纹理、产品图等区域交给内置 `image_gen`。
- 最终目标不是一张截图，而是可打开、可点击、可继续改的 demo。

## Demo

<table>
  <tr>
    <th>参考图</th>
    <th>复刻预览</th>
  </tr>
  <tr>
    <td><img src="./assets/cover-reference.png" alt="参考图" width="520"></td>
    <td><a href="./assets/demo.mp4"><img src="./assets/demo-preview.gif" alt="复刻演示视频预览" width="280"></a></td>
  </tr>
  <tr>
    <td>原始参考图</td>
    <td><a href="./assets/demo.mp4">点击查看原视频</a></td>
  </tr>
</table>

## 案例素材

### hicolor 增长案例

从 INS 视觉趋势出发，用 Codex 做成图片创作小工具并上线；上线 3 天获得 1,155 visitors / 2,102 page views。

<table>
  <tr>
    <th>三天访问数据</th>
    <th>传播证据</th>
  </tr>
  <tr>
    <td><a href="./assets/cases/hicolor/traffic-3-days.png"><img src="./assets/cases/hicolor/traffic-3-days.png" alt="hicolor 三天访问数据" width="520"></a></td>
    <td><a href="./assets/cases/hicolor/threads-recommendation.png"><img src="./assets/cases/hicolor/threads-recommendation.png" alt="Threads 推荐 hicolor" width="280"></a></td>
  </tr>
  <tr>
    <td><a href="./references/hicolor-case-study.md">阅读完整 case study</a></td>
    <td><a href="./assets/cases/hicolor/xiaohongshu-pinned.jpg">查看小红书验证图</a></td>
  </tr>
</table>

### 博物馆 App

<table>
  <tr>
    <th>参考图</th>
    <th>复刻预览</th>
  </tr>
  <tr>
    <td><a href="./assets/cases/museum-app/reference-overview.png"><img src="./assets/cases/museum-app/reference-overview.png" alt="博物馆 App 参考图" width="520"></a></td>
    <td><a href="./assets/cases/museum-app/museum-app-demo.mp4"><img src="./assets/cases/museum-app/museum-app-preview.gif" alt="博物馆 App 动图预览" width="280"></a></td>
  </tr>
  <tr>
    <td><a href="./assets/cases/museum-app/reference-overview.png">原始参考图</a></td>
    <td><a href="./assets/cases/museum-app/museum-app-demo.mp4">点击查看原视频</a></td>
  </tr>
</table>

### 女装购物 App

<table>
  <tr>
    <th>参考图</th>
    <th>复刻预览</th>
  </tr>
  <tr>
    <td><a href="./assets/cases/fashion-shopping-app/reference-overview.png"><img src="./assets/cases/fashion-shopping-app/reference-overview.png" alt="女装购物 App 参考图" width="520"></a></td>
    <td><a href="./assets/cases/fashion-shopping-app/fashion-app-demo.mp4"><img src="./assets/cases/fashion-shopping-app/fashion-app-preview.gif" alt="女装购物 App 动图预览" width="280"></a></td>
  </tr>
  <tr>
    <td><a href="./assets/cases/fashion-shopping-app/reference-overview.png">原始参考图</a></td>
    <td><a href="./assets/cases/fashion-shopping-app/fashion-app-demo.mp4">点击查看原视频</a></td>
  </tr>
</table>

### 新闻阅读 App

<table>
  <tr>
    <th>参考图</th>
    <th>复刻预览</th>
  </tr>
  <tr>
    <td><a href="./assets/cases/news-app/reference-overview.png"><img src="./assets/cases/news-app/reference-overview.png" alt="新闻阅读 App 参考图" width="520"></a></td>
    <td><a href="./assets/cases/news-app/news-app-demo.mp4"><img src="./assets/cases/news-app/news-app-preview.gif" alt="新闻阅读 App 动图预览" width="280"></a></td>
  </tr>
  <tr>
    <td><a href="./assets/cases/news-app/reference-overview.png">原始参考图</a></td>
    <td><a href="./assets/cases/news-app/news-app-demo.mp4">点击查看原视频</a></td>
  </tr>
</table>

## 安装

### 从 GitHub 安装

Windows PowerShell：

```powershell
git clone https://github.com/zhu-guli326/moni-ui-skill.git "$env:USERPROFILE\.codex\skills\moni-ui-skill"
```

macOS / Linux：

```bash
git clone https://github.com/zhu-guli326/moni-ui-skill.git "${CODEX_HOME:-$HOME/.codex}/skills/moni-ui-skill"
```

安装后重开 Codex，或新开一个会话。

### 从本地源码安装

<!-- local-source-install -->

如果你已经把仓库克隆到本机，例如：

```text
C:\Users\85013\Documents\MyCode\moni-ui-skill
```

可以复制到 Codex skills 目录：

```powershell
New-Item -ItemType Directory -Force "D:\Codex\.codex\skills" | Out-Null

Copy-Item `
  -Path "C:\Users\85013\Documents\MyCode\moni-ui-skill" `
  -Destination "D:\Codex\.codex\skills\moni-ui-skill" `
  -Recurse `
  -Force
```

后续修改源码后，同步更新已安装 skill：

```powershell
Copy-Item `
  -Path "C:\Users\85013\Documents\MyCode\moni-ui-skill\*" `
  -Destination "D:\Codex\.codex\skills\moni-ui-skill" `
  -Recurse `
  -Force
```

复制后重开 Codex，或新开一个会话，让 skill 重新加载。

也可以直接运行安装脚本。Windows 下优先用 `.cmd` 包装器，避免系统把 `.ps1` 当普通文件打开并弹出“选择应用”：

```bat
.\scripts\install-local.cmd
```

后续同步源码到已安装 skill：

```bat
.\scripts\sync-local.cmd
```

如需清理目标目录中的旧文件后再同步：

```bat
.\scripts\sync-local.cmd -Clean
```

Windows 注意：不要双击 `.ps1` 文件，也不要用系统“打开方式”运行它。请优先运行 `.cmd` 包装器；如果必须调用 `.ps1`，请使用 `powershell -NoProfile -ExecutionPolicy Bypass -File <script.ps1>` 的完整形式。

## Bundled Resources

- `assets/templates/vite-react-shadcn/`：默认 Vite + React + TypeScript + shadcn 起始模板，已固定 React/Vite/Tailwind 3 兼容版本、统一目录结构、tokens、theme presets、公共 primitives、fidelity components、`architecture:check` 和 `package-lock.json`。
- `demo/moni-react-app/`：React demo，展示 `src/assets/generated` 资产通过 TypeScript import 接入组件。
- `references/codex-capability-routing.md`：Moni UI 如何复用 Codex 内置 imagegen、Browser、Product Design 与本地确定性脚本。
- `references/frontend-architecture-contract.md`：统一前端工程架构、目录、tokens、组件边界、资产目录和验证命令。
- `references/foundation-governance.md`：`moni-ui-foundation` 公共基座的拉取、scaffold、任务复盘、沉淀标准和禁止自动学习的边界。
- `references/box-model-fidelity-workflow.md`：用真实 CSS 盒模型做组件化、响应式、可维护的 1:1 还原，并约束像素眼精调顺序。
- `references/high-fidelity-iteration-tools.md`：asset contact sheet、diff diagnosis、theme calibration、repair loop、组件库优先级和速度规则。
- `references/react-shadcn-workflow.md`：React/shadcn 初始化、补齐和组件选择规则。
- `references/real-project-workflow.md`：真实项目里的组件重构、页面生产和验证流程。
- `references/high-fidelity-execution-contract.md`：1:1 模式下的页面蓝图、布局 manifest、元素 manifest、图标 inventory、交互 map、区域 diff、DOM 审计和交付状态门禁。
- `references/fidelity-asset-repair.md`：1:1 高保真截图裁切、素材修复、评分验收和 image_gen 兜底规则。
- `references/high-fidelity-workflow-observations.md`：真实测试日志观察、外部方案调研和下一轮高保真工作流优化清单。
- `scripts/sync-foundation.mjs`：拉取或更新 `moni-ui-foundation`，让新任务使用最新公共工程基座。
- `scripts/scaffold-react-project.mjs`：从 `moni-ui-foundation` 或内置统一模板创建新 React 项目，避免临时手搓工程结构。
- `scripts/generate-reuse-review.mjs`：任务结束后生成 `tmp/fidelity/reuse-review.md`，列出可沉淀到公共基座的候选组件、tokens 和脚本。
- `scripts/promote-to-foundation.mjs`：在用户明确同意后，把指定相对路径复制到 foundation 模板中，默认 dry run，传 `--apply` 才执行。
- `scripts/init-foundation-repo.mjs`：从当前内置模板初始化 `moni-ui-foundation` 仓库。
- `scripts/check-frontend-architecture.mjs`：检查统一目录、tokens、shadcn 位置、资产目录、TS alias、验证脚本和本机绝对路径。
- `scripts/ensure-project-deps.mjs`：按 package/lock hash 跳过无意义依赖重装。
- `scripts/build-asset-contact-sheet.mjs`：把资产清单渲染成可检查的 contact sheet。
- `scripts/diagnose-fidelity-diff.mjs`：把 page/region/DOM/asset 失败分类成 layout、spacing、font、token、asset、overflow。
- `scripts/calibrate-theme.mjs`：从参考图采样颜色和 element manifest 字体层级，生成 theme preset 起点。
- `scripts/run-fidelity-loop.mjs`：根据诊断和 repair queue 输出每轮 focus items，约束自动打回修复循环。
- `scripts/build-repair-queue.mjs`：读取 diff/audit/score 报告，生成 `tmp/fidelity/repair-queue.json`。
- `scripts/inspect-reference-image.mjs`、`scripts/validate-fidelity-plan.mjs`、`scripts/extract-reference-assets.mjs`、`scripts/repair-asset.mjs`、`scripts/score-asset.mjs`、`scripts/capture-fidelity.mjs`、`scripts/compare-fidelity.mjs`、`scripts/compare-region-fidelity.mjs`、`scripts/audit-rendered-elements.mjs`：高保真参考图预检、计划、资产、截图、区域 diff、元素盒子/字体/重叠审计流水线。

验证 React demo 结构：

```bat
.\demo\moni-react-app\validate.cmd
```

## 使用方式

上传 UI 参考图后，在 Codex 里直接说：

```text
使用 moni-ui-skill，参考我上传的图，完成一个可点击预览的 demo。
需要真实调用内置 image_gen 生成必要的位图资产，并把生成结果接回页面。
技术栈默认用 Vite + React + TypeScript + shadcn。直接开始，不用先问我。
不要重建工程架构；新 demo 先拉取 moni-ui-foundation，再使用统一模板、tokens、theme presets、src/components/ui/primitives/layout/fidelity 分层，并运行 architecture:check。
优先复用 Codex 内置 Browser/imagegen/Product Design 能力；moni-ui-skill 只做编排、统一架构、资产契约和验收闭环。
任务结束后生成 reuse-review.md，列出哪些新组件/tokens 值得沉淀到 moni-ui-foundation，但不要未经确认自动提交公共基座。
```

内部执行规则、资产规划细节和 image_gen 生图边界都在 `SKILL.md` 与 `references/` 中，Codex 触发 skill 后会自动读取。

也可以显式用 skill 触发名：

```text
Use $moni-ui-skill，把这张截图复刻成 Vite + React + TypeScript + shadcn 页面。
```

## 提示词模板

<!-- prompt-templates -->

### 基础 UI 复刻

<!-- prompt-basic-ui -->

```text
使用 moni-ui-skill，参考我上传的截图，生成一个可点击预览的 React demo。
请同时扮演资深视觉设计师、资深前端工程师、资深前端架构师：先做视觉与架构判断，再实现。
技术栈默认用 Vite + React + TypeScript + shadcn。
新建项目先同步 moni-ui-foundation，再使用 scripts/scaffold-react-project.mjs；不要重建工程架构，风格差异只通过 src/theme/tokens.css、src/theme/themes/*.css 和页面实现变化。
请先按 CSS 盒模型拆页面：区域 grid/flex/block、padding、margin、gap、border、radius、shadow、asset slot 和组件 owner 都要规划清楚。
请判断哪些区域用代码实现，哪些区域需要调用内置 image_gen 生成图片资产。
生成资产放到 src/assets/generated，并通过 React import 接回组件；精确裁切素材需要高清透明 PNG/WebP 或 SVG，半透明素材必须保留 alpha。
如果字体不接近，请联网查找官方/开源字体包，下载或安装后放到 src/assets/fonts，并通过 src/theme/font-faces.css 引入。
优先调用 Codex Browser 做本地预览、截图、点击和 DOM 检查；Windows 下最后运行 `cmd /c validate.cmd`，或依次运行 `cmd /c npm.cmd run architecture:check`、`cmd /c npm.cmd run typecheck`、`cmd /c npm.cmd run build`，并提供截图验真。
完成后运行 generate-reuse-review，输出可沉淀到 moni-ui-foundation 的候选项和不应沉淀的一次性代码。
完成后启动本地预览，检查主要点击路径，并提供截图验真。
```

### 1:1 高保真复刻

```text
Use $moni-ui-skill，参考这张设计稿做 1:1 高保真 React 页面。
请同时扮演资深视觉设计师、资深前端工程师、资深前端架构师：先判断页面层级、资产边界、组件复用和工程约束，再写代码。
Moni 只做编排：位图资产用内置 imagegen/image_gen，本地预览和 DOM 检查优先用 Codex Browser，普通截图转代码启发可参考 Product Design，但最终工程必须服从统一架构。
新建项目必须先同步 moni-ui-foundation，再使用统一 Vite + React + TypeScript + shadcn 模板，不要重建工程架构；只允许通过 tokens/theme presets 和页面实现改变风格。
页面必须用真实 CSS 盒模型规划，不要用整页截图或随意绝对定位堆叠；组件要可维护、可响应式，同时通过像素眼循环精调。
切图前先运行参考图预检，检查是否含红色批注箭头、水印、浏览器滚动条、下载/缩放浮层、聊天/助手悬浮窗、贴纸或其他非设计元素。
如果参考图被污染，不要直接切图；先要求干净设计稿，或裁出/遮罩成 tmp/fidelity/clean-reference.png 后再作为 source。
在写 React 前，先产出并校验：
tmp/fidelity/page-blueprint.json
tmp/fidelity/layout-manifest.json
assets.manifest.json
tmp/fidelity/element-manifest.json
tmp/fidelity/icon-inventory.json
tmp/fidelity/interaction-map.json
严格按截图统一规划所有资产，包括 logo、支付图标、自定义小图标、线稿、插画、装饰线和背景板。
所有非通用图标必须 original-crop / repair-crop / vector-rebuild / manual-svg，不要默认用 lucide-react 替代。
React 实现前必须生成 asset contact sheet，并使用 --fail-on-review；资产评分必须使用 --fail-on-reject；最终接入 React 前必须再跑 --enforce-asset-acceptance。
颜色/字体不准时先跑 theme calibration，并传 --assets assets.manifest.json，排除 logo、支付图标、插画和线稿 crop 区域，避免主题色被局部资产污染。
字体不准时联网查找官方/开源字体包，自托管到 src/assets/fonts，并在 src/theme/font-faces.css 用 @font-face 引入。
所有 exact 素材先定义 CSS slot，再输出高清半透明 PNG/WebP 或 SVG；不要用白底/米色底冒充透明。
批量裁切/修复/评分后再实现页面；未 accepted、缺 alpha、低于 2x 且无 source-1x-accepted/downgradeReason 的 exact 资产不得接入 React。
完成后用稳定截图跑整页 diff、区域级 diff 和元素级 DOM 审计。
失败后运行 diff diagnosis、repair queue --diagnosis-report tmp/fidelity/diff-diagnosis.json 和 fidelity loop --diagnosis tmp/fidelity/diff-diagnosis.json --max-iterations 6；每轮只修 worst/focus 区域，不要大面积乱改。
critical region 的 maxDiffRatio 不要超过 0.06；输出 worst 10 局部区域并优先修最差区域。
检查关键文字、按钮、价格、状态项的 bounding box、font-size、font-weight、line-height、文本溢出和重叠。
失败时生成 tmp/fidelity/repair-queue.json；整页未过 5% 或 critical 子区域未过，不要说 1:1 完成。
如果严格门槛没过，最终必须标记 loose gate passed only 或 未达 1:1，并列出失败区域。
最后运行 generate-reuse-review，列出可沉淀到 moni-ui-foundation 的候选组件/tokens/scripts；未经确认不要自动 promote。
```

### 真实项目页面生产

<!-- prompt-real-project -->

```text
使用 moni-ui-skill，在当前项目中实现这个页面。
请先读取现有 package.json、路由、组件目录、样式系统和 shadcn 配置。
沿用现有项目结构，不要新建孤立 demo；如果这是空项目或新 demo，必须使用统一模板并保留 architecture:check。
需要生成的视觉资产用内置 image_gen，放到 src/assets/generated。
最后运行项目已有的 typecheck/build/lint；如果项目含 architecture:check，也必须运行，并说明改动文件和验证结果。
如果新增了可复用组件、tokens 或脚本，运行 generate-reuse-review，给出是否建议沉淀到 moni-ui-foundation 的判断。
```

### 组件重构

<!-- prompt-component-refactor -->

```text
使用 moni-ui-skill，重构这个组件，使它更接近我上传的参考图。
保持现有 props、事件、数据结构和路由语义不变。
优先使用现有 shadcn/ui、Tailwind token 和 lucide-react 图标。
如果缺少复杂插图或产品图，再调用内置 image_gen 生成资产并接入。
完成后运行验证命令，并说明兼容性风险。
```

### 移动 App 原型

<!-- prompt-mobile-app -->

```text
使用 moni-ui-skill，把这些 App 截图做成可点击 iOS 风格原型。
默认 Vite + React + TypeScript + shadcn。
需要 iOS 手机外边框、状态栏、Dynamic Island 风格开孔和可点击导航。
多屏之间要能点击跳转，返回/关闭/底部导航都要有反馈。
图片资产使用内置 image_gen，放到 src/assets/generated。
最后给出本地预览 URL 和截图。
```

### 一句话速用版

```text
Use $moni-ui-skill，参考截图直接做成可点击 React demo，默认 Vite + React + TypeScript + shadcn，真实生图走内置 image_gen，资产接入 src/assets/generated，最后截图验真。
统一工程架构不可改；风格只改 tokens/themes/page。Windows 下验证用 cmd /c validate.cmd，启动预览用 node scripts\start-dev-server.mjs --port 5173 或 cmd /c dev.cmd --port 5173；stdout 为空就读 tmp/dev-server.json，不要裸跑 npm/vite/tsc/playwright。
以资深设计师、前端工程师、架构师三重角色执行。
```

Keywords: Codex skill, moni-ui-skill, Moni UI, image_gen, imagegen, image-to-ui, UI screenshot to code, design to code, Vite, React, TypeScript, shadcn, clickable prototype, app demo, frontend demo, AI assets.
