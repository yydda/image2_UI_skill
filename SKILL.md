---
name: moni-ui-skill
description: Moni UI Skill 将 UI 截图、设计稿、图片转换为可实现的前端代码和图片资产；also use for image to UI, UI screenshot to code, clickable app demo, mobile prototype, iOS preview, React page implementation, component refactor, and high-fidelity UI recreation from reference images. 默认新建交付使用 Vite + React + TypeScript + shadcn，分析哪些部分应该用代码实现，哪些部分应该生成位图资产。识别图片依赖区域、图标、按钮、字体、背景、首屏视觉、产品渲染图、抠图、透明 PNG 资产，生成提示词并回填到前端 UI 中。涉及生图时必须直接使用系统 imagegen skill 的内置 image_gen 工具，确保真实生成位图文件并接回 UI；不要配置或调用本地生图命令、项目 wrapper、外部中转 API、API key fallback 或自写生图请求。当用户要求做成 App 形式、手机 App、iOS 预览、可点击 App demo 或移动端原型时，必须生成带 iOS 手机外边框的可点击预览，并提供渲染截图。
---

# Moni UI Skill

使用这个 skill，把 UI 参考图转成可执行的图片资产方案：先分析哪些区域需要生成图片，再通过内置 `image_gen` 生成、后处理，并集成回 UI。

## 专家角色

执行截图还原时必须同时扮演三个角色：

- **资深视觉/产品设计师**：先判断视觉层级、构图、留白、字体气质、颜色、阴影、图标语义和品牌资产边界；不要只把截图拆成 DOM。
- **资深前端工程师**：用真实组件、可访问语义、稳定尺寸、响应式约束、React import、浏览器截图和 DOM audit 交付可维护页面。
- **资深前端架构师**：维护统一 Vite + React + TypeScript + shadcn 基座、tokens、组件分层、资产目录、验证命令和可复用 primitives；禁止为了单页效果牺牲工程一致性。

如果三者冲突，优先级是：用户目标和安全约束 > 统一架构 > 高保真验收 > 局部视觉捷径。

## Codex 能力复用优先级

Moni UI Skill 是编排 skill，不是单体万能转换器。它负责截图还原流程编排、统一前端工程架构、资产契约和验收闭环；Codex 已经内置且效果更好的能力必须优先复用。

执行优先级：

1. 位图生成、图片编辑、透明背景 cutout 和视觉变体：直接使用系统 `imagegen` skill 的内置 `image_gen` 工具。
2. 本地预览、截图、点击、DOM bounding box、文本溢出和交互检查：优先使用 Codex Browser；没有 Browser 工具时才使用项目内 Playwright/脚本兜底。
3. 普通截图转代码启发：可以加载 `product-design:get-context` + `product-design:image-to-code` 辅助分析和实现，但最终工程结构必须服从 Moni UI 的统一架构。
4. 高保真确定性检查：使用本仓库脚本做 preflight、contact sheet、theme calibration、crop、repair、score、diff diagnosis、DOM audit、repair queue 和 fidelity loop。
5. 不接 Figma 路径；本 skill 只服务“截图/图片输入 -> 前端代码”工作流。

详细路由见 `references/codex-capability-routing.md`。如果 Codex 内置能力与本 skill 的统一工程架构冲突，统一工程架构优先，内置能力只作为分析或实现辅助。

## 统一架构不可变约束

新建 demo、页面原型和从零开始的 React 交付必须共享同一套 Vite + React + TypeScript + shadcn 工程基座。风格可以通过 CSS tokens、theme preset 和页面实现变化；工程目录、脚本、TS alias、shadcn 位置、资产目录和验证命令不能随任务自由变化。

执行要求：

- 新建项目使用 `scripts/scaffold-react-project.mjs` 或整目录复制 `assets/templates/vite-react-shadcn/`，不要临时手搓工程结构。
- 所有新建项目必须保留 `architecture:check` 和 `deps:ensure`，并在交付前运行 `npm run architecture:check` 或 `node scripts/check-frontend-architecture.mjs --project <project>`。
- `src/components/ui/` 只放 shadcn 基础组件；复用 UI primitives 放 `src/components/primitives/`；布局放 `src/components/layout/`；高保真测量组件放 `src/components/fidelity/`。
- 颜色、字号、字重、行高、间距、圆角、阴影、边框、z-index 等通过 `src/theme/tokens.css` 和 `src/theme/themes/*.css` 表达，不在页面里散落大量一次性颜色和魔法值。
- 高保真绝对定位只允许被限制在 `FidelityCanvas` 内，并绑定 `data-fidelity-id`，方便 DOM audit 和局部 diff 定位。

完整约束见 `references/frontend-architecture-contract.md`。

## image_gen 生图优先规则

当用户明确要求“调用 Image Gen 生图”“调用 image_gen”“参考图片做高保真 UI”，或参考图的效果明显依赖摄影、插画、颗粒、半色调、像素噪点、复杂纹理、景深、真实材质、复杂岛屿/地图/角色等位图质感时，必须优先走系统 `imagegen` skill 的内置 `image_gen` 位图生成流程，而不是只用 HTML/CSS/SVG 做近似。

如果用户沿用旧的生图叫法，在本 skill 中也统一解释为 Codex 内置 `image_gen` 工具，而不是本地命令、项目脚本或外部 API。

在这类任务里：

- 必须先判断哪些区域属于 **必须真实生图**，哪些区域属于 **必须代码实现**。
- 必须至少通过内置 `image_gen` 生成并落地一批真实位图资产后，才能声称“已经真实生图”。
- 不要把“用 CSS 画了一个相似背景”“用 SVG 拼了插画”“用渐变和噪点近似了风格”描述成已经完成生图。
- 如果只是先做代码骨架，必须明确说明“当前仅完成结构 UI，还未真正调用内置 image_gen 生成资产”。
- 如果用户要的是高保真复刻，优先生成主视觉、路线插画、卡片缩略图、复杂背景纹理等高影响位图资产，再做 CSS 微调。

以下内容默认视为 **应优先调用内置 image_gen**：

- 首屏主视觉海景、人物、产品、摄影感场景
- 带颗粒、半色调、像素噪点、蓝晒/丝网印刷、扫描感的复杂插画
- 跳岛路线图中的岛屿插画、装饰地图、复杂海岸线和非标准装饰物
- 卡片缩略图、场景图、带统一美术风格的多张主题图
- 用代码实现会显著降低质感或极难逼近参考图的区域

