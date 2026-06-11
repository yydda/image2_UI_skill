param(
  [switch]$RunBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Assert-True($condition, $message) {
  if (-not $condition) {
    throw $message
  }
}

function Assert-File($relativePath) {
  $path = Join-Path $root $relativePath
  Assert-True (Test-Path -LiteralPath $path) "Missing required file: $relativePath"
  return $path
}

Assert-File "package.json" | Out-Null
Assert-File "index.html" | Out-Null
Assert-File "vite.config.ts" | Out-Null
Assert-File "components.json" | Out-Null
Assert-File "tailwind.config.ts" | Out-Null
Assert-File "src\main.tsx" | Out-Null
Assert-File "src\App.tsx" | Out-Null
Assert-File "src\assets\generated\moni-dashboard-hero.svg" | Out-Null
Assert-File "src\components\ui\button.tsx" | Out-Null
Assert-File "src\components\ui\card.tsx" | Out-Null

$app = Get-Content -LiteralPath (Join-Path $root "src\App.tsx") -Raw -Encoding UTF8
Assert-True ($app.Contains("@/assets/generated/moni-dashboard-hero.svg")) "App should import generated asset"
Assert-True ($app.Contains("@/components/ui/button")) "App should use shadcn-style Button"
Assert-True ($app.Contains("@/components/ui/card")) "App should use shadcn-style Card"

if ($RunBuild) {
  Push-Location $root
  try {
    if (Test-Path -LiteralPath (Join-Path $root "package-lock.json")) {
      npm ci --prefer-offline --no-audit --fund=false
    } else {
      npm install --no-audit --fund=false
    }
    npm run build
  } finally {
    Pop-Location
  }
}

[pscustomobject]@{
  Check = "moni-react-app"
  Ok = $true
  Detail = "React demo structure, generated asset import, and shadcn-style components passed"
}
