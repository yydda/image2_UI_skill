# ArtMuse iOS Demo

Three-screen iOS-style museum app prototype based on the provided reference image.

## Run

```bat
cd demo/artmuse-ios
node ..\..\scripts\serve-static.mjs . 4183 127.0.0.1
```

Open:

```text
http://127.0.0.1:4183/
```

## Interactions

- Home -> Exhibitions via the Visit arrow or Exhibitions card.
- Exhibitions -> Detail via any brown arrow button.
- Detail -> Home via the bottom home button.
- Other buttons show local feedback states.

## Screenshots

- `screenshots/artmuse-desktop.png`
- `screenshots/artmuse-mobile.png`

## Validate

```bat
demo\artmuse-ios\validate.cmd
```

## Asset Notes

All artwork thumbnails are local SVG assets under `assets/` so the demo can run without remote image loading.

This demo does not claim real image_gen generation. The artwork visuals are local code/SVG placeholders and should be replaced with true image_gen assets when the built-in image_gen workflow is used.