以下内容默认 **不要交给 image_gen**：

- 标题、正文、价格、按钮文案、列表文案、标签、导航文字
- 常规按钮、输入框、卡片、分隔线、底部导航、常规 icon 容器
- 需要保持可访问、可翻译、可交互的 UI 文本

## image_gen 调用边界

本 skill 的唯一生图入口是系统 `imagegen` skill 的内置 `image_gen` 工具。不要再寻找或调用本地生图命令、项目 wrapper、外部中转 API、OpenAI SDK、自写 API 请求或任何需要 API key 的 fallback。

执行时：

- 在任何真实生图前，先按 `references/imagegen-entrypoint.md` 确认当前任务是否需要位图资产、哪些区域由代码实现、哪些区域由内置 `image_gen` 生成。
- 触发生图时，直接使用系统 `imagegen` skill 的默认内置工具模式；不要写 shell 命令、不要检查 API key、不要新增中转脚本。
- 项目需要使用生成结果时，按 `imagegen` skill 的保存策略，把选定输出从 `$CODEX_HOME/generated_images/...` 复制到当前项目资源目录，再接回页面。
- 如果内置 `image_gen` 工具不可用，停止并说明缺少可用生图入口；不要自动切到 CLI/API fallback，也不要声称已经生图。
- 可以继续实现代码 UI 骨架，但必须明确标注“尚未完成真实位图资产生成”，不能把代码近似、CSS/SVG 视觉或其它来源图片写成 image_gen 结果。

### 生图执行方式

内置 `image_gen` 不是项目 CLI。执行真实生图时：

1. 为每个需要位图的资产写出清晰提示词、目标用途、比例和避让项。
2. 直接调用系统 `imagegen` skill 的内置 `image_gen` 工具生成图片。
3. 检查输出是否满足主体、风格、构图、文字避让和 UI 集成要求。
4. 对项目要使用的图片，复制到项目内的 `assets`、`public`、`src/assets` 或 demo 本地资源目录。
5. 更新页面代码或样式，让生成图片真实出现在可预览 UI 中。

## image_gen 最小闭环

当任务触发 image_gen 流程时，至少完成这个闭环：

1. 从参考图中拆出必须生图的资产类别。
2. 为每个资产或同风格资产组编写可执行提示词。
3. 实际调用内置 `image_gen`，产出真实位图文件。
4. 必要时做裁切、切片、透明化、尺寸修正或导出不同槽位版本。
5. 将生成结果接回前端页面，而不是只停留在“生成了一张图”。
6. 打开真实页面截图，验证这些资产已经被渲染，而不是停留在本地文件夹。
7. 在最终汇报里列出生成资产路径，并明确说明哪些视觉区域已经改为真实生图。

如果上述 1-7 没完成，不要把任务描述成“已用 image_gen 完成复刻”；应准确描述为“已完成部分生图”或“仅完成生图准备”。

## App 形式触发规则

当用户说“做成 App 形式”“手机 App”“iOS 预览”“App demo”“移动端原型”“可点击 App”或参考图明显是手机应用界面时，默认按 App 原型交付，而不是只生成裸页面。

必须做到：

- 生成一个带 iOS 手机外边框的预览容器，包含圆角黑色机身边框、顶部状态栏、安全区和类似 Dynamic Island 的顶部开孔；参考图如果已经有手机壳/边框，优先保持同类观感。
- App 页面内容放在手机屏幕内部，使用固定设计画布或等比例缩放方案，避免窗口变窄时文字、按钮、插画和状态栏重叠。
- 所有明显按钮、关闭/返回、底部导航、卡片、选项、Next/Continue 等控件都必须可点击；单屏也要有选中态、切换态、反馈态或模拟跳转。
- 提供可在浏览器打开的可点击预览版本，并在完成前用浏览器实际点击主要路径。
- 产出至少一张渲染截图，截图必须能看到完整 iOS 外边框和屏幕内 App 页面；最终说明中写明截图路径或验证方式。
- 最终回复必须直接嵌入渲染截图，并给出本地预览 URL、项目根目录、demo 目录和可打开的 HTML 文件路径；不能只说“已截图”或只给 `localhost`。
- 外边框、状态栏、电量/Wi-Fi/信号等系统装饰可以用代码实现；不要把可读 App 文案烘焙进图片。
- iOS 状态栏图标必须截图放大检查：信号、Wi-Fi、电量不能画成可读字母、乱码或伪文字。优先用内联 SVG、图标库或明确几何图形，不要用看起来像 `U`、`C`、`O` 的 CSS 边框近似。
- Demo 交付必须能离线打开主要界面；图片、插画和缩略图要落地到项目本地资源目录，不要把远程图片 URL 当作最终资产交付。
- 复杂 App demo 应提供可复跑的验证方式，例如项目内验证脚本或明确的命令，覆盖页面启动、截图生成、主要点击路径和破图检查。

如果没有完成 iOS 外边框、可点击预览和截图验证，不要把结果描述成“已做成 App 形式”。

## 网页交付默认规则

当用户要求复刻 UI、参考截图做 demo、做 App 形式、做网页预览、可点击预览或高保真还原时，默认最终交付物必须是一个可在浏览器打开的网页/demo，而不是只返回图片、截图、说明文档或生成资产。

执行时：

- 至少创建或更新一个入口 HTML/前端页面，并确保它能本地打开或通过本地 dev server 访问。
- 截图只能作为验收证据，不能替代网页/demo 本身。
- 如果任务里生成了图片资产，必须把图片资产接回网页；不要只把图片留在文件夹里。
- 最终回复必须给出可打开的预览 URL 或入口 HTML 文件路径，并同时给出项目根目录和 demo 目录。
- 如果因为环境限制暂时只能完成截图或资产准备，必须明确说明“尚未完成网页交付闭环”，不能把它描述成已完成可预览 demo。

## React 默认交付模式

没有现成项目约束时，默认交付为 **Vite + React + TypeScript + shadcn**。把它当成可继续开发的前端实现，而不是一次性静态 HTML 草稿。

Framework priority（框架选择优先级）：

