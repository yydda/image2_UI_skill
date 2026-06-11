# Moni UI Skill 快速开始

可以。你现在这个本地 skill 的正式名是：

`moni-ui-skill`

当前项目目录是：

`C:\Users\85013\Documents\MyCode\image2_UI_skill`

安装后建议放到 Codex skills 目录：

`D:\Codex\.codex\skills\moni-ui-skill`

## 安装方式

PowerShell 执行：

```powershell
New-Item -ItemType Directory -Force "D:\Codex\.codex\skills" | Out-Null

Copy-Item `
  -Path "C:\Users\85013\Documents\MyCode\image2_UI_skill" `
  -Destination "D:\Codex\.codex\skills\moni-ui-skill" `
  -Recurse `
  -Force
```

安装后，重启 Codex，或新开一个会话，让 skill 重新加载。

如果以后你改了本地源码，再同步一次即可：

```powershell
Copy-Item `
  -Path "C:\Users\85013\Documents\MyCode\image2_UI_skill\*" `
  -Destination "D:\Codex\.codex\skills\moni-ui-skill" `
  -Recurse `
  -Force
```

## 如何调用

最直接：

```text
使用 moni-ui-skill，参考我上传的 UI 图，生成一个可点击 React demo。
```

或显式用 skill 触发名：

```text
Use $moni-ui-skill，把这张截图复刻成 Vite + React + TypeScript + shadcn 页面。
```

它默认会：

- 用 `Vite + React + TypeScript + shadcn`
- 需要图片时走内置 `image_gen`
- 生成资产放进 `src/assets/generated/`
- 用 React import 接回组件
- 启动本地预览并截图验真

## 提示词模板

### 基础 UI 复刻

```text
使用 moni-ui-skill，参考我上传的截图，生成一个可点击预览的 React demo。
技术栈默认用 Vite + React + TypeScript + shadcn。
请判断哪些区域用代码实现，哪些区域需要调用内置 image_gen 生成图片资产。
生成资产放到 src/assets/generated，并通过 React import 接回组件。
完成后启动本地预览，检查主要点击路径，并提供截图验真。
```

### 真实项目页面生产

```text
使用 moni-ui-skill，在当前项目中实现这个页面。
请先读取现有 package.json、路由、组件目录、样式系统和 shadcn 配置。
沿用现有项目结构，不要新建孤立 demo。
需要生成的视觉资产用内置 image_gen，放到 src/assets/generated。
最后运行项目已有的 typecheck/build/lint，并说明改动文件和验证结果。
```

### 组件重构

```text
使用 moni-ui-skill，重构这个组件，使它更接近我上传的参考图。
保持现有 props、事件、数据结构和路由语义不变。
优先使用现有 shadcn/ui、Tailwind token 和 lucide-react 图标。
如果缺少复杂插图或产品图，再调用内置 image_gen 生成资产并接入。
完成后运行验证命令，并说明兼容性风险。
```

### 移动 App 原型

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
```

### 1:1 高保真版

```text
Use $moni-ui-skill，参考设计稿做 1:1 高保真 React 页面。
切图前先检查参考图是否含红色批注箭头、水印、浏览器滚动条、下载/缩放浮层、聊天/助手悬浮窗、贴纸等非设计稿元素。
如果参考图被污染，不要直接切图；先要求干净原图，或裁出/遮罩成 tmp/fidelity/clean-reference.png 后再作为 source。
在写 React 前必须先产出并校验 page-blueprint.json、layout-manifest.json、assets.manifest.json、element-manifest.json、icon-inventory.json、interaction-map.json。
统一规划所有要裁切、修复、矢量化的资产，再批量处理。
所有非通用图标必须 original-crop / repair-crop / vector-rebuild / manual-svg，不要默认用 lucide-react 替代。
完成后跑整页 diff、区域级 diff 和元素级 DOM 审计。
critical region 的 maxDiffRatio 不要超过 0.06；输出 worst 10 局部区域并优先修最差区域。
检查关键文字、按钮、价格、状态项的 bounding box、font-size、font-weight、line-height、文本溢出和重叠。
如果严格门槛没过，最终标记 loose gate passed only 或 未达 1:1，并列出失败区域。
```
