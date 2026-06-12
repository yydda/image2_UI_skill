# Box Model Fidelity Workflow

Use this reference when the user wants maintainable, responsive, componentized code and still expects close to 1:1 visual fidelity.

The goal is not a static screenshot and not a pile of arbitrary absolute positions. The goal is a real CSS box model plan that a senior frontend engineer would build, then a designer-level pixel refinement loop.

## Principle

1. Start from a measured design canvas.
2. Decompose the page into semantic regions and components.
3. Describe each region with CSS box model properties.
4. Implement with normal layout primitives first: grid, flex, block flow, padding, margin, gap, border, radius, shadow, aspect-ratio, and stable intrinsic sizes.
5. Use `FidelityCanvas` and absolute positioning only for screenshot-exact overlays, decorative slots, or cases where normal layout cannot preserve pixel alignment.
6. Refine by changing tokens and box model values, not by random transforms.

## Required Planning Layers

### 1. Canvas

Record the reference size, DPR, background, and target viewport:

```json
{
  "canvas": {
    "width": 1448,
    "height": 1086,
    "deviceScaleFactor": 1,
    "background": "#fffdf8"
  }
}
```

### 2. Region Grid

Identify full page regions before coding:

- header
- breadcrumb/title band
- main content column
- right status column
- primary order card
- notice band
- payment method section
- payment action bar
- trust footer

For each region, record:

- `x`, `y`, `width`, `height`
- owner component
- layout type: `grid`, `flex`, `block`, `absolute-overlay`
- `padding`, `gap`, `margin`, `border`, `radius`, `shadow`
- whether the region is critical
- max allowed diff

### 3. Component Box Model

Every reusable component should have a box contract:

```json
{
  "id": "payment-method-card-wechat",
  "component": "PaymentOption",
  "selector": "[data-fidelity-id='payment-wechat']",
  "box": {
    "x": 35,
    "y": 756,
    "width": 400,
    "height": 78,
    "display": "grid",
    "gridTemplateColumns": "52px 1fr 24px",
    "alignItems": "center",
    "padding": "0 20px",
    "gap": 18,
    "border": "1px solid var(--payment-selected-border)",
    "radius": 6
  },
  "responsive": {
    "desktop": "fixed design-grid proportion",
    "mobile": "stacked cards with same internal grid"
  }
}
```

This allows the page to be both maintainable and visually measurable.

## Pixel Eye Loop

After implementation:

1. Screenshot at the same reference viewport.
2. Run page diff and region diff.
3. Inspect the worst regions.
4. Adjust in this order:
   - region x/y/width/height
   - container padding/margin/gap
   - border/radius/shadow/background tokens
   - font family/size/weight/line-height
   - asset slot size/object-fit/object-position
5. Rerun screenshot and diff.

Do not fix a 6px padding error by scaling the whole page. Do not fix a font metric mismatch by moving every sibling box one by one. Fix the underlying box model or typography token.

## Responsive Rule

For strict screenshot pages, the desktop reference can use a fixed design grid, but components must still be real components with stable CSS APIs.

Recommended approach:

- Use a max-width page shell matching the design canvas.
- Let major columns use CSS grid with measured tracks.
- Let cards and controls use normal box model internals.
- Add responsive breakpoints only after desktop strict diff is acceptable.
- On mobile, preserve component APIs and tokens, but allow layout reflow.

## Asset Slot Rule

Images are not layout. Every image needs a slot:

```json
{
  "id": "paper-character-lock",
  "slot": {
    "x": 760,
    "y": 590,
    "width": 185,
    "height": 105,
    "objectFit": "contain",
    "objectPosition": "center bottom"
  },
  "asset": {
    "transparentRequired": true,
    "targetPixels": { "width": 370, "height": 210 },
    "safePadding": 12,
    "alphaPolicy": "semi-transparent-preserve"
  }
}
```

The component owns the slot; the asset pipeline owns the pixels.

## Font Rule

Fonts must be real CSS fonts. For editable UI text, do not crop text into images.

Use this order:

1. Existing project font.
2. User-provided licensed font.
3. Official open-source web font package.
4. System fallback.

For online font lookup, prefer official sources such as Google Fonts, Adobe Source Han GitHub repositories, Noto CJK, or Fontsource packages. Download or install the font, self-host it in `src/assets/fonts/`, and declare it in `src/theme/font-faces.css`.

Record the font source, license assumption, weights used, fallback stack, and whether subsetting was performed.

Useful starting points:

- [Google Fonts Noto Serif SC](https://fonts.google.com/noto/specimen/Noto%2BSerif%2BSC)
- [Google Fonts Noto Sans SC](https://fonts.google.com/noto/specimen/Noto%2BSans%2BSC)
- [Noto CJK fonts on GitHub](https://github.com/notofonts/noto-cjk)
- [Adobe Source Han Serif on GitHub](https://github.com/adobe-fonts/source-han-serif)
- [Adobe Source Han Sans on GitHub](https://github.com/adobe-fonts/source-han-sans)
- [Fontsource Noto Serif SC](https://fontsource.org/fonts/noto-serif-sc)
- [Fontsource Noto Sans SC](https://fontsource.org/fonts/noto-sans-sc)