1. 用户明确指定技术栈时，优先遵循用户指定。
2. 当前 workspace 已有前端项目时，先读取 `package.json`、构建配置、路由、样式系统、组件库和目录约定，沿用现有栈与现有组件，不为单次 UI 任务擅自迁移框架。
3. 已有项目是 React/Vite/TypeScript 时，直接在现有结构内实现或重构，优先复用现有 `src/components`、`src/pages`、`src/lib`、主题 token、Tailwind/shadcn 配置和路由。
4. 已有项目不是 React 时，除非用户明确要求迁移，否则按原框架实现，并只保留 image_gen 资产规划和验真规则。
5. 当前目录没有可用前端项目，或用户要求新建 demo/app 时，创建 Vite + React + TypeScript + shadcn 项目；优先复用 `assets/templates/vite-react-shadcn/` 作为起点。
6. 只有在用户明确要求极小静态文件、邮件模板、嵌入片段、无构建 HTML，或目标环境不能运行 React 构建时，才退回纯 HTML/CSS/JS。

默认 React 项目结构：

```text
package.json
package-lock.json
index.html
vite.config.ts
tsconfig.json
tsconfig.app.json
components.json
src/
  app/
    AppShell.tsx
    routes.tsx
  pages/
  main.tsx
  App.tsx
  vite-env.d.ts
  index.css
  components/
    ui/
    primitives/
    layout/
    fidelity/
  theme/
    tokens.css
    themes/
      default.css
      warm-finance.css
      mobile-ios.css
    typography.css
  assets/
    generated/
    original/
    repaired/
  data/
  lib/
    utils.ts
    asset-registry.ts
  types/
    fidelity.ts
    page.ts
```

实现规则：

- 新建项目时使用 React + TypeScript，配置 `@/*` 指向 `src/*`。
- 新建项目时优先运行 `node scripts/scaffold-react-project.mjs --target <target>` 或整目录复制 `assets/templates/vite-react-shadcn/`，保留模板里的固定版本 `package.json`、`package-lock.json`、`tsconfig*.json`、`src/vite-env.d.ts`、`architecture:check` 和 `src/theme/`；不要把依赖改成 `latest`。
- 对新 demo 优先执行 `npm run deps:ensure`；如果项目没有该脚本，再执行一次 `npm ci --prefer-offline --no-audit --fund=false`，只有没有 lockfile 时才退回 `npm install --no-audit --fund=false`；不要在修一个配置后反复重新安装。
- 使用 shadcn 组件承载按钮、卡片、输入框、对话框、标签页、开关、菜单、分隔线、表格和表单等常见 UI；只添加实际需要的组件。
- 使用 Tailwind/shadcn 主题 token 组织颜色、圆角、阴影和状态，不在组件里散落大量一次性魔法值。
- 页面级实现放在 `src/pages/`；可复用 controls 放在 `src/components/primitives/`；页面布局放在 `src/components/layout/`；高保真测量/资产槽位组件放在 `src/components/fidelity/`；shadcn 基础组件留在 `src/components/ui/`。
- 数据、导航项、卡片列表、商品列表和模拟内容放在 `src/data/` 或组件附近的 typed 常量中，避免把大量重复 JSX 写死。
- 图标优先使用项目已有图标库或 `lucide-react`。shadcn 按钮和工具栏里优先使用图标加可访问文本或 `aria-label`。
- 完成后至少运行 `npm run architecture:check`、类型检查/构建或项目已有验证脚本；再启动本地 dev server，用浏览器检查交互和截图。模板默认使用 `vite --host 0.0.0.0`，优先探活 `http://127.0.0.1:<port>`，浏览器等待状态优先用 `load` 或 `domcontentloaded`。

shadcn 规则：

- 对新 Vite 项目，优先使用 `assets/templates/vite-react-shadcn/`；这个模板已固定 React/Vite/Tailwind 3/shadcn 兼容依赖，包含 lockfile、`moduleResolution: "Bundler"` 和 Vite 类型声明。需要从零初始化时，按 shadcn 官方 Vite 流程初始化 shadcn/ui。
- 已有 Vite 项目则先检查 `components.json`、Tailwind 配置、`src/lib/utils.ts`、`@/*` alias 和包管理器 lockfile，再在不破坏现有配置的前提下补齐缺失项。
- 已有 shadcn 配置时，只添加缺失组件，不重复初始化，不覆盖现有 `components.json`、`tailwind.config`、`index.css` 或 `utils.ts`。
- 如果网络、包管理器或环境限制导致 shadcn CLI 不可用，先说明限制，再用本地 React 组件实现 shadcn 风格的同等 UI 结构；不要谎称已经安装 shadcn。
- 不要把 shadcn 当作视觉万能钥匙。复杂主视觉、照片、纹理、产品图和插画仍按 image_gen 资产规则处理。

React/shadcn 新建、初始化或补齐细节见 `references/react-shadcn-workflow.md`。统一架构检查见 `references/frontend-architecture-contract.md`。

## React Asset Integration

React 项目中，生成资产默认放在 `src/assets/generated/`；用户提供且需要原样保留的参考素材放在 `src/assets/original/`。除非部署路径、CDN 或超大静态资源要求使用 `public/`，不要把项目消费的生成图片散落在根目录或临时目录。

接入规则：

- 通过 TypeScript import 引用项目内资产，例如 `import heroImage from "@/assets/generated/hero-main.webp"`，再传给组件；不要在 JSX 中硬编码本机绝对路径。
- 需要响应式多尺寸时，为同一资产使用清晰后缀，例如 `hero-main-desktop.webp`、`hero-main-mobile.webp`、`product-card@2x.webp`。
- 背景图可以用 CSS 变量或 inline style 绑定 imported URL，但仍要有稳定 `aspect-ratio`、`min-height`、`object-fit` 或 `background-size` 约束。
- 信息图片使用真实 `alt`；纯装饰图使用 `alt=""` 并避免读屏冗余。
- 大图优先导出 WebP/AVIF；透明、需要 alpha 或边缘细节的资产用 PNG/WebP。避免把未压缩巨图直接接入首屏。
- 生成图片只存在于 `$CODEX_HOME/generated_images/...` 不算完成；必须复制到项目资产目录并由 React 页面真实引用。
- 如果重构已有组件，优先保持现有 asset import 风格、命名风格和构建约定。

## Real Development Workflow

这个 skill 可以用于真实项目里的组件重构、页面生产和 UI 资产补齐，但执行方式要从“做 demo”切换成“改现有工程”：

