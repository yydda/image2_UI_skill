# 资产清单与提示词参考

这份文档只提供 4 类内容：

- 前期审查模板
- React 资产清单模板
- `image_gen` 提示词模板
- 页面级检查清单

## 1. 前期审查模板

在真正开始生图或改代码之前，先输出一版简洁审查：

```markdown
## UI 还原前期审查

### 整体判断
- 页面类型：
- 视觉风格：
- 核心布局：
- 首屏重点：
- 主要风险：

### 元素拆分

| 区域 | 建议实现方式 | 难度 | 原因 | 是否需要确认 |
| --- | --- | --- | --- | --- |
| 顶部导航 | 代码 | 容易 | 结构清晰，文本可编辑 | 否 |
| 首屏主视觉 | image_gen | 困难 | 依赖摄影/插画质感 | 是 |
| logo | 原素材 | 不建议直接生成 | 需要品牌一致性 | 是 |

### 图片资产候选

| id | UI 位置 | 用途 | 槽位尺寸 | 建议导出尺寸 | 是否透明 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- |
| hero-main | 首屏 | 主视觉 | 100vw x 60vh | 2880x1600 | 否 | 必须生图 |

### 需要确认
- 是否要求像素级复刻，还是允许风格近似？
- 是否有 logo、人物、产品图等原始素材？
- 是否有指定字体或授权字体文件？
- 是否需要移动端和桌面端双适配？
```

难度建议：

- `容易`：代码或现有图标库即可完成
- `中等`：需要精细 CSS、裁剪或少量图片辅助
- `困难`：依赖 `image_gen`、抠图或复杂质感
- `不建议直接生成`：logo、商标、用户专属照片、精确产品截图

## 2. 资产清单模板

生成前先列资产清单，保持每个资产可追踪：

| id | UI 位置 | 类型 | source strategy | repair strategy | transparent required | crop box | slot size | target pixels | quality gate | 目标路径 | React import | 接入组件 | alt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hero-main | 首屏主视觉 | hero-image | image_gen-fallback | none | false | n/a | 100vw x 60vh | 2880x1600 | concept | src/assets/generated/hero-main.webp | heroMainImage | HeroSection | 装饰性主视觉 |
| brand-seal | 顶部品牌印章 | custom-icon | vector-rebuild | vectorize-svg | true | 32,18,48,48 | 48x48 | 128x128 | exact | src/assets/original/repaired/brand-seal.svg | brandSeal | Header | 品牌印章 |

常用类型：

- `hero-image`
- `thumbnail`
- `illustration`
- `texture`
- `cutout`
- `background-plate`
- `custom-icon`

常用后处理：

- `none`
- `crop`
- `resize`
- `remove-background`
- `transparent-png`
- `compress-webp`
- `mobile-crop`

高保真 source strategy：

- `original-crop`：从用户设计稿裁切原区域，不做语义重画
- `repair-crop`：裁切后做去背景、放大、锐化或背景匹配
- `vector-rebuild`：矢量化或手写 SVG 重建精确线稿/图标
- `image_gen-fallback`：只用于非精确缺失资产、背景扩展或概念插画
- `code`：由 React/CSS/SVG 代码实现

高保真 repair strategy：

- `none`
- `flat-bg-alpha`
- `rembg-alpha`
- `upscale`
- `vectorize-svg`
- `manual-svg`

`quality gate`：

- `exact`：不得使用 `image_gen-fallback`
- `close`：允许少量边缘/纹理差异，但主体、构图和色板必须接近
- `concept`：只要求满足用途和风格

React 接入字段：

- `目标路径`：默认 `src/assets/generated/<asset-id>.<ext>`；原始用户素材放 `src/assets/original/`。
- `React import`：使用 camelCase 名称，例如 `heroMainImage`、`productCutoutMobile`。
- `接入组件`：写清楚图片最终进入哪个组件或页面，例如 `HeroSection`、`ProductCard`、`OnboardingScreen`。
- `alt`：信息图写语义 alt；纯装饰图写 `alt=""` 或说明为装饰性。
- `响应式版本`：需要桌面/移动不同裁剪时，在备注或后处理里列出 `desktop`、`mobile`、`@2x` 文件。

