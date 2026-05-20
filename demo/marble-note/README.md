# Marble Note Demo

Responsive landing-style preview for a creative notebook mobile app.

## Run

```powershell
cd demo/marble-note
python -m http.server 4190 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4190/
```

## Interactions

- Cover -> Home via `Get started`.
- Home -> Meeting note via the Design Tips card or document tab.
- Meeting note -> Home via the back button.
- Other controls show local feedback states.

## Screenshots

- `screenshots/marble-note-desktop.png`
- `screenshots/marble-note-mobile.png`

## Validate

```powershell
powershell -ExecutionPolicy Bypass -File demo/marble-note/validate.ps1
```

## Asset Notes

This demo uses local code/SVG/CSS artwork placeholders. It does not claim real image2 generation because no confirmed image2 entrypoint is available in this environment.

See `image2-asset-plan.md` for the pending real image2 asset breakdown and prompts.