- 先读现有目录、路由、设计系统、组件库、状态管理、数据来源、测试和构建脚本，再决定改哪些文件。
- 重构组件时保持外部 API、props、事件、数据加载、路由、权限和埋点语义，除非用户明确要求改接口。
- 新页面应接入现有路由、布局、鉴权边界、错误态、加载态和空态；不要只新增孤立页面文件。
- 使用真实可编辑文本和组件，不把业务文案、按钮、价格、表单或动态数据烘焙进图片。
- image_gen 只用于缺失的视觉资产、复杂插画、产品/场景图、纹理、抠图等位图内容；现有品牌素材、用户照片、logo 和精确产品截图优先保留原素材。
- 真实项目默认要跑项目已有的 lint、typecheck、test、build 或最接近的验证命令；如果跑不了，说明原因和剩余风险。
- 真实开发交付时，最终说明要列出改动文件、验证命令、预览 URL/截图、生成资产路径，以及与现有系统的集成点。

真实项目改造的发现、实现和验证细节见 `references/real-project-workflow.md`。

## Strict Fidelity Execution

当用户要求 1:1、高保真、像素级复刻，或明确指出 image_gen 生成了不相干图片时，默认进入高保真素材修复流程：**截图裁切 + 本地修复 + 元素清单 + 图标清单 + 评分验收 + image_gen 兜底**。

执行规则：

- 禁止直接开始写 React 页面；必须先产出并校验 `tmp/fidelity/page-blueprint.json`、`tmp/fidelity/layout-manifest.json`、`assets.manifest.json`、`tmp/fidelity/element-manifest.json`、`tmp/fidelity/icon-inventory.json`、`tmp/fidelity/interaction-map.json`。
- 切图前必须先运行 `node scripts/inspect-reference-image.mjs --source <design.png> --out-dir tmp/fidelity/reference-preflight --fail-on-contamination`。如果参考图含红色批注箭头、斜向水印、浏览器滚动条、下载/缩放浮层、聊天/助手悬浮窗、卡通贴纸或其他非设计稿元素，不得直接从这张图裁切资产。
- 参考图预检失败时，先要求干净设计稿；如果用户没有干净图，先裁出纯设计画布或手动遮罩污染层，保存为 `tmp/fidelity/clean-reference.png`，再用它作为后续 `--source`。`scripts/extract-reference-assets.mjs` 默认会执行同一预检并拒绝污染源；只有非精确资产排查时才可显式加 `--allow-contaminated-source`，且最终报告必须降级说明。
- 先运行 `node scripts/validate-fidelity-plan.mjs --blueprint tmp/fidelity/page-blueprint.json --layout tmp/fidelity/layout-manifest.json --assets assets.manifest.json --elements tmp/fidelity/element-manifest.json --icons tmp/fidelity/icon-inventory.json --interactions tmp/fidelity/interaction-map.json --mode strict`；失败时先修计划，不进入实现。
- 页面蓝图必须描述 canvas、major regions、text layers、asset slots、interaction targets 和 known risks；布局 manifest 必须给每个主要区域绑定组件或实现责任；element manifest 必须记录关键按钮、文本、图标、分割线、价格、状态项的 x/y/width/height/font/selector；icon inventory 必须覆盖所有自定义图标。
- React 实现前必须运行 `node scripts/build-asset-contact-sheet.mjs --manifest assets.manifest.json --source tmp/fidelity/clean-reference.png`，查看 `tmp/fidelity/asset-contact-sheet.html`，确认所有 exact 资产都有正确 crop/repair/vector 策略和预览。
- 新主题或颜色/字体明显不准时，先运行 `node scripts/calibrate-theme.mjs --reference tmp/fidelity/clean-reference.png --elements tmp/fidelity/element-manifest.json`，把输出作为 `src/theme/themes/*.css` 的起点，再以设计判断微调。
- 1:1 模式下所有非通用图标，包括支付图标、品牌印章、业务图标、状态时间线图标、底部保障图标和页面专属小图标，必须走 `original-crop`、`repair-crop`、`vector-rebuild` 或 `manual-svg`；不得默认用 `lucide-react` 替代。只有真正通用的 chevron、关闭、播放等系统符号可以用图标库。
- critical region 默认 `maxDiffRatio` 不得高于 `0.06`；如果某个 critical region 设置到 `0.11`、`0.12` 或更宽，计划校验必须失败。局部区域没过时，不允许用整页观感或宽松阈值掩盖。
- 不假设有 Figma/PSD 源文件；先从用户提供的设计稿截图裁切可保留资产。
- 精确 logo、支付图标、品牌印章、线稿城市、细线装饰、已有产品截图默认走 `original-crop`、`repair-crop` 或 `vector-rebuild`；不要直接用 `image_gen` 重画。
- 裁切素材不清晰时，优先用本地修复：`rembg-alpha`、`flat-bg-alpha`、`upscale`、`vectorize-svg` 或 `manual-svg`。
- 浅色线稿如果透明化会破坏细线，允许 `background-matched`，但必须记录背景色并匹配容器背景。
- `image_gen-fallback` 只用于非精确资产、缺失装饰、背景扩展或概念插画；每次调用前说明为什么裁切/修复不可用。
- `qualityGate: exact` 的资产不得使用 `image_gen-fallback`。生图兜底必须有 `rejectIf`，不合格最多重试两次。
- 如果把资产从 2x/`upscale` 降为 1x/`none`，必须写 `downgradeReason` 和证据；不得无说明降低质量门槛。
- 使用 `scripts/extract-reference-assets.mjs`、`scripts/repair-asset.mjs`、`scripts/score-asset.mjs`、`scripts/capture-fidelity.mjs`、`scripts/compare-fidelity.mjs`、`scripts/compare-region-fidelity.mjs` 和 `scripts/audit-rendered-elements.mjs` 形成可复跑验收证据。
- 最终必须跑整页 diff、区域级 diff 和元素级 DOM 审计；元素审计要检查关键 selector 的 bounding box、字体大小、字重、文本溢出和声明的 overlap group。
- diff、DOM audit 或 asset score 失败后，必须运行 `diagnose-fidelity-diff.mjs`、`build-repair-queue.mjs` 和 `run-fidelity-loop.mjs`，每轮只修 worst/focus 区域，最多 3 轮后仍失败则降级交付状态。
- 字体校准必须进入截图循环：先按 element manifest 记录标题、正文、数字、按钮、协议文案等字体预期，再运行 DOM 审计，调整 `font-family`、`font-size`、`font-weight`、`line-height`，直到关键文本层级接近参考图或明确记录不可达原因。
- 区域级 diff 必须输出 worst 10 regions；修复时优先处理最差的局部区域，例如支付栏、右侧时间线、主卡片图标组、页头标题，而不是只看整体缩略图。
- 如果严格 1:1 门槛未过，最终状态必须写 `loose gate passed only` 或 `未达 1:1`，并列出失败区域；不要声称 1:1 已完成。

