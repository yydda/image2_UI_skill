# Image2 to UI Skill  图片转UI界面

网页参考：

- [Dribbble](https://dribbble.com/)
- [Behance](https://www.behance.net/)
- [Pinterest](https://www.pinterest.com/)

基于 Codex 适配的图片转 UI 界面 skill。

把 UI 截图、设计稿、页面参考图转换成：

- 可用代码实现的结构化 UI
- 需要真实生成的 `image2` 位图资产

这个 skill 的重点不是“把截图大概做出来”，而是先判断哪些区域必须真实生图，哪些区域必须保留为代码，再把生成资产真正接回页面。

[教程演示视频](https://v.douyin.com/MJLektzxKpM/)

## 适合什么场景

- 把 UI 截图、设计稿、App 参考图复刻成可点击网页 demo
- 把手机 App 参考图做成带 iOS 外边框的可交互预览
- 判断一个页面里哪些应该用代码实现，哪些必须调用 image2 生图
- 为首屏主视觉、卡片缩略图、复杂插画、纹理、产品图、抠图资产编写提示词并接回页面
- 避免 Codex 用 CSS/SVG 近似复杂图片后误报“已经生图”

## 快速开始

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

## 仓库案例素材

下面这些参考图和原视频已经直接放进仓库里，打开 GitHub 页面就能点开看。

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

Windows PowerShell：

```powershell
git clone https://github.com/zhu-guli326/image2_UI_skill.git "$env:USERPROFILE\.codex\skills\image2_UI_skill"
```

macOS / Linux：

```bash
git clone https://github.com/zhu-guli326/image2_UI_skill.git "${CODEX_HOME:-$HOME/.codex}/skills/image2_UI_skill"
```

安装后重开 Codex，或新开一个会话。

确认目录结构：

```text
image2_UI_skill/
├── SKILL.md
├── agents/openai.yaml
├── references/
└── demo/
```

## 最小自测 Prompt

新开 Codex 会话后，可以直接发：

```text
使用 image-to-ui-skill。
参考我上传的图，完成一个可点击预览的 demo。

要求：
1. 先判断哪些部分应该用代码实现，哪些部分必须真实调用 image2 生图
2. 不要把标题、正文、按钮文字、价格做进图片里
3. 需要真实生成的位图资产，请实际生成并接回页面
4. 如果没有真实生成位图并接入页面，不要告诉我已经用了 image2
5. 最后告诉我生成了哪些图片、图片放在哪、哪些区域仍然是代码实现

技术栈：
- HTML/CSS/JS

直接开始，不用先问我。
```

如果当前项目没有暴露 image2 入口，skill 应该明确说明“无法确认 image2 可用”，并只完成 UI 拆解、资产清单、提示词和代码骨架，不应冒用其他图片模型。

## 工作流程

这个 skill 的标准流程是：

1. 先检查参考图，判断页面里哪些部分是代码 UI，哪些部分是图片资产
2. 输出前期审查和资产清单
3. 为必须生图的区域编写提示词
4. 调用 `image2` 生成真实位图
5. 做裁切、缩放、透明背景、尺寸修正等后处理
6. 把图片接回前端页面
7. 补齐可点击行为和页面跳转
8. 用截图核对最终结果和参考图差距

## 本地验证

仓库根目录提供一个基础验证脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\validate.ps1
```

它会检查：

- `SKILL.md` frontmatter 和关键规则是否存在
- 关键 reference 文件是否存在
- README 里引用的本地图片和视频是否存在
- `agents/openai.yaml` 是否包含展示信息
- demo 文件结构是否完整

如果本机安装了 Chrome 和 Python，也可以运行 demo 级验证：

```powershell
powershell -ExecutionPolicy Bypass -File .\validate.ps1 -RunDemos
```

## image2 入口规则

这个 skill 里的 `image2` 指项目指定的 image2 调用入口，不等于任意图片生成工具。

真实生图前，Codex 会按 `references/image2-entrypoint.md` 先确认入口。只有以下情况才算确认：

- 用户明确给出 image2 命令、脚本或工具
- 项目文档、AGENTS.md 或已有代码明确写出 image2 调用方式
- 当前环境存在稳定的 image2 封装，并能确认输入、输出和文件落地路径

以下方式不能冒充 image2：

- imagegen skill
- gpt-image 系列 API/CLI
- OpenRouter、ICU 或其他中转图片 API
- 自写 OpenAI SDK 生图脚本
- 只用 CSS/SVG/渐变/噪点近似视觉

## 常见问题

### 为什么 Codex 说“无法确认 image2 可用”？

因为当前项目没有提供可验证的 image2 调用入口。此时它应该继续完成 UI 拆解、资产清单和提示词准备，但不能声称已经真实生图。

### 能不能让它先用别的生图工具代替？

可以，但需要你明确授权。否则这个 skill 会拒绝把 imagegen、OpenRouter、gpt-image 或自写 SDK 结果说成 image2。

### 为什么不把整张 UI 直接生成成一张图？

因为 UI 文本、按钮、导航、价格、表单、状态栏等需要可编辑、可访问、可交互。图片模型更适合生成首屏视觉、缩略图、复杂插画、纹理、产品图和抠图资产。

### 做 App 时为什么一定要有 iOS 外边框和截图？

这是为了避免只交付一张静态页面。App demo 应该能点击、能在手机框内预览，并且通过截图证明页面、状态栏、图片资产和主要交互真的渲染出来了。

## GitHub 外显建议

建议在 GitHub 仓库右侧 About 里设置：

```text
Codex skill for turning UI screenshots into clickable demos with real image2 assets.
```

推荐 topics：

```text
codex-skill, image2, image-to-ui, ui-to-code, frontend, prototype, ai-assets
```

当第一个真实 image2 闭环案例补齐后，建议发布 `v0.1.0` release，并在 release note 里列出：安装方式、核心能力、demo 路径、image2 验真规则。