## 2.1 资产命名规范

<!-- asset-naming-rules -->

生成资产必须使用可读、稳定、可追踪的 kebab-case 文件名：

```text
<slot>-<subject>-<variant>.<ext>
```

常用槽位：

- `hero`
- `product`
- `card`
- `avatar`
- `background`
- `texture`
- `cutout`
- `empty-state`
- `onboarding`

常用变体：

- `desktop`
- `mobile`
- `light`
- `dark`
- `transparent`
- `01`, `02`, `03` for ordered sets
- `2x` only when the project already uses density suffixes

示例：

```text
src/assets/generated/hero-dashboard-desktop.webp
src/assets/generated/hero-dashboard-mobile.webp
src/assets/generated/product-phone-cutout-transparent.png
src/assets/generated/card-feature-01.webp
src/assets/generated/onboarding-illustration-02.png
```

每个最终接入 React 的生成资产都要记录：

| 字段 | 示例 |
| --- | --- |
| asset id | `hero-dashboard` |
| source prompt | `B2B dashboard hero visual...` |
| saved path | `src/assets/generated/hero-dashboard-desktop.webp` |
| React import | `heroDashboardDesktop` |
| used component | `HeroSection` |
| role | `decorative` 或 `informative` |
| alt | `Dashboard analytics preview` 或 `""` |
| actual tool | `built-in-image_gen` |

## 3. image_gen 提示词模板

每个资产单独写提示词，不要把整个页面一起描述进一张图里。

```text
为一个 [产品/网站/App] UI 生成 [资产类型]。

用途和位置：
- 用于 [UI 槽位]
- 目标宽高比：[比例]
- 目标导出尺寸：[宽]x[高]

主体和构图：
- [主体]
- [视角/镜头]
- [前景与背景关系]
- [文案留白要求]

风格：
- [真实摄影 / 插画 / 3D / 半色调 / 颗粒感]
- 色彩：[主色]
- 光照：[光照方式]
- 质感：[材质或风格细节]

集成约束：
- 不要出现可读文字、logo、水印、按钮、系统状态栏或 UI chrome
- 保持边缘干净，方便裁剪
- [如果需要抠图：透明背景 / 独立主体 / 简单背景]

避免：
- [会破坏 UI 集成的内容]
```

如果是同一页面的一组小图，先统一这些风格 token：

- 色板
- 光照方向
- 颗粒密度
- 材质风格
- 镜头角度

## 4. 页面级检查清单

生成并接回页面后，至少检查这些内容：

- 页面真实文字没有乱码、截断或被遮挡
- 生成图片内部没有伪文字、logo、水印或额外 UI
- 图片没有被拉伸、压扁、模糊或错误裁切
- 主体位置和文案留白符合参考图意图
- 抠图边缘没有白边、硬边或脏边
- 图片没有遮挡按钮、链接或表单
- 移动端和桌面端都能正常显示
- 主要 CTA、返回、导航、卡片点击路径可用
- 截图里能明确看到真实生图资产已经渲染进页面

## 5. 差距核对表

最后一轮建议用这张表记录对照结果：

| 轮次 | 区域 | 当前差距 | 等级 | 修正动作 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 1 | 首屏主视觉 | 主体偏中，标题留白不足 | 必须修 | 调整裁剪或重生成 | 待复查 |
| 1 | 标题字体 | 字重偏轻 | 建议修 | 更换近似字体 | 待复查 |

等级建议：

- `必须修`：明显影响还原度或用户明确点名的问题
- `建议修`：影响质感，但不阻碍交付
- `可接受差异`：受素材、授权或模型质量限制，可记录保留