高保真强制执行顺序和四件套 schema 见 `references/high-fidelity-execution-contract.md`。高保真资产 manifest 字段、修复策略、评分规则和生图兜底 prompt 见 `references/fidelity-asset-repair.md`。asset contact sheet、diff diagnosis、theme calibration、repair loop、组件库和速度规则见 `references/high-fidelity-iteration-tools.md`。真实测试中发现的工作流问题、外部方案调研和下一步优化清单见 `references/high-fidelity-workflow-observations.md`。

## 核心流程

1. 在编辑代码或生成图片之前，先检查用户提供的每一张 UI 参考图。
2. 将 UI 拆分为：
   - **代码渲染 UI**：布局、文字、按钮、卡片、简单渐变、边框、阴影、开关、表单、图表和重复组件。
   - **图标资产**：优先使用项目已有图标库或 lucide 风格矢量图标。只有当图标是自定义插画式标记，且设计系统无法表达时，才生成图标。
   - **Moni UI 图片资产**：照片、插画、产品渲染图、角色、复杂纹理、复杂首屏背景、真实物体、App 展示图、装饰性位图，以及用代码复刻会脆弱或低质的视觉内容。
   - **抠图资产**：需要透明 PNG/WebP、遮罩或去背景的前景人物、产品、物体。
3. 先输出前期审查文档，说明哪些元素好还原、哪些元素不好还原、哪些需要生成图片、哪些需要用户确认；如果用户已经明确要求“直接做”或“直接复刻”，可以跳过等待，但仍要先在内部完成这一步拆解。
4. 等用户确认关键问题后，再进入生图；如果用户明确要求“直接继续”，可以用合理假设继续，但要记录假设。
5. 高保真模式下先输出并校验 `page-blueprint.json`、`layout-manifest.json`、`assets.manifest.json`、`element-manifest.json`、`icon-inventory.json`、`interaction-map.json`；普通模式下至少输出资产清单。资产清单要包含资产 id、UI 位置、目标槽位尺寸、导出尺寸、宽高比、`sourceStrategy`、`repairStrategy`、`qualityGate`、后处理需求、集成目标，以及是否允许 `image_gen-fallback`。
6. 只生成真正需要位图生成的资产。结构性 UI、可读文字和普通控件继续用代码实现；1:1 精确资产先裁切/修复/矢量重建。
7. 对需要统一风格的一组资产，优先考虑“一次生成统一资产板，再切片导出”的方案，减少风格漂移。
8. 按需做后处理：裁剪、缩放、去背景、添加 alpha、压缩和尺寸验证；高保真资产必须先运行 contact sheet、本地修复与评分脚本，不合格则打回。
9. 将生成资产集成到 UI 中；React 项目默认复制到 `src/assets/generated/` 并通过 TypeScript import 接入组件，同时使用稳定尺寸、`object-fit`、响应式约束、alt 文本和必要的懒加载。
10. 优先复用模板 primitives：`PaymentOption`、`StatusTimeline`、`AgreementBar`、`NoticeBanner`、`InfoSummaryCard`、`PriceText`、`StatusDot`、`IconFrame`、`PhoneFrame`、`FidelityCanvas`、`AssetSlot`、`MeasuredText`；不要为常见支付/状态/提示/金额/手机壳模式写一次性组件。
11. 给页面补齐可点击行为和跳转逻辑：明显的按钮、链接、返回/关闭、卡片、标签、导航项都要有真实交互；多屏参考图要自动串成可流转原型。
12. 对完整页面做最终审查：检查尺寸、乱码、排版、响应式、图片嵌入、代码 UI 的融合和交互跳转是否自然。
13. 将最终页面截图与原始 UI 参考图做差距核对，列出差异，修正后再次截图对比；失败时用 `diagnose-fidelity-diff.mjs`、`build-repair-queue.mjs`、`run-fidelity-loop.mjs` 进入下一轮。
14. 如果目标是前端应用，最后用渲染截图和点击路径验证效果，并确认截图里真实出现了 image_gen 资产。

确认内置 image_gen 调用边界、判断能否真实生图时，读取 `references/imagegen-entrypoint.md`。构建资产清单、编写 Moni UI 提示词、计算输出尺寸或规划抠图/去背景时，读取 `references/asset-manifest-and-prompts.md`。

当用户要把社媒视觉热点、INS/Pinterest 小趋势或图像创作工具做成可用网页，并关心上线验证、传播数据或技术社区案例时，可读取 `references/hicolor-case-study.md` 作为真实项目参考。

## 真实生图验真

如果任务涉及 image_gen，最终必须输出一段“生图验真”信息，至少包含：

- 实际生成了哪些资产
- 每个资产的落地路径
- 每个资产实际使用的工具：`built-in-image_gen`
- 哪些页面区域已经替换为真实位图
- 哪些区域仍然是代码近似
- 用什么截图或页面验证方式确认这些资产已经显示

禁止出现以下误导性表述：

- “已按 image_gen 流程完成”，但没有任何新生成位图文件
- “已经生图”，但图片没有接入页面
- “已经高保真复刻”，但复杂视觉仍全部由 CSS/SVG 临摹

如果页面仍主要依赖代码近似，必须明确写成：

- “当前为结构复刻版，尚未完成真实 image_gen 资产替换”
- 或 “当前仅首页主视觉已接入生图，其余区域仍待补齐”

## 前期审查与确认

当用户先提供 UI 图、首页参考图或视觉参考图时，先交付一份前期审查文档，不要立刻生图，除非用户明确要求直接生成。

前期审查文档必须包含：

