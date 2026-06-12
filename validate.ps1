param(
  [switch]$RunDemos
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

function Get-RelativeMarkdownTargets([string]$content) {
  $targets = New-Object System.Collections.Generic.List[string]

  [regex]::Matches($content, '!\[[^\]]*\]\(([^)]+)\)') | ForEach-Object {
    $targets.Add($_.Groups[1].Value)
  }

  [regex]::Matches($content, '<(?:img|a)\s+[^>]*(?:src|href)="([^"]+)"') | ForEach-Object {
    $targets.Add($_.Groups[1].Value)
  }

  return $targets |
    Where-Object {
      $_ -and
      -not ($_.StartsWith("http://")) -and
      -not ($_.StartsWith("https://")) -and
      -not ($_.StartsWith("#")) -and
      -not ($_.StartsWith("mailto:"))
    } |
    ForEach-Object {
      ($_ -split "#")[0]
    } |
    Where-Object { $_ }
}

$skillPath = Assert-File "SKILL.md"
$readmePath = Assert-File "README.md"
$quickStartPath = Assert-File "QUICK_START.md"
$openaiYamlPath = Assert-File "agents\openai.yaml"
Assert-File "package.json" | Out-Null
Assert-File "package-lock.json" | Out-Null
Assert-File "foundation.config.json" | Out-Null
Assert-File "references\asset-manifest-and-prompts.md" | Out-Null
Assert-File "references\imagegen-entrypoint.md" | Out-Null
Assert-File "references\high-fidelity-execution-contract.md" | Out-Null
Assert-File "references\fidelity-asset-repair.md" | Out-Null
Assert-File "references\high-fidelity-workflow-observations.md" | Out-Null
Assert-File "references\real-project-workflow.md" | Out-Null
Assert-File "references\react-shadcn-workflow.md" | Out-Null
Assert-File "references\codex-capability-routing.md" | Out-Null
Assert-File "references\frontend-architecture-contract.md" | Out-Null
Assert-File "references\foundation-governance.md" | Out-Null
Assert-File "references\box-model-fidelity-workflow.md" | Out-Null
Assert-File "references\high-fidelity-iteration-tools.md" | Out-Null
Assert-File "references\hicolor-case-study.md" | Out-Null
Assert-File "assets\cases\hicolor\traffic-3-days.png" | Out-Null
Assert-File "assets\cases\hicolor\xiaohongshu-pinned.jpg" | Out-Null
Assert-File "assets\cases\hicolor\threads-recommendation.png" | Out-Null
Assert-File "scripts\install-local.ps1" | Out-Null
Assert-File "scripts\sync-local.ps1" | Out-Null
Assert-File "scripts\setup-fidelity-tools.ps1" | Out-Null
Assert-File "validate.cmd" | Out-Null
Assert-File "scripts\install-local.cmd" | Out-Null
Assert-File "scripts\sync-local.cmd" | Out-Null
Assert-File "scripts\setup-fidelity-tools.cmd" | Out-Null
Assert-File "scripts\serve-static.mjs" | Out-Null
Assert-File "scripts\inspect-reference-image.mjs" | Out-Null
Assert-File "scripts\reference-preflight-lib.mjs" | Out-Null
Assert-File "scripts\validate-fidelity-plan.mjs" | Out-Null
Assert-File "scripts\fidelity-lib.mjs" | Out-Null
Assert-File "scripts\foundation-lib.mjs" | Out-Null
Assert-File "scripts\sync-foundation.mjs" | Out-Null
Assert-File "scripts\init-foundation-repo.mjs" | Out-Null
Assert-File "scripts\generate-reuse-review.mjs" | Out-Null
Assert-File "scripts\promote-to-foundation.mjs" | Out-Null
Assert-File "scripts\extract-reference-assets.mjs" | Out-Null
Assert-File "scripts\repair-asset.mjs" | Out-Null
Assert-File "scripts\score-asset.mjs" | Out-Null
Assert-File "scripts\capture-fidelity.mjs" | Out-Null
Assert-File "scripts\compare-fidelity.mjs" | Out-Null
Assert-File "scripts\compare-region-fidelity.mjs" | Out-Null
Assert-File "scripts\audit-rendered-elements.mjs" | Out-Null
Assert-File "scripts\check-frontend-architecture.mjs" | Out-Null
Assert-File "scripts\build-repair-queue.mjs" | Out-Null
Assert-File "scripts\scaffold-react-project.mjs" | Out-Null
Assert-File "scripts\build-asset-contact-sheet.mjs" | Out-Null
Assert-File "scripts\diagnose-fidelity-diff.mjs" | Out-Null
Assert-File "scripts\calibrate-theme.mjs" | Out-Null
Assert-File "scripts\run-fidelity-loop.mjs" | Out-Null
Assert-File "scripts\ensure-project-deps.mjs" | Out-Null
Assert-File "assets\examples\fidelity-manifest.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-page-blueprint.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-layout-manifest.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-element-manifest.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-icon-inventory.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-interaction-map.sample.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\package.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\package-lock.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\validate.cmd" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\dev.cmd" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\components.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\tsconfig.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\tsconfig.app.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\App.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\vite-env.d.ts" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\scripts\check-frontend-architecture.mjs" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\scripts\ensure-project-deps.mjs" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\scripts\start-dev-server.cmd" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\scripts\start-dev-server.mjs" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\app\AppShell.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\app\routes.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\pages\HomePage.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\ui\button.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\primitives\ActionGroup.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\primitives\PaymentOption.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\primitives\StatusTimeline.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\primitives\AgreementBar.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\primitives\NoticeBanner.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\primitives\InfoSummaryCard.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\layout\PageFrame.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\layout\PhoneFrame.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\fidelity\FidelityCanvas.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\theme\tokens.css" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\theme\font-faces.css" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\theme\themes\default.css" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\theme\themes\warm-finance.css" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\theme\themes\mobile-ios.css" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\theme\typography.css" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\assets\repaired\.gitkeep" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\assets\fonts\.gitkeep" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\lib\asset-registry.ts" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\types\fidelity.ts" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\types\page.ts" | Out-Null
Assert-File "demo\moni-react-app\package.json" | Out-Null
Assert-File "demo\moni-react-app\package-lock.json" | Out-Null
Assert-File "demo\moni-react-app\validate.ps1" | Out-Null
Assert-File "demo\moni-react-app\validate.cmd" | Out-Null
Assert-File "demo\moni-react-app\src\App.tsx" | Out-Null
Assert-File "demo\moni-react-app\src\assets\generated\moni-dashboard-hero.svg" | Out-Null
Assert-File "demo\marble-note\imagegen-asset-plan.md" | Out-Null

$skill = Get-Content -LiteralPath $skillPath -Raw -Encoding UTF8
$readme = Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8
$quickStart = Get-Content -LiteralPath $quickStartPath -Raw -Encoding UTF8
$openaiYaml = Get-Content -LiteralPath $openaiYamlPath -Raw -Encoding UTF8
$assetReference = Get-Content -LiteralPath (Join-Path $root "references\asset-manifest-and-prompts.md") -Raw -Encoding UTF8
$fidelityReference = Get-Content -LiteralPath (Join-Path $root "references\fidelity-asset-repair.md") -Raw -Encoding UTF8
$fidelityContract = Get-Content -LiteralPath (Join-Path $root "references\high-fidelity-execution-contract.md") -Raw -Encoding UTF8
$routingReference = Get-Content -LiteralPath (Join-Path $root "references\codex-capability-routing.md") -Raw -Encoding UTF8
$architectureReference = Get-Content -LiteralPath (Join-Path $root "references\frontend-architecture-contract.md") -Raw -Encoding UTF8
$boxModelReference = Get-Content -LiteralPath (Join-Path $root "references\box-model-fidelity-workflow.md") -Raw -Encoding UTF8
$iterationReference = Get-Content -LiteralPath (Join-Path $root "references\high-fidelity-iteration-tools.md") -Raw -Encoding UTF8
$contactSheetScript = Get-Content -LiteralPath (Join-Path $root "scripts\build-asset-contact-sheet.mjs") -Raw -Encoding UTF8
$scoreAssetScript = Get-Content -LiteralPath (Join-Path $root "scripts\score-asset.mjs") -Raw -Encoding UTF8
$planScript = Get-Content -LiteralPath (Join-Path $root "scripts\validate-fidelity-plan.mjs") -Raw -Encoding UTF8
$themeScript = Get-Content -LiteralPath (Join-Path $root "scripts\calibrate-theme.mjs") -Raw -Encoding UTF8
$diagnoseScript = Get-Content -LiteralPath (Join-Path $root "scripts\diagnose-fidelity-diff.mjs") -Raw -Encoding UTF8
$repairQueueScript = Get-Content -LiteralPath (Join-Path $root "scripts\build-repair-queue.mjs") -Raw -Encoding UTF8
$loopScript = Get-Content -LiteralPath (Join-Path $root "scripts\run-fidelity-loop.mjs") -Raw -Encoding UTF8
$scaffoldScript = Get-Content -LiteralPath (Join-Path $root "scripts\scaffold-react-project.mjs") -Raw -Encoding UTF8
$marbleReadme = Get-Content -LiteralPath (Join-Path $root "demo\marble-note\README.md") -Raw -Encoding UTF8
$artmuseReadme = Get-Content -LiteralPath (Join-Path $root "demo\artmuse-ios\README.md") -Raw -Encoding UTF8
$rootPackagePath = Join-Path $root "package.json"
$rootPackageLockPath = Join-Path $root "package-lock.json"
$templatePackagePath = Join-Path $root "assets\templates\vite-react-shadcn\package.json"
$templatePackageLockPath = Join-Path $root "assets\templates\vite-react-shadcn\package-lock.json"
$templateTsconfigPath = Join-Path $root "assets\templates\vite-react-shadcn\tsconfig.json"
$templateTsconfigAppPath = Join-Path $root "assets\templates\vite-react-shadcn\tsconfig.app.json"
$templateStartDevPath = Join-Path $root "assets\templates\vite-react-shadcn\scripts\start-dev-server.mjs"
$demoPackagePath = Join-Path $root "demo\moni-react-app\package.json"
$rootPackage = Get-Content -LiteralPath $rootPackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$rootPackageLock = Get-Content -LiteralPath $rootPackageLockPath -Raw -Encoding UTF8
$templatePackage = Get-Content -LiteralPath $templatePackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$demoPackage = Get-Content -LiteralPath $demoPackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$templatePackageLock = Get-Content -LiteralPath $templatePackageLockPath -Raw -Encoding UTF8
$templateTsconfig = Get-Content -LiteralPath $templateTsconfigPath -Raw -Encoding UTF8
$templateTsconfigApp = Get-Content -LiteralPath $templateTsconfigAppPath -Raw -Encoding UTF8
$templateStartDevScript = Get-Content -LiteralPath $templateStartDevPath -Raw -Encoding UTF8

function Assert-NoLatestDependency($package, $label) {
  foreach ($sectionName in @("dependencies", "devDependencies")) {
    $section = $package.$sectionName
    if ($null -ne $section) {
      foreach ($property in $section.PSObject.Properties) {
        Assert-True ($property.Value -ne "latest") "$label should pin $sectionName dependency $($property.Name)"
      }
    }
  }
}

function Assert-NoBarePs1Command([string]$content, [string]$label) {
  $bareCommands = [regex]::Matches($content, '(?m)^\s*\.\\[^\r\n]*\.ps1(?:\s+[^\r\n]*)?$')
  Assert-True ($bareCommands.Count -eq 0) "$label should invoke PowerShell scripts with: powershell -NoProfile -ExecutionPolicy Bypass -File <script.ps1>"
}

$docsForPs1InvocationCheck = @(
  $readmePath,
  $quickStartPath,
  (Join-Path $root "references\fidelity-asset-repair.md"),
  (Join-Path $root "references\high-fidelity-execution-contract.md"),
  (Join-Path $root "references\frontend-architecture-contract.md"),
  (Join-Path $root "references\high-fidelity-iteration-tools.md"),
  (Join-Path $root "demo\moni-react-app\README.md"),
  (Join-Path $root "demo\artmuse-ios\README.md"),
  (Join-Path $root "demo\marble-note\README.md")
)

foreach ($docPath in $docsForPs1InvocationCheck) {
  $docContent = Get-Content -LiteralPath $docPath -Raw -Encoding UTF8
  Assert-NoBarePs1Command $docContent $docPath
}

Assert-True ($skill.Contains("name: moni-ui-skill")) "SKILL.md frontmatter must contain the expected name"
Assert-True ($skill.Contains("description:")) "SKILL.md frontmatter must contain description"
Assert-True ($skill.Contains("references/imagegen-entrypoint.md")) "SKILL.md should reference imagegen-entrypoint.md"
Assert-True ($skill.Contains("references/asset-manifest-and-prompts.md")) "SKILL.md should reference asset-manifest-and-prompts.md"
Assert-True ($skill.Contains("imagegen")) "SKILL.md should explicitly mention imagegen"
Assert-True ($skill.Contains("image_gen")) "SKILL.md should require the built-in image_gen tool"
Assert-True ($skill.Contains("built-in-image_gen")) "SKILL.md should require reporting built-in image_gen usage"
Assert-True ($skill.Contains("Vite + React + TypeScript + shadcn")) "SKILL.md should define the default React stack"
Assert-True ($skill.Contains("Framework priority")) "SKILL.md should define framework selection priority"
Assert-True ($skill.Contains("React Asset Integration")) "SKILL.md should define React asset integration rules"
Assert-True ($skill.Contains("src/assets/generated/")) "SKILL.md should define the generated asset directory"
Assert-True ($skill.Contains("Real Development Workflow")) "SKILL.md should cover real development workflows"
Assert-True ($skill.Contains("assets/templates/vite-react-shadcn/")) "SKILL.md should mention the bundled React template"
Assert-True ($skill.Contains("references/real-project-workflow.md")) "SKILL.md should reference the real project workflow"
Assert-True ($skill.Contains("references/react-shadcn-workflow.md")) "SKILL.md should reference the React shadcn workflow"
Assert-True ($skill.Contains("references/codex-capability-routing.md")) "SKILL.md should reference the Codex capability routing contract"
Assert-True ($skill.Contains("references/frontend-architecture-contract.md")) "SKILL.md should reference the frontend architecture contract"
Assert-True ($skill.Contains("references/box-model-fidelity-workflow.md")) "SKILL.md should reference the box model fidelity workflow"
Assert-True ($skill.Contains("font-faces.css")) "SKILL.md should require CSS font-face entry"
Assert-True ($skill.Contains("src/assets/fonts")) "SKILL.md should define the font asset directory"
Assert-True ($skill.Contains("CSS box model")) "SKILL.md should require CSS box-model planning"
Assert-True ($skill.Contains("Codex") -and $skill.Contains("imagegen") -and $skill.Contains("product-design:image-to-code")) "SKILL.md should define Codex capability reuse priority"
Assert-True ($skill.Contains("src/components/primitives/") -and $skill.Contains("src/components/fidelity/")) "SKILL.md should define immutable architecture constraints"
Assert-True ($skill.Contains("references/fidelity-asset-repair.md")) "SKILL.md should reference the fidelity asset repair workflow"
Assert-True ($skill.Contains("references/high-fidelity-execution-contract.md")) "SKILL.md should reference the high-fidelity execution contract"
Assert-True ($skill.Contains("references/high-fidelity-iteration-tools.md")) "SKILL.md should reference the high-fidelity iteration tools"
Assert-True ($skill.Contains("validate-fidelity-plan.mjs")) "SKILL.md should require high-fidelity plan validation"
Assert-True ($skill.Contains("compare-region-fidelity.mjs")) "SKILL.md should require region-level diff"
Assert-True ($skill.Contains("audit-rendered-elements.mjs")) "SKILL.md should require rendered element audit"
Assert-True ($skill.Contains("inspect-reference-image.mjs")) "SKILL.md should require reference preflight"
Assert-True ($skill.Contains("allow-contaminated-source")) "SKILL.md should document contaminated source override"
Assert-True ($skill.Contains("clean-reference.png")) "SKILL.md should document clean reference fallback"
Assert-True ($skill.Contains("element-manifest.json")) "SKILL.md should require element manifest"
Assert-True ($skill.Contains("icon-inventory.json")) "SKILL.md should require icon inventory"
Assert-True ($skill.Contains("maxDiffRatio")) "SKILL.md should mention strict region maxDiffRatio"
Assert-True ($skill.Contains("0.06")) "SKILL.md should cap critical region diff at 0.06"
Assert-True ($skill.Contains("lucide-react")) "SKILL.md should restrict lucide replacement for non-generic icons"
Assert-True ($skill.Contains("loose gate passed only")) "SKILL.md should define strict fidelity delivery status"
Assert-True ($skill.Contains("Dynamic Island")) "SKILL.md should keep iOS app preview requirements"
Assert-True ($skill.Contains("cmd /c npm.cmd ci --prefer-offline --no-audit --fund=false")) "SKILL.md should prefer deterministic npm.cmd ci for fresh demos"
Assert-True ($skill.Contains("package-lock.json")) "SKILL.md should require preserving the template lockfile"
Assert-True ($skill.Contains("start-dev-server.mjs") -and $skill.Contains("npm.cmd")) "SKILL.md should document the safe Vite dev server helper"
Assert-True ($skill.Contains("Windows Node Toolchain Guard")) "SKILL.md should include the Windows Node toolchain guard"
Assert-True ($skill.Contains("Start-Process npm") -and $skill.Contains('bare `npm run dev`')) "SKILL.md should forbid unsafe Windows Node command forms"
Assert-True ($skill.Contains("Strict Fidelity Execution")) "SKILL.md should define the high-fidelity execution gate"
Assert-True ($skill.Contains("image_gen-fallback")) "SKILL.md should define image_gen as fallback for high-fidelity assets"
Assert-True ($skill.Contains("qualityGate: exact")) "SKILL.md should block image_gen fallback for exact assets"
Assert-True ($skill.Contains("scripts/scaffold-react-project.mjs")) "SKILL.md should require scaffold script for new projects"
Assert-True ($skill.Contains("architecture:check")) "SKILL.md should require architecture checking"
Assert-True ($skill.Contains("deps:ensure")) "SKILL.md should require dependency install caching"
Assert-True ($skill.Contains("build-asset-contact-sheet.mjs")) "SKILL.md should require asset contact sheet"
Assert-True ($skill.Contains("diagnose-fidelity-diff.mjs")) "SKILL.md should require diff diagnosis"
Assert-True ($skill.Contains("calibrate-theme.mjs")) "SKILL.md should require theme calibration"
Assert-True ($skill.Contains("run-fidelity-loop.mjs")) "SKILL.md should require fidelity repair loop"
Assert-True ($skill.Contains("--fail-on-review")) "SKILL.md should make asset contact sheet review a hard gate"
Assert-True ($skill.Contains("--fail-on-reject")) "SKILL.md should make asset scoring a hard gate"
Assert-True ($skill.Contains("--enforce-asset-acceptance")) "SKILL.md should enforce accepted assets before React integration"
Assert-True ($skill.Contains("--assets assets.manifest.json")) "SKILL.md should pass assets to theme calibration"
Assert-True ($skill.Contains("--diagnosis-report tmp/fidelity/diff-diagnosis.json")) "SKILL.md should pass diagnosis into repair queue"
Assert-True ($skill.Contains("--max-iterations 6")) "SKILL.md should allow six focused fidelity iterations"
Assert-True ($skill.Contains("source-1x-accepted")) "SKILL.md should document explicit 1x crop downgrade policy"
Assert-True ($skill.Contains("PaymentOption") -and $skill.Contains("StatusTimeline") -and $skill.Contains("AgreementBar")) "SKILL.md should mention shared fidelity primitives"
Assert-True ($skill.Contains("product-design:image-to-code")) "SKILL.md should mention Product Design reuse"
Assert-True ($skill.Contains("Codex Browser")) "SKILL.md should mention Browser reuse"
Assert-True (-not ($skill.Contains("src/components/app/"))) "SKILL.md should not keep the legacy src/components/app path"

Assert-NoLatestDependency $rootPackage "Root fidelity tools"
Assert-NoLatestDependency $templatePackage "React template"
Assert-NoLatestDependency $demoPackage "React demo"
Assert-True ($rootPackage.dependencies.sharp -eq "0.35.0") "Root tools should pin sharp"
Assert-True ($rootPackage.dependencies.pixelmatch -eq "7.2.0") "Root tools should pin pixelmatch"
Assert-True ($rootPackage.dependencies.potrace -eq "2.1.8") "Root tools should pin potrace"
Assert-True ($rootPackage.scripts."fidelity:plan".Contains("validate-fidelity-plan.mjs")) "Root package should expose fidelity:plan"
Assert-True ($rootPackage.scripts."fidelity:capture".Contains("capture-fidelity.mjs")) "Root package should expose fidelity:capture"
Assert-True ($rootPackage.scripts."fidelity:region-diff".Contains("compare-region-fidelity.mjs")) "Root package should expose fidelity:region-diff"
Assert-True ($rootPackage.scripts."fidelity:elements".Contains("audit-rendered-elements.mjs")) "Root package should expose fidelity:elements"
Assert-True ($rootPackage.scripts."fidelity:inspect".Contains("inspect-reference-image.mjs")) "Root package should expose fidelity:inspect"
Assert-True ($rootPackage.scripts."architecture:check".Contains("check-frontend-architecture.mjs")) "Root package should expose architecture:check"
Assert-True ($rootPackage.scripts."deps:ensure".Contains("ensure-project-deps.mjs")) "Root package should expose deps:ensure"
Assert-True ($rootPackage.scripts."fidelity:contact-sheet".Contains("build-asset-contact-sheet.mjs")) "Root package should expose fidelity:contact-sheet"
Assert-True ($rootPackage.scripts."fidelity:diagnose".Contains("diagnose-fidelity-diff.mjs")) "Root package should expose fidelity:diagnose"
Assert-True ($rootPackage.scripts."fidelity:calibrate-theme".Contains("calibrate-theme.mjs")) "Root package should expose fidelity:calibrate-theme"
Assert-True ($rootPackage.scripts."fidelity:loop".Contains("run-fidelity-loop.mjs")) "Root package should expose fidelity:loop"
Assert-True ($rootPackage.scripts."fidelity:repair-queue".Contains("build-repair-queue.mjs")) "Root package should expose fidelity:repair-queue"
Assert-True ($rootPackage.scripts."foundation:init".Contains("init-foundation-repo.mjs")) "Root package should expose foundation:init"
Assert-True ($rootPackage.scripts."foundation:sync".Contains("sync-foundation.mjs")) "Root package should expose foundation:sync"
Assert-True ($rootPackage.scripts."foundation:review".Contains("generate-reuse-review.mjs")) "Root package should expose foundation:review"
Assert-True ($rootPackage.scripts."foundation:promote".Contains("promote-to-foundation.mjs")) "Root package should expose foundation:promote"
Assert-True ($rootPackage.scripts."scaffold:react".Contains("scaffold-react-project.mjs")) "Root package should expose scaffold:react"
Assert-True ($rootPackageLock.Contains('"sharp": "0.35.0"')) "Root lockfile should lock sharp"
Assert-True ($rootPackageLock.Contains('"pixelmatch": "7.2.0"')) "Root lockfile should lock pixelmatch"
Assert-True ($rootPackageLock.Contains('"potrace": "2.1.8"')) "Root lockfile should lock potrace"
Assert-True ($templatePackage.scripts.dev.Contains("--host 0.0.0.0")) "React template dev script should bind to 0.0.0.0"
Assert-True ($templatePackage.scripts.preview.Contains("--host 0.0.0.0")) "React template preview script should bind to 0.0.0.0"
Assert-True ($templatePackage.scripts."architecture:check".Contains("check-frontend-architecture.mjs")) "React template should expose architecture:check"
Assert-True ($templatePackage.scripts."deps:ensure".Contains("ensure-project-deps.mjs")) "React template should expose deps:ensure"
Assert-True ($templatePackage.scripts."dev:safe".Contains("start-dev-server.mjs")) "React template should expose safe dev server helper"
Assert-True ($templatePackage.scripts.validate.Contains("architecture:check") -and $templatePackage.scripts.validate.Contains("typecheck") -and $templatePackage.scripts.validate.Contains("build")) "React template should expose validate script"
Assert-True ($templateStartDevScript.Contains('"npm.cmd"')) "Safe dev server helper should call npm.cmd on Windows"
Assert-True ($templateStartDevScript.Contains("shell: false")) "Safe dev server helper should disable shell execution"
Assert-True ($templateStartDevScript.Contains("windowsHide: true")) "Safe dev server helper should hide Windows helper windows"
Assert-True ($templateStartDevScript.Contains("preferredUrl")) "Safe dev server helper should reuse an existing preferred dev server before choosing another port"
Assert-True ($templatePackage.devDependencies.tailwindcss -eq "3.4.17") "React template should pin Tailwind 3.4.17"
Assert-True ($templatePackage.devDependencies.vite -eq "5.4.11") "React template should pin Vite 5.4.11"
Assert-True ($templatePackage.dependencies.react -eq "18.3.1") "React template should pin React 18.3.1"
Assert-True ($templatePackageLock.Contains('"tailwindcss": "3.4.17"')) "React template lockfile should lock Tailwind 3.4.17"
Assert-True ($templateTsconfigApp.Contains('"moduleResolution": "Bundler"')) "React template should use Bundler module resolution"
Assert-True (-not ($templateTsconfigApp.Contains('"baseUrl"'))) "React template app tsconfig should avoid deprecated baseUrl fallback"
Assert-True (-not ($templateTsconfig.Contains('"baseUrl"'))) "React template root tsconfig should avoid deprecated baseUrl fallback"

Assert-True ($contactSheetScript.Contains('args["fail-on-review"]')) "Contact sheet should support fail-on-review"
Assert-True ($contactSheetScript.Contains("targetPixels must be at least 2x slotSize")) "Contact sheet should enforce exact asset 2x target pixels"
Assert-True ($contactSheetScript.Contains("requires alpha")) "Contact sheet should enforce alpha requirements"
Assert-True ($contactSheetScript.Contains("backgroundMatched assets must record backgroundColor")) "Contact sheet should enforce background matched color"
Assert-True ($scoreAssetScript.Contains('args["fail-on-reject"]')) "Asset scoring should support fail-on-reject"
Assert-True ($scoreAssetScript.Contains("source-1x-accepted")) "Asset scoring should require explicit accepted 1x policy"
Assert-True ($scoreAssetScript.Contains("alphaPolicy")) "Asset scoring should enforce alpha policy"
Assert-True ($planScript.Contains("enforce-asset-acceptance")) "Plan validation should support enforcing accepted assets"
Assert-True ($planScript.Contains("source-1x-accepted")) "Plan validation should require explicit accepted 1x policy"
Assert-True ($themeScript.Contains("args.assets")) "Theme calibration should accept an assets manifest"
Assert-True ($themeScript.Contains("readExcludedAssetBoxes")) "Theme calibration should exclude asset crop boxes"
Assert-True ($themeScript.Contains("preferredAccent")) "Theme calibration should prefer warm accent colors when present"
Assert-True ($diagnoseScript.Contains("isTypographyTarget")) "Diff diagnosis should classify critical text overflow as typography"
Assert-True ($repairQueueScript.Contains("diagnosis-report")) "Repair queue should accept diagnosis report input"
Assert-True ($repairQueueScript.Contains("isTypographyTarget")) "Repair queue should classify critical text overflow as typography"
Assert-True ($loopScript.Contains('const maxIterations = Number(args["max-iterations"] ?? 6)')) "Fidelity loop should default to six iterations"
Assert-True ($loopScript.Contains("--diagnosis-report tmp/fidelity/diff-diagnosis.json")) "Fidelity loop should suggest passing diagnosis into repair queue"

$blockedRouterName = "Open" + "Router"
$blockedApiKeyName = "OPENAI" + "_API_KEY"
$blockedCommandName = "IMAGE" + "2_COMMAND"
$blockedWrapperRef = "scripts/" + "image" + "2_asset.py"
$blockedWrapperPath = Join-Path $root ("scripts\" + "image" + "2_asset.py")
$blockedEntrypointPath = Join-Path $root ("references\image" + "2-entrypoint.md")
$blockedDemoPlanPath = Join-Path $root ("demo\marble-note\image" + "2-asset-plan.md")

Assert-True (-not ($skill.Contains($blockedRouterName))) "SKILL.md should not reference external router fallback"
Assert-True (-not ($skill.Contains($blockedApiKeyName))) "SKILL.md should not require external API credentials"
Assert-True (-not ($skill.Contains($blockedCommandName))) "SKILL.md should not require local image command configuration"
Assert-True (-not ($skill.Contains($blockedWrapperRef))) "SKILL.md should not reference the old wrapper"
Assert-True (-not (Test-Path -LiteralPath $blockedWrapperPath)) "Old wrapper should be removed"
Assert-True (-not (Test-Path -LiteralPath $blockedEntrypointPath)) "Old image entrypoint reference should be removed"
Assert-True (-not (Test-Path -LiteralPath $blockedDemoPlanPath)) "Old demo image asset plan should be renamed"

Assert-True ($openaiYaml.Contains("display_name:")) "agents/openai.yaml missing display_name"
Assert-True ($openaiYaml.Contains("short_description:")) "agents/openai.yaml missing short_description"
Assert-True ($openaiYaml.Contains("default_prompt:")) "agents/openai.yaml missing default_prompt"
Assert-True ($openaiYaml.Contains('$moni-ui-skill')) "agents/openai.yaml should reference the Moni UI skill trigger"
Assert-True ($readme.Contains("moni-ui-skill")) "README should mention the Moni UI skill trigger"
Assert-True ($readme.Contains("QUICK_START.md")) "README should link to QUICK_START.md"
Assert-True ($quickStart.Contains("moni-ui-skill")) "QUICK_START should mention the Moni UI skill trigger"
Assert-True ($quickStart.Contains('Use $moni-ui-skill')) "QUICK_START should include explicit skill invocation"
Assert-True ($quickStart.Contains("D:\Codex\.codex\skills\moni-ui-skill")) "QUICK_START should document the install target"
Assert-True ($quickStart.Contains("Vite + React + TypeScript + shadcn")) "QUICK_START should mention the default stack"
Assert-True ($quickStart.Contains("src/assets/generated")) "QUICK_START should mention generated asset path"
Assert-True ($readme.Contains("local-source-install")) "README should document local source installation"
Assert-True ($readme.Contains("D:\Codex\.codex\skills\moni-ui-skill")) "README should document the local install target"
Assert-True ($readme.Contains('Use $moni-ui-skill')) "README should include explicit skill invocation"
Assert-True ($readme.Contains("prompt-templates")) "README should include prompt templates"
Assert-True ($readme.Contains("prompt-basic-ui")) "README should include basic UI prompt template"
Assert-True ($readme.Contains("prompt-real-project")) "README should include real project prompt template"
Assert-True ($readme.Contains("prompt-component-refactor")) "README should include component refactor prompt template"
Assert-True ($readme.Contains("prompt-mobile-app")) "README should include mobile app prompt template"
Assert-True ($readme.Contains("scripts\install-local.cmd")) "README should mention Windows cmd install wrapper"
Assert-True ($readme.Contains("scripts\sync-local.cmd")) "README should mention Windows cmd sync wrapper"
Assert-True ($readme.Contains("demo\moni-react-app\validate.cmd")) "README should mention React demo cmd validator"
Assert-True ($readme.Contains("npm.cmd") -and $readme.Contains("start-dev-server.mjs")) "README should mention safe Windows Node command usage"
Assert-True ($quickStart.Contains("scripts\install-local.cmd")) "QUICK_START should mention Windows cmd install wrapper"
Assert-True ($quickStart.Contains("scripts\sync-local.cmd")) "QUICK_START should mention Windows cmd sync wrapper"
Assert-True ($quickStart.Contains("npm.cmd") -and $quickStart.Contains("dev.cmd")) "QUICK_START should mention safe Windows Node command usage"
Assert-True ($marbleReadme.Contains("serve-static.mjs") -and -not $marbleReadme.Contains("python -m http.server")) "Marble demo README should use the Node static server"
Assert-True ($artmuseReadme.Contains("serve-static.mjs") -and -not $artmuseReadme.Contains("python -m http.server")) "ArtMuse demo README should use the Node static server"
Assert-True ($skill.Contains("Windows Script Execution Guard")) "SKILL should include Windows script execution guard"
Assert-True ($skill.Contains("default user-facing entrypoints") -and $skill.Contains(".cmd")) "SKILL should make cmd wrappers the default Windows entrypoint"
Assert-True ($skill.Contains("Foundation Memory Loop")) "SKILL should include foundation memory loop"
Assert-True ($skill.Contains("generate-reuse-review.mjs")) "SKILL should require reuse review"
Assert-True ($skill.Contains("promote-to-foundation.mjs")) "SKILL should mention reviewed foundation promotion"
Assert-True ($readme.Contains("assets/templates/vite-react-shadcn/")) "README should mention bundled React template"
Assert-True ($readme.Contains("references/codex-capability-routing.md")) "README should mention Codex routing reference"
Assert-True ($readme.Contains("references/frontend-architecture-contract.md")) "README should mention architecture contract"
Assert-True ($readme.Contains("references/foundation-governance.md")) "README should mention foundation governance"
Assert-True ($readme.Contains("references/box-model-fidelity-workflow.md")) "README should mention box model fidelity workflow"
Assert-True ($readme.Contains("grid/flex/block")) "README should mention CSS box model planning"
Assert-True ($readme.Contains("src/assets/fonts")) "README should mention font asset directory"
Assert-True ($readme.Contains("PNG/WebP") -and $readme.Contains("alpha")) "README should mention high-resolution transparent assets"
Assert-True ($readme.Contains("moni-ui-foundation")) "README should mention shared foundation repository"
Assert-True ($readme.Contains("scripts/sync-foundation.mjs")) "README should mention foundation sync"
Assert-True ($readme.Contains("scripts/generate-reuse-review.mjs")) "README should mention reuse review script"
Assert-True ($readme.Contains("scripts/scaffold-react-project.mjs")) "README should mention React scaffold script"
Assert-True ($readme.Contains("architecture:check")) "README should mention architecture check"
Assert-True ($readme.Contains("asset contact sheet")) "README should mention asset contact sheet"
Assert-True ($readme.Contains("diff diagnosis")) "README should mention diff diagnosis"
Assert-True ($readme.Contains("theme calibration")) "README should mention theme calibration"
Assert-True ($readme.Contains("fidelity loop")) "README should mention fidelity loop"
Assert-True ($readme.Contains("demo/moni-react-app/")) "README should mention React demo"
Assert-True ($readme.Contains("prompt-templates")) "README should include prompt templates"
Assert-True ($readme.Contains("loose gate passed only")) "README should include strict fidelity prompt template"
Assert-True ($readme.Contains("element-manifest.json")) "README should mention element manifest in strict prompt"
Assert-True ($readme.Contains("icon-inventory.json")) "README should mention icon inventory in strict prompt"
Assert-True ($readme.Contains("audit-rendered-elements.mjs")) "README should mention rendered element audit"
Assert-True ($readme.Contains("inspect-reference-image.mjs")) "README should mention reference preflight"
Assert-True ($readme.Contains("clean-reference.png")) "README should mention clean reference handling"
Assert-True ($quickStart.Contains("element-manifest.json")) "QUICK_START should mention element manifest"
Assert-True ($quickStart.Contains("icon-inventory.json")) "QUICK_START should mention icon inventory"
Assert-True ($quickStart.Contains("0.06")) "QUICK_START should mention critical region cap"
Assert-True ($quickStart.Contains("clean-reference.png")) "QUICK_START should mention clean reference handling"
Assert-True ($quickStart.Contains("architecture:check")) "QUICK_START should mention architecture checking"
Assert-True ($quickStart.Contains("scripts/scaffold-react-project.mjs")) "QUICK_START should mention scaffold script"
Assert-True ($quickStart.Contains("moni-ui-foundation")) "QUICK_START should mention shared foundation"
Assert-True ($quickStart.Contains("reuse-review")) "QUICK_START should mention reuse review"
Assert-True ($quickStart.Contains("grid/flex/block")) "QUICK_START should mention CSS box model planning"
Assert-True ($quickStart.Contains("src/assets/fonts")) "QUICK_START should mention font asset directory"
Assert-True ($quickStart.Contains("PNG/WebP") -and $quickStart.Contains("alpha")) "QUICK_START should mention translucent asset alpha preservation"
Assert-True ($quickStart.Contains("asset contact sheet")) "QUICK_START should mention asset contact sheet"
Assert-True ($quickStart.Contains("theme calibration")) "QUICK_START should mention theme calibration"
Assert-True ($quickStart.Contains("fidelity loop")) "QUICK_START should mention fidelity loop"
Assert-True ($openaiYaml.Contains("Vite + React + TypeScript + shadcn")) "agents/openai.yaml should mention the default React stack"
Assert-True ($openaiYaml.Contains("Product Design")) "agents/openai.yaml should mention Product Design reuse"
Assert-True ($openaiYaml.Contains("Codex Browser")) "agents/openai.yaml should mention Browser reuse"
Assert-True ($openaiYaml.Contains("asset contact sheet")) "agents/openai.yaml should mention asset contact sheet"
Assert-True ($openaiYaml.Contains("theme calibration")) "agents/openai.yaml should mention theme calibration"
Assert-True ($openaiYaml.Contains("fidelity loop")) "agents/openai.yaml should mention fidelity loop"
Assert-True ($openaiYaml.Contains("moni-ui-foundation")) "agents/openai.yaml should mention shared foundation"
Assert-True ($openaiYaml.Contains("generate-reuse-review")) "agents/openai.yaml should mention reuse review"
Assert-True ($openaiYaml.Contains("grid/flex/block")) "agents/openai.yaml should mention box model planning"
Assert-True ($openaiYaml.Contains("src/theme/font-faces.css")) "agents/openai.yaml should mention font-face CSS"
Assert-True ($openaiYaml.Contains("alpha")) "agents/openai.yaml should mention translucent assets"
Assert-True ($openaiYaml.Contains("npm.cmd") -and $openaiYaml.Contains("start-dev-server.mjs")) "agents/openai.yaml should mention safe Windows Node command usage"
Assert-True ($readme.Contains("Vite + React + TypeScript + shadcn")) "README should mention the default React stack"
Assert-True ($assetReference.Contains("React import")) "asset manifest reference should include React import guidance"
Assert-True ($assetReference.Contains("src/assets/generated/")) "asset manifest reference should include generated asset path guidance"
Assert-True ($assetReference.Contains("asset-naming-rules")) "asset manifest reference should include asset naming rules"
Assert-True ($assetReference.Contains("actual tool")) "asset manifest reference should include generated asset reporting fields"
Assert-True ($assetReference.Contains("source strategy")) "asset manifest reference should include high-fidelity source strategy"
Assert-True ($assetReference.Contains("repair strategy")) "asset manifest reference should include high-fidelity repair strategy"
Assert-True ($assetReference.Contains("quality gate")) "asset manifest reference should include quality gate"
Assert-True ($fidelityReference.Contains("image_gen-fallback")) "fidelity reference should define image_gen fallback"
Assert-True ($fidelityReference.Contains("scripts/inspect-reference-image.mjs")) "fidelity reference should document reference preflight"
Assert-True ($fidelityReference.Contains("--allow-contaminated-source")) "fidelity reference should document contaminated source override"
Assert-True ($fidelityReference.Contains("scripts/validate-fidelity-plan.mjs")) "fidelity reference should document plan validation"
Assert-True ($fidelityReference.Contains("scripts/extract-reference-assets.mjs")) "fidelity reference should document extraction script"
Assert-True ($fidelityReference.Contains("scripts/score-asset.mjs")) "fidelity reference should document scoring script"
Assert-True ($fidelityReference.Contains("scripts/capture-fidelity.mjs")) "fidelity reference should document capture script"
Assert-True ($fidelityReference.Contains("scripts/compare-region-fidelity.mjs")) "fidelity reference should document region diff script"
Assert-True ($fidelityReference.Contains("scripts/audit-rendered-elements.mjs")) "fidelity reference should document rendered element audit script"
Assert-True ($fidelityContract.Contains("page-blueprint.json")) "fidelity contract should define page blueprint"
Assert-True ($fidelityContract.Contains("layout-manifest.json")) "fidelity contract should define layout manifest"
Assert-True ($fidelityContract.Contains("element-manifest.json")) "fidelity contract should define element manifest"
Assert-True ($fidelityContract.Contains("icon-inventory.json")) "fidelity contract should define icon inventory"
Assert-True ($fidelityContract.Contains("interaction-map.json")) "fidelity contract should define interaction map"
Assert-True ($fidelityContract.Contains("Reference Preflight")) "fidelity contract should define reference preflight"
Assert-True ($fidelityContract.Contains("inspect-reference-image.mjs")) "fidelity contract should document reference preflight script"
Assert-True ($fidelityContract.Contains("audit-rendered-elements.mjs")) "fidelity contract should define rendered element audit"
Assert-True ($fidelityContract.Contains("maxDiffRatio <= 0.06")) "fidelity contract should cap critical region thresholds"
Assert-True ($fidelityContract.Contains("strict gate passed")) "fidelity contract should define delivery status"
Assert-True ($routingReference.Contains("imagegen")) "routing reference should define imagegen routing"
Assert-True ($routingReference.Contains("Product Design")) "routing reference should define Product Design reuse"
Assert-True ($routingReference.Contains("Codex Browser")) "routing reference should define Browser reuse"
Assert-True ($routingReference.Contains("check-frontend-architecture.mjs")) "routing reference should mention architecture checker"
Assert-True ($routingReference.Contains("diff-diagnosis.json")) "routing reference should mention diff diagnosis"
Assert-True ($routingReference.Contains("start-dev-server.mjs")) "routing reference should mention safe dev server startup"
Assert-True ($scaffoldScript.Contains("scripts/check-frontend-architecture.mjs") -and $scaffoldScript.Contains("scripts/start-dev-server.mjs")) "Scaffold should overlay safe architecture and dev-server helpers"
Assert-True ($architectureReference.Contains("src/components/primitives")) "architecture contract should define primitives directory"
Assert-True ($architectureReference.Contains("src/components/fidelity")) "architecture contract should define fidelity directory"
Assert-True ($architectureReference.Contains("tokens.css")) "architecture contract should define tokens"
Assert-True ($architectureReference.Contains("font-faces.css")) "architecture contract should mention font-face CSS"
Assert-True ($architectureReference.Contains("src/assets/fonts")) "architecture contract should mention font asset directory"
Assert-True ($architectureReference.Contains("Box Model Fidelity")) "architecture contract should define box model fidelity"
Assert-True ($architectureReference.Contains("FidelityCanvas")) "architecture contract should define FidelityCanvas"
Assert-True ($architectureReference.Contains("architecture:check")) "architecture contract should define architecture check"
Assert-True ($architectureReference.Contains("deps:ensure")) "architecture contract should define dependency cache check"
Assert-True ($boxModelReference.Contains("CSS box model")) "box model workflow should explain CSS box model planning"
Assert-True ($boxModelReference.Contains("src/assets/fonts")) "box model workflow should mention self-hosted fonts"
Assert-True ($fidelityContract.Contains("boxModel")) "fidelity contract should include boxModel fields"
Assert-True ($fidelityContract.Contains("Required Font Handling")) "fidelity contract should require font handling"
Assert-True ($fidelityReference.Contains("semi-transparent-preserve")) "fidelity asset repair should mention translucent alpha policy"
Assert-True ($iterationReference.Contains("build-asset-contact-sheet.mjs")) "iteration tools should document asset contact sheet"
Assert-True ($iterationReference.Contains("diagnose-fidelity-diff.mjs")) "iteration tools should document diff diagnosis"
Assert-True ($iterationReference.Contains("calibrate-theme.mjs")) "iteration tools should document theme calibration"
Assert-True ($iterationReference.Contains("run-fidelity-loop.mjs")) "iteration tools should document fidelity loop"
Assert-True ($iterationReference.Contains("PaymentOption")) "iteration tools should document shared primitives"
Assert-True ($iterationReference.Contains("deps:ensure")) "iteration tools should document speed rules"

$architectureReportPath = Join-Path ([IO.Path]::GetTempPath()) "moni-ui-template-architecture-report.json"
& node (Join-Path $root "scripts\check-frontend-architecture.mjs") --project (Join-Path $root "assets\templates\vite-react-shadcn") --report $architectureReportPath --fail-on-error | Out-Null

$targets = Get-RelativeMarkdownTargets $readme
foreach ($target in $targets) {
  $normalized = $target.Replace("/", [IO.Path]::DirectorySeparatorChar)
  $candidate = Join-Path $root $normalized
  Assert-True (Test-Path -LiteralPath $candidate) "README references missing local target: $target"
}

$demoRoots = @(
  "demo\artmuse-ios",
  "demo\marble-note"
)

$reactDemoRoot = "demo\moni-react-app"

foreach ($demo in $demoRoots) {
  Assert-File (Join-Path $demo "index.html") | Out-Null
  Assert-File (Join-Path $demo "styles.css") | Out-Null
  Assert-File (Join-Path $demo "script.js") | Out-Null
  Assert-File (Join-Path $demo "README.md") | Out-Null
  Assert-File (Join-Path $demo "validate.ps1") | Out-Null
  Assert-File (Join-Path $demo "validate.cmd") | Out-Null
}

$results = [System.Collections.Generic.List[object]]::new()
$results.Add([pscustomobject]@{
  Check = "skill-structure"
  Ok = $true
  Url = $null
  Screenshot = $null
  Initial = $null
  BrokenImages = $null
  Detail = "SKILL.md, references, README links, agents metadata, and demo file structure passed"
})

if ($RunDemos) {
  foreach ($demo in $demoRoots) {
    $script = Join-Path $root (Join-Path $demo "validate.ps1")
    $output = & $script
    $demoResult = @($output | Where-Object { $_ -is [pscustomobject] })[-1]
    Assert-True $demoResult "Demo validator did not return a result object: $demo"
    $results.Add([pscustomobject]@{
      Check = $demo
      Ok = [bool]$demoResult.Ok
      Url = $demoResult.Url
      Screenshot = $demoResult.Screenshot
      Initial = $demoResult.Initial
      BrokenImages = $demoResult.BrokenImages
      Detail = $demoResult
    })
  }

  $reactScript = Join-Path $root (Join-Path $reactDemoRoot "validate.ps1")
  $reactOutput = & $reactScript
  $reactResult = @($reactOutput | Where-Object { $_ -is [pscustomobject] })[-1]
  Assert-True $reactResult "React demo validator did not return a result object: $reactDemoRoot"
  $results.Add([pscustomobject]@{
    Check = $reactDemoRoot
    Ok = [bool]$reactResult.Ok
    Url = $null
    Screenshot = $null
    Initial = $null
    BrokenImages = $null
    Detail = $reactResult
  })
}

$results
