# Moni UI Skill 快速开始

本地 skill 正式名：

`moni-ui-skill`

当前项目目录：

`C:\Users\85013\Documents\MyCode\image2_UI_skill`

安装后建议放到 Codex skills 目录：

`D:\Codex\.codex\skills\moni-ui-skill`

## 安装方式

在当前项目目录执行 `.cmd` 包装器：

```bat
.\scripts\install-local.cmd
```

安装后，重启 Codex，或新开一个会话，让 skill 重新加载。

如果以后你改了本地源码，再同步一次即可：

```bat
.\scripts\sync-local.cmd -Clean
```

Windows 下不要双击 `.ps1` 文件；所有日常安装、同步和验证都优先运行 `.cmd`。

## 如何调用

最直接：

```text
使用 moni-ui-skill，参考我上传的 UI 图，生成一个可点击 React demo。
```

或显式用 skill 触发名：

```text
Use $moni-ui-skill，把这张截图复刻成 Vite + React + TypeScript + shadcn 页面。
```

## 当前默认行为

- 默认技术栈：`Vite + React + TypeScript + shadcn`
- 新 demo 默认先同步 `moni-ui-foundation`，再用统一模板 scaffold
- 工程结构、TS 配置、shadcn 位置、tokens、theme presets、组件分层和 `architecture:check` 保持一致
- 页面先按 CSS 盒模型拆解：`grid/flex/block`、padding、margin、gap、border、radius、shadow、asset slot、component owner
- 1:1 模式下，精确资产优先 `original-crop` / `repair-crop` / `vector-rebuild` / `manual-svg`
- `image_gen` 只作为非精确资产、缺失装饰、背景扩展或概念插画兜底；不要用它重画精确 logo、支付图标、品牌图标和 UI 元素
- 生成或修复后的图片资产放进 `src/assets/generated/`、`src/assets/original/`、`src/assets/repaired/`
- 字体不准时，联网找官方/开源字体包，自托管到 `src/assets/fonts/`，并通过 `src/theme/font-faces.css` 的 `@font-face` 引入
- 高保真资产必须先过 `--fail-on-review`、`--fail-on-reject`、`--enforce-asset-acceptance`，未 accepted 不得接入 React
- 高保真流程会生成 asset contact sheet，用于集中检查 crop、slot、target pixels、alpha、status 和预览
- 主题校准必须传 `--assets assets.manifest.json`，排除 logo、支付图标、插画等 crop 区域，避免主题色被局部资产污染
- 用 React import 接回资产，不使用本机绝对路径
- 优先用 Codex Browser/Playwright 启动预览、点击路径、DOM 检查、截图验真
- 任务结束后生成 reuse review，判断哪些组件、tokens、脚本值得沉淀到 `moni-ui-foundation`

## 提示词模板

### 推荐测试版：1:1 高保真页面

```text
Use $moni-ui-skill，参考我上传的设计稿做 1:1 高保真 React 页面。

目标：组件化、响应式、可维护，同时尽量 1:1 还原。

请按真实工程师和 UI 设计师的流程执行：
1. 先分析页面结构，不要直接写代码。
2. 用 CSS 盒模型规划页面：grid/flex/block、padding、margin、gap、border、radius、shadow、asset slot、component owner。
3. 先拆大区域，再拆按钮、文本、图标、分隔线、价格、状态项和装饰资产。
4. 新建项目必须先同步 moni-ui-foundation，再使用统一 Vite + React + TypeScript + shadcn 模板。
5. 不要重建工程架构；风格差异只通过 tokens/theme presets、页面组件和资产表达。

素材规则：
- 切图前先检查参考图是否含红色批注箭头、水印、浏览器滚动条、下载/缩放浮层、聊天/助手悬浮窗、贴纸等非设计稿元素。
- 如果参考图被污染，不要直接切图；先要求干净原图，或裁出/遮罩成 tmp/fidelity/clean-reference.png。
- 统一规划所有要裁切、修复、矢量化的资产，再批量处理。
- 精确资产优先 original-crop / repair-crop / vector-rebuild / manual-svg。
- 所有非通用图标不要默认用 lucide-react 替代。
- exact 素材先定义 CSS slot，再输出高清透明或半透明 PNG/WebP/SVG。
- 透明必须是真 alpha，不要用白底/米色底冒充透明。
- 半透明线稿如果透明化会破坏线条，必须标记 backgroundMatched 并记录采样背景色。
- image_gen 只允许作为非精确资产兜底；不得用 image_gen 重画 logo、支付图标、品牌资产、精确 UI 图标。

字体规则：
- 先从截图判断字体层级：标题、正文、数字、按钮、协议文字分别记录 font-family、font-size、font-weight、line-height。
- 如果系统字体不接近，请联网查找官方/开源字体包。
- 字体文件放到 src/assets/fonts/。
- 通过 src/theme/font-faces.css 使用 @font-face 引入。
- 再通过 src/theme/tokens.css 的 --font-sans、--font-serif、--font-mono 接入。

实现前必须产出并校验：
- page-blueprint.json
- layout-manifest.json
- assets.manifest.json
- element-manifest.json
- icon-inventory.json
- interaction-map.json

实现前资产必须过闸：
- node scripts/validate-fidelity-plan.mjs ... --mode strict --fail-on-error
- node scripts/extract-reference-assets.mjs --manifest assets.manifest.json --source tmp/fidelity/clean-reference.png
- node scripts/repair-asset.mjs --manifest assets.manifest.json
- node scripts/score-asset.mjs --manifest assets.manifest.json --fail-on-reject
- node scripts/build-asset-contact-sheet.mjs --manifest assets.manifest.json --source tmp/fidelity/clean-reference.png --fail-on-review
- 通过后把合格资产标记为 status: accepted
- 再运行 node scripts/validate-fidelity-plan.mjs ... --enforce-asset-acceptance --fail-on-error
- 未 accepted、无 alpha、低于 2x 且无 source-1x-accepted/downgradeReason 的 exact 资产不得接入 React

实现后必须运行：
- npm run architecture:check
- npm run typecheck
- npm run build
- theme calibration：node scripts/calibrate-theme.mjs --reference tmp/fidelity/clean-reference.png --elements tmp/fidelity/element-manifest.json --assets assets.manifest.json
- 整页 diff
- 区域级 diff
- DOM bounding box / font / overflow / overlap 审计
- diagnose-fidelity-diff
- build-repair-queue --diagnosis-report tmp/fidelity/diff-diagnosis.json
- run-fidelity-loop --diagnosis tmp/fidelity/diff-diagnosis.json --max-iterations 6

验收规则：
- critical region 的 maxDiffRatio 不要超过 0.06。
- 输出 worst 10 局部区域，并优先修最差区域。
- 失败后生成 tmp/fidelity/repair-queue.json。
- 进入 fidelity loop，最多 6 轮，每轮只修 focus 区域，不要大面积乱改。
- 整页未过 5% 或 critical 子区域未过，不要说 1:1 完成。
- 如果严格门槛没过，最终标记 loose gate passed only 或 未达 1:1，并列出失败区域。
```