- **整体判断**：页面类型、主要视觉风格、核心布局、首屏重点和潜在实现风险。
- **好还原元素**：适合用代码直接实现的结构，例如文本、按钮、卡片、导航、表单、简单图标、常规阴影和简单背景。
- **中等难度元素**：需要结合 CSS、图标库、少量图片或响应式裁剪才能还原的区域。
- **不好还原元素**：复杂插画、真实摄影、人物/产品抠图、复杂 3D/材质、品牌专属图形、参考图中难以复刻的视觉质感。
- **字体判断**：识别参考图里的标题、正文、数字、按钮和品牌字形气质，判断可用系统字体、项目已有字体、开源 Web 字体，还是必须由用户提供授权字体。
- **图片生成候选**：需要 Moni UI 生成的图片资产，包含位置、用途、预估尺寸、是否需要透明背景和生成风险。
- **image_gen 优先级**：标明哪些候选资产属于“必须生图”“建议生图”“可用代码近似”。
- **需要确认的问题**：列出继续前必须问用户的问题，例如是否允许风格近似、是否必须保留 logo/产品原图、图片是否可上传外部服务、最终页面尺寸、移动端是否也要还原、是否接受 AI 生成纹理或人物。
- **下一步建议**：给出推荐执行顺序，例如先确认品牌资产和页面尺寸，再生成首屏图，再生成抠图资产，最后做页面级审查。

将元素难度分为：

- **容易**：用代码或现有图标库稳定实现，几乎不需要生图。
- **中等**：可以实现，但需要精细 CSS、响应式处理、局部图片或设计取舍。
- **困难**：依赖复杂图片、精确品牌资产、真实摄影/材质/人物、抠图或模型生成质量。
- **不建议直接生成**：包含精确 logo、商标、用户专属照片、精确产品截图或必须 100% 还原的版权资产，应优先使用用户提供的原始素材。

如果用户的问题会影响生成结果、版权/品牌准确性、外部 API 使用或最终页面尺寸，先询问并等待确认。不要为了推进任务而自行假设高风险事项。

如果用户已经表达过“你上次没有真的生图”“不要只做代码近似”“必须调用 image_gen / Image Gen / 旧生图叫法”，把这视为高优先级纠偏信号：后续执行时应默认优先补足真实位图资产，而不是继续只改 CSS。

## UI 分析规则

除非用户明确要求生成“截图式整图”，否则所有可读 UI 文字都应该用代码渲染。不要把导航文字、按钮文案、价格、表单标签或动态内容写死进生成图片。

以下内容优先用代码实现：

- 按钮、标签页、分段控件、输入框、菜单、卡片、分割线、徽标、图表、表格和布局网格。
- 当前图标库已经覆盖的简单几何图标。
- CSS 能稳定表达的阴影、发光、模糊、渐变和简单图案背景。

以下内容优先用 Moni UI 生成：

- 首屏照片、生活方式图片、编辑风插画、产品场景、吉祥物、头像、真实设备样机、复杂背景底图、手工质感纹理、3D 感物体和装饰性位图组合。
- UI 依赖某种特定视觉情绪、主体或参考图风格匹配的区域。
- 产品、人物或物体叠层所需的透明抠图。

如果参考图的关键美术风格来自像素颗粒、半色调、印刷噪点、扫描噪点、摄影纹理或复杂插画，不要把这些关键区域全都归类为“可用代码实现”。这类区域通常应至少生成一个或多个真实位图资产，再用代码承载布局与交互。

如果用户提供的图片看起来是 logo、品牌标识、精确产品截图、用户照片，或用户明确希望保留的版权/商标资产，直接使用原图。除非用户拥有/提供该资产并要求做变体，否则不要用生图模型复刻精确 logo。

## 字体识别与加载

字体是 UI 还原的一部分。不要把特殊字体做进图片，除非它是不可编辑的品牌海报或用户明确要求生成整张视觉图。

字体处理顺序：

1. 先识别参考图中的字体气质：衬线/无衬线、几何/人文、圆角/方正、压缩/宽体、字重、数字样式、中文/英文混排、标题与正文层级。
2. 检查项目现有字体、设计系统、CSS 变量和主题配置，优先沿用已有字体。
3. 如果需要更接近参考图，选择系统字体或开源 Web 字体作为近似方案，并说明相似点和差异。
4. 如果参考图明显使用品牌专属字体、商业字体或特殊字体，先询问用户是否有授权字体文件或品牌规范。不要擅自下载或嵌入未授权字体。
5. 如果用户允许联网查找字体，优先寻找官方字体源、开源字体仓库或字体厂商页面，并检查授权范围。
6. 加载字体时优先使用 `woff2`，设置合理的 `font-display`，并提供 fallback 字体栈，避免字体加载失败后页面崩坏。

集成字体时：

- 使用真实文本和 CSS 字体，不把可编辑 UI 文案烘焙进图片。
- 为标题、正文、按钮、数字和代码/标签分别设定清晰的字体、字重、行高和字间距。
- 中文字体文件可能很大；如果需要自托管，优先子集化、按需加载或使用系统中文 fallback。
- 检查字体加载前后是否造成布局跳动、按钮溢出、行高变化或中文乱码。
- 记录字体来源、授权假设和 fallback。

## 常见风险与防护

在前期审查、生成、集成和最终验收时，主动识别这些风险：

- **输入信息不完整**：只有一张截图、缺少目标屏幕尺寸、缺少移动端参考、缺少 hover/弹窗/下拉等交互状态。先说明缺口，并用低风险假设或向用户确认。
- **还原目标不清楚**：用户可能想要“风格类似”，也可能想要“像素级复刻”。在生成前确认可接受的还原精度，尤其是品牌页、产品页和商业落地页。
- **品牌与版权风险**：精确 logo、商标、真实产品截图、用户照片、名人肖像、第三方素材不应默认用模型重画。优先要求用户提供原始素材或授权版本。
- **字体授权风险**：特殊字体、品牌字体和商业字体不能默认下载或嵌入。没有授权文件时，使用开源/系统近似字体并说明差异。
- **字体加载风险**：Web 字体可能导致闪烁、布局跳动、中文缺字、按钮溢出或首屏变慢。使用 fallback、`font-display`、子集化和实际渲染检查。
- **生图幻觉**：模型可能生成伪文字、奇怪 UI、错误 logo、异常手部/人物、错误材质或多余物体。提示词中要明确禁止文字、水印、logo 和无关 UI 元素，验收时逐项检查。
- **多图风格不一致**：多个资产分批生成时，容易出现光照、色彩、镜头、线条粗细、材质不统一。为同一页面维护统一风格 token，并在资产清单中复用。
- **尺寸与裁剪失败**：桌面端好看但移动端主体被裁掉，或背景图没有给标题留白。提前规划桌面/移动端槽位，必要时生成不同裁剪版本。
- **抠图边缘问题**：透明图可能有白边、硬边、残留背景、阴影不自然或 alpha 通道缺失。必须在浅色和深色背景上检查。
- **图片与代码融合不自然**：图片透视、阴影、清晰度、饱和度或边缘质感与代码 UI 不匹配。优先调整图片后处理、CSS 阴影、容器背景和裁剪，而不是只改布局。
- **性能问题**：首屏大图、透明 PNG、未压缩资产和过多图片会拖慢页面。优先 WebP/AVIF、`srcset`、懒加载、合理压缩和明确尺寸。
- **可访问性问题**：重要图片没有 alt，装饰图片读屏冗余，按钮文字被烘焙进图片导致不可选中、不可翻译、不可读屏。真实 UI 文本必须保留为代码。
- **外部服务和隐私风险**：抠图 API 或在线生图工具可能上传用户素材。没有用户许可、没有凭据或素材敏感时，不调用外部 API。
- **构建集成风险**：图片路径、打包方式、public 目录、缓存、大小写文件名、远程部署路径可能导致本地可见但线上 404。集成后检查构建和浏览器网络请求。

如果风险会影响版权、安全、隐私、页面尺寸、品牌准确性或最终验收标准，先问用户确认。普通视觉取舍可以记录假设后继续推进。

## 尺寸规划

根据 UI 参考图推断目标视口和图片槽位：

- 如果截图有明确像素尺寸，先测量图片槽位占截图宽高的比例，再映射到实现视口。
- 如果最终应用是响应式的，定义 CSS 宽高比，并按最大预期展示尺寸生成，通常使用 2x 像素密度。
- 如果复刻的是固定尺寸 App 截图、手机壳、仪表盘卡片或其他强依赖绝对坐标的 UI，不要把固定像素定位直接放进会缩小的响应式容器。优先使用一个固定设计画布（例如 430x870）承载内部元素，再按外层容器宽度整体缩放；或把所有字号、位置、间距统一换算成同一套响应式比例单位，避免窗口变窄后局部文字和插画互相覆盖。
- 优先生成等于或大于目标槽位的图片，再裁剪/缩小。避免把小图强行放大。
- 全宽首屏图在可行时至少按桌面端 2x 宽度生成；如果移动端构图会坏，单独生成移动端裁剪。
- 透明抠图要保留足够留白容纳阴影，避免过度贴边导致主体被裁掉。

## Moni UI 提示词

每个图片资产单独写提示词。提示词聚焦单个资产，不要描述整个页面。

如果用户要的是一整套风格统一的小图，例如 3 张目的地卡片、4 个路线小岛、1 张主视觉和若干装饰纹理，优先考虑：

- 先写统一的风格 token
- 再决定是逐张生成，还是一次生成可切片的资产板
- 如果担心多次生成风格漂移，优先资产板方案

当页面是“代码 UI + 多张统一风格位图”的混合模式时，提示词必须补充这些约束：

- 不要生成任何可读文字、按钮、价格、系统状态栏或 UI chrome
- 主体尽量居中或按槽位留白
- 给文案区预留安全留白
- 多资产之间保持同一色板、颗粒密度、光照方向和风格强度

每条提示词应该包含：

- 资产用途和 UI 槽位，例如首屏背景、产品抠图、卡片缩略图或空状态插画。
- 主体、构图、镜头/视角、风格、光照、色彩和背景。
- 宽高比和目标导出尺寸。
- 集成约束：预留文案空间、避免文字/logo/水印、支持时要求透明背景、需要抠图时要求主体独立。
- 会破坏 UI 的负向约束。

多资产页面要复用一致的风格 token：色彩、材质、光照、线条粗细、镜头角度和真实程度。

## 抠图与去背景

当资产需要透明背景时：

1. 优先使用 Moni UI / 生图模型自带的透明背景、局部编辑、遮罩或独立主体能力。
2. 如果 Moni UI 不能直接产出干净透明图，或生成结果边缘质量不够，再选择可用的去背景路径：
   - 项目环境中已安装或可安装的本地工具，例如 `rembg`/Pillow。
   - 用户提供凭据或环境已经配置好的 API。
   - 支持背景移除或遮罩编辑的图片编辑/生图工具。
3. 只有在用户允许、环境已有凭据、且资产不敏感时，才调用外部抠图 API。
4. 不要编造 API key，不要在没有许可的情况下把敏感用户资产上传到外部服务，也不要在未验证 alpha 通道前声称图片已经透明。
5. 检查边缘、阴影、头发/细节，并导出带 alpha 的 PNG 或 WebP。

## 集成规则

将生成资产放到项目已有的资源目录约定下。如果项目没有约定，使用清晰的生成资产目录，例如 `src/assets/generated/` 或 `public/generated/`。

按角色和尺寸命名文件，例如 `hero-product-2880x1440.webp` 或 `pricing-device-cutout-1200x900.png`。

最终 demo 中引用的图片资产必须是项目本地文件。可以在开发中临时参考远程图片，但交付前要下载、生成或重建为本地资产，并修正页面引用；不要让 demo 依赖外网图片加载成功。

集成时：

- 使用明确的宽度、高度、宽高比或容器约束，避免图片加载导致布局跳动。
- 如果创建了多个断点图片，使用 `picture`/`srcset`。
- 纯装饰图使用 `alt=""`；有信息意义的图片提供有用的 alt 文本。
- 按钮、文字和图标保持为真实可访问 UI 元素，可以叠放在图片上或放在图片旁边。
- 除非任务明确是复刻整张图片 mockup，否则避免生成包含 UI 文字的图片。

如果一个页面声称“使用了 image_gen 生图”，至少要让以下一种情况发生：

- 首屏主视觉来自真实生成图
- 关键插画/缩略图来自真实生成图
- 路线图/地图主体来自真实生成图

如果这些都没有发生，说明任务仍停留在结构复刻阶段，不应宣称已经完成 image_gen 复刻。

## 交互与跳转

生成页面不能只是静态截图。除非用户明确要求只交付静态视觉稿，否则要把可识别的交互区做成真实可点击元素，并自动设置合理跳转逻辑。