### 快速 React Demo

```text
使用 moni-ui-skill，参考我上传的截图，生成一个可点击预览的 React demo。

默认技术栈使用 Vite + React + TypeScript + shadcn。
新建项目先同步 moni-ui-foundation，再使用 scripts/scaffold-react-project.mjs。
不要重建工程架构，保留统一目录、tokens、theme presets、components/ui、components/primitives、components/layout、components/fidelity。

请先按 CSS 盒模型拆页面，再实现组件：
- 哪些区域用代码实现
- 哪些区域需要裁切/修复/矢量化资产
- 哪些非精确装饰才允许 image_gen 兜底

生成资产放到 src/assets/generated，并通过 React import 接回组件。
用户提供或从截图裁切的原始素材放到 src/assets/original。
修复后的素材放到 src/assets/repaired。

完成后运行 npm run architecture:check、typecheck/build，启动本地预览，检查主要点击路径，并提供截图验真。
最后生成 reuse-review.md，列出可沉淀到 moni-ui-foundation 的候选组件、tokens 和脚本。
```

### 真实项目页面生产

```text
使用 moni-ui-skill，在当前项目中实现这个页面。

请先读取现有 package.json、路由、组件目录、样式系统、shadcn 配置、tokens、资产目录和验证脚本。
沿用现有项目结构，不要新建孤立 demo。
如果当前项目是空项目或用户明确要新 demo，必须使用 moni-ui-foundation 的统一模板。

请先做页面拆解：
- 大布局和响应式断点
- 组件边界
- CSS 盒模型
- 文本层级和字体
- 图标与插图资产清单
- 交互路径

资产规则：
- 精确图标、logo、支付图标、品牌印章、线稿优先裁切修复或 SVG 重建。
- 复杂插画优先截图裁切 + 去背景 + 放大修复。
- image_gen 只用于非精确装饰、缺失背景扩展或概念插画。
- 字体不准时使用官方/开源字体包，自托管到 src/assets/fonts 并通过 font-faces.css 引入。

最后运行项目已有的 lint/typecheck/test/build。
如果项目含 architecture:check，也必须运行。
说明改动文件、验证结果、剩余风险。
如果新增了可复用组件、tokens 或脚本，生成 reuse-review.md，说明是否建议沉淀到 moni-ui-foundation。
```

### 组件重构

```text
使用 moni-ui-skill，重构这个组件，使它更接近我上传的参考图。

保持现有 props、事件、数据结构、路由语义、埋点和权限逻辑不变。
优先使用现有 shadcn/ui、Tailwind token、项目 primitives、layout 组件和 lucide-react 通用图标。
不要为了视觉复刻破坏组件 API。

请先输出组件拆解：
- 当前组件结构
- 目标视觉差异
- CSS 盒模型调整项
- 字体和 token 调整项
- 需要裁切/修复/矢量化的资产
- 不能用 image_gen 的精确资产

如果缺少复杂插图或非精确装饰，再调用内置 image_gen 生成资产并接入。
完成后运行项目验证命令，并说明兼容性风险。
```

### 移动 App 原型

```text
使用 moni-ui-skill，把这些 App 截图做成可点击 iOS 风格原型。

默认使用 Vite + React + TypeScript + shadcn。
新建项目使用 moni-ui-foundation 统一模板。
需要 iOS 手机外边框、状态栏、Dynamic Island 风格开孔和可点击导航。
多屏之间要能点击跳转，返回、关闭、底部导航都要有反馈。

请先按移动端 CSS 盒模型拆页面：
- phone frame
- safe area
- status bar
- navigation bar
- tab bar
- content scroll region
- modal/sheet/overlay

图片资产优先裁切修复或 SVG 重建。
只有非精确插画、背景氛围、缺失装饰才允许使用内置 image_gen。
生成资产放到 src/assets/generated，通过 React import 接入。
最后给出本地预览 URL、主要点击路径和截图。
```

### 一句话速用版

```text
Use $moni-ui-skill，参考截图做成可点击 React demo，默认 Vite + React + TypeScript + shadcn；先同步 moni-ui-foundation，按 CSS 盒模型拆页面，精确素材走裁切/修复/矢量化，非精确资产才用 image_gen 兜底，字体不准就自托管官方/开源字体包，最后跑 architecture:check、typecheck/build、截图验真和 reuse review。
```