- **多屏参考图**：如果参考图展示多个 App 页面、弹窗状态、步骤页或详情页，默认把它们串成一个可点击原型。主按钮进入下一屏，返回/关闭回到上一屏，底部导航切换对应页面，卡片/列表项进入详情或选中状态。
- **单屏参考图**：按钮、链接、开关、标签页、卡片、菜单、输入框和导航仍应可点击或可操作。没有明确目标页面时，使用低风险的视觉反馈、状态切换、锚点滚动或模拟成功态，并在最终说明中记录假设。
- **语义元素**：优先使用真实 `<button>`、`<a>`、表单控件和 ARIA 状态，不要用不可交互的 `div` 假装按钮。`a` 必须有明确 `href` 或由脚本管理的目标，按钮必须设置 `type`。
- **跳转假设**：根据文案和 UI 常识自动推断跳转，例如 `Get Started` 到下一屏、`Close`/`Back` 到上一屏、`Next` 到下一步、卡片点击更新选中态。高风险动作（购买、提交真实信息、外部发送、删除、改权限）只做草稿或本地模拟，不实际提交。
- **验证路径**：最终至少点击一遍主要 CTA、返回/关闭、一个选择项和一个末级按钮；确认 URL/hash/路由、选中态、按钮反馈、滚动位置或页面内容确实变化，并检查没有死链、无响应按钮或控制台错误。

## 页面级审查

集成图片后，必须审查完整页面，而不只检查单张图片。优先使用浏览器截图、移动端/桌面端视口和实际渲染结果判断。

审查内容：

- **尺寸正确**：图片不被意外拉伸、压扁、裁掉主体；导出尺寸满足最大展示尺寸；首屏、卡片、头像、背景图都有稳定宽高比。
- **无乱码和伪文字**：页面真实文案不乱码；生成图片内部没有无法解释的文字、伪字母、logo、水印或与 UI 文案冲突的内容。
- **排版正常**：文本不溢出按钮/卡片；导航、按钮、图片、标题和正文之间没有异常重叠；移动端不出现横向滚动或关键内容被裁切。
- **融合自然**：图片的光照、透视、边缘、阴影、色彩和清晰度与代码生成的 UI 匹配；抠图没有明显白边、硬边、脏边或悬浮感不合理的问题。
- **层级正确**：图片不会遮挡可点击控件；前景图、背景图、文字和按钮的 `z-index` 与点击区域正常。
- **交互可用**：所有显而易见的按钮、链接、导航、卡片和输入控件都能点击或操作；多屏页面有可回退的跳转路径；未知目标有本地反馈而不是静默无效。
- **响应式可靠**：至少检查桌面端和移动端；必要时增加移动端专用裁剪图或调整 `object-position`。
- **窄容器真实可用**：如果用户可能在侧边栏、in-app browser、手机预览或小宽度窗口中打开页面，必须额外用接近实际容器宽度的截图验证。不要只用宽桌面视口判断；重点检查标题、正文、按钮、插画、状态栏和卡片是否发生重叠、截断、异常换行或局部放大。
- **局部细节到位**：不要只看整页缩略图。必须放大检查关键边角和小元素，包括状态栏、圆角、设备边框、底部导航、图标、手绘线条、卡片边缘、按钮内文字和生成插画局部；如果局部明显不像参考图、像乱码/伪字母、线条断裂或比例失真，先修正再交付。
- **生图确实落地**：截图里能明确看到生成资产已经出现在正确槽位；不要只验证本地生成文件存在。

如果审查发现问题，先判断是图片问题还是代码集成问题：图片主体、风格、边缘或文字错误时重新生成/抠图；尺寸、裁剪、层级或间距错误时修改 CSS/布局。

## 原图差距核对与迭代

页面级审查通过后，必须把当前实现截图与用户提供的原始参考图进行对照。不要只凭记忆判断效果。

对照方式：

1. 使用与原图尽量一致的视口尺寸截图；如果原图是桌面端和移动端，分别截图对比。
2. 如果原图和实现截图尺寸不同，先按同一宽度缩放后再比较整体比例、间距和视觉重心。
3. 按区域比较：导航、首屏、图片资产、字体、按钮、卡片、背景、色彩、阴影、间距、响应式裁剪。
4. 输出差距清单，给每个差距标注严重程度：`必须修`、`建议修`、`可接受差异`。
5. 对 `必须修` 和高影响 `建议修` 进行修改，再重新截图对比。
6. 重复“截图 -> 对比 -> 修正 -> 再截图”，直到没有明显影响还原度的问题，或剩余差异受素材、授权、模型质量、时间或用户选择限制。

如果用户曾指出“没有真正调用 image_gen / Image Gen / 旧生图叫法”，差距核对时必须单独增加一项：

- **生图替换率**：当前参考图中最关键的视觉区域，有多少已经从代码近似替换成真实生成位图。

如果用户要求像素级复刻，优先使用可测量对比：位置、尺寸、颜色、字体、间距和图片裁剪。若只是风格参考，不追求逐像素一致，但仍要说明主要差异和取舍。

差距核对时重点看：

- **布局比例**：页面宽度、首屏高度、左右留白、区块间距、网格列宽是否接近原图。
- **字体还原**：字重、字号、行高、字间距、标题气质、中文/英文/数字显示是否接近。
- **图片还原**：主体、构图、裁剪、风格、光照、清晰度、抠图边缘是否接近原图。
- **局部还原**：对参考图里的云朵、头像、贴纸、线稿、状态栏、导航图标、按钮圆角等小区域做局部对比；这些细节不能因为整页看起来接近就忽略。
- **色彩与质感**：背景色、按钮色、阴影、边框、透明度、模糊、材质是否偏离。
- **交互和层级**：按钮、导航、图标、前景图和背景图的层级是否与参考图一致。
- **响应式差异**：移动端是否仍保留原图的视觉重点和内容优先级。

## 最终交付

完成后报告：

- 哪些区域用代码渲染。
- 生成了哪些图片资产，以及文件路径。
- 哪些资产是通过内置 `image_gen` 真实生成得到的，并标明实际工具为 `built-in-image_gen`。
- 使用了什么抠图/去背景方法。
- 关于尺寸、响应式裁剪或生成风格的假设。
- 做过哪些页面级审查和验证，尤其是浏览器截图、移动端/桌面端检查、图片尺寸检查、乱码检查、图片融合检查和主要点击路径检查。
- 与原始参考图对比后的主要差距、已修正项、剩余可接受差异，以及迭代了几轮截图核对。
- 如果用户要求 1:1 或像素级复刻，必须写明交付状态：`strict gate passed`、`loose gate passed only` 或 `未达 1:1`。严格门槛未过时，列出失败区域和下一步修复项，不要说“1:1 完成”。
- 如果启动了本地预览服务，必须写清楚本地预览 URL、项目根目录、demo 目录和入口 HTML 文件路径，方便用户直接定位文件。
