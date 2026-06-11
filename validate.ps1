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
Assert-File "references\asset-manifest-and-prompts.md" | Out-Null
Assert-File "references\imagegen-entrypoint.md" | Out-Null
Assert-File "references\high-fidelity-execution-contract.md" | Out-Null
Assert-File "references\fidelity-asset-repair.md" | Out-Null
Assert-File "references\high-fidelity-workflow-observations.md" | Out-Null
Assert-File "references\real-project-workflow.md" | Out-Null
Assert-File "references\react-shadcn-workflow.md" | Out-Null
Assert-File "references\hicolor-case-study.md" | Out-Null
Assert-File "assets\cases\hicolor\traffic-3-days.png" | Out-Null
Assert-File "assets\cases\hicolor\xiaohongshu-pinned.jpg" | Out-Null
Assert-File "assets\cases\hicolor\threads-recommendation.png" | Out-Null
Assert-File "scripts\install-local.ps1" | Out-Null
Assert-File "scripts\sync-local.ps1" | Out-Null
Assert-File "scripts\setup-fidelity-tools.ps1" | Out-Null
Assert-File "scripts\inspect-reference-image.mjs" | Out-Null
Assert-File "scripts\reference-preflight-lib.mjs" | Out-Null
Assert-File "scripts\validate-fidelity-plan.mjs" | Out-Null
Assert-File "scripts\fidelity-lib.mjs" | Out-Null
Assert-File "scripts\extract-reference-assets.mjs" | Out-Null
Assert-File "scripts\repair-asset.mjs" | Out-Null
Assert-File "scripts\score-asset.mjs" | Out-Null
Assert-File "scripts\capture-fidelity.mjs" | Out-Null
Assert-File "scripts\compare-fidelity.mjs" | Out-Null
Assert-File "scripts\compare-region-fidelity.mjs" | Out-Null
Assert-File "scripts\audit-rendered-elements.mjs" | Out-Null
Assert-File "assets\examples\fidelity-manifest.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-page-blueprint.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-layout-manifest.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-element-manifest.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-icon-inventory.sample.json" | Out-Null
Assert-File "assets\examples\fidelity-interaction-map.sample.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\package.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\package-lock.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\components.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\tsconfig.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\tsconfig.app.json" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\App.tsx" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\vite-env.d.ts" | Out-Null
Assert-File "assets\templates\vite-react-shadcn\src\components\ui\button.tsx" | Out-Null
Assert-File "demo\moni-react-app\package.json" | Out-Null
Assert-File "demo\moni-react-app\package-lock.json" | Out-Null
Assert-File "demo\moni-react-app\validate.ps1" | Out-Null
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
$rootPackagePath = Join-Path $root "package.json"
$rootPackageLockPath = Join-Path $root "package-lock.json"
$templatePackagePath = Join-Path $root "assets\templates\vite-react-shadcn\package.json"
$templatePackageLockPath = Join-Path $root "assets\templates\vite-react-shadcn\package-lock.json"
$templateTsconfigPath = Join-Path $root "assets\templates\vite-react-shadcn\tsconfig.json"
$templateTsconfigAppPath = Join-Path $root "assets\templates\vite-react-shadcn\tsconfig.app.json"
$demoPackagePath = Join-Path $root "demo\moni-react-app\package.json"
$rootPackage = Get-Content -LiteralPath $rootPackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$rootPackageLock = Get-Content -LiteralPath $rootPackageLockPath -Raw -Encoding UTF8
$templatePackage = Get-Content -LiteralPath $templatePackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$demoPackage = Get-Content -LiteralPath $demoPackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$templatePackageLock = Get-Content -LiteralPath $templatePackageLockPath -Raw -Encoding UTF8
$templateTsconfig = Get-Content -LiteralPath $templateTsconfigPath -Raw -Encoding UTF8
$templateTsconfigApp = Get-Content -LiteralPath $templateTsconfigAppPath -Raw -Encoding UTF8

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
Assert-True ($skill.Contains("references/fidelity-asset-repair.md")) "SKILL.md should reference the fidelity asset repair workflow"
Assert-True ($skill.Contains("references/high-fidelity-execution-contract.md")) "SKILL.md should reference the high-fidelity execution contract"
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
Assert-True ($skill.Contains("npm ci --prefer-offline --no-audit --fund=false")) "SKILL.md should prefer deterministic npm ci for fresh demos"
Assert-True ($skill.Contains("package-lock.json")) "SKILL.md should require preserving the template lockfile"
Assert-True ($skill.Contains("vite --host 0.0.0.0")) "SKILL.md should document the local dev host used by the template"
Assert-True ($skill.Contains("Strict Fidelity Execution")) "SKILL.md should define the high-fidelity execution gate"
Assert-True ($skill.Contains("image_gen-fallback")) "SKILL.md should define image_gen as fallback for high-fidelity assets"
Assert-True ($skill.Contains("qualityGate: exact")) "SKILL.md should block image_gen fallback for exact assets"

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
Assert-True ($rootPackageLock.Contains('"sharp": "0.35.0"')) "Root lockfile should lock sharp"
Assert-True ($rootPackageLock.Contains('"pixelmatch": "7.2.0"')) "Root lockfile should lock pixelmatch"
Assert-True ($rootPackageLock.Contains('"potrace": "2.1.8"')) "Root lockfile should lock potrace"
Assert-True ($templatePackage.scripts.dev.Contains("--host 0.0.0.0")) "React template dev script should bind to 0.0.0.0"
Assert-True ($templatePackage.scripts.preview.Contains("--host 0.0.0.0")) "React template preview script should bind to 0.0.0.0"
Assert-True ($templatePackage.devDependencies.tailwindcss -eq "3.4.17") "React template should pin Tailwind 3.4.17"
Assert-True ($templatePackage.devDependencies.vite -eq "5.4.11") "React template should pin Vite 5.4.11"
Assert-True ($templatePackage.dependencies.react -eq "18.3.1") "React template should pin React 18.3.1"
Assert-True ($templatePackageLock.Contains('"tailwindcss": "3.4.17"')) "React template lockfile should lock Tailwind 3.4.17"
Assert-True ($templateTsconfigApp.Contains('"moduleResolution": "Bundler"')) "React template should use Bundler module resolution"
Assert-True (-not ($templateTsconfigApp.Contains('"baseUrl"'))) "React template app tsconfig should avoid deprecated baseUrl fallback"
Assert-True (-not ($templateTsconfig.Contains('"baseUrl"'))) "React template root tsconfig should avoid deprecated baseUrl fallback"

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
Assert-True ($readme.Contains("scripts\install-local.ps1")) "README should mention install script"
Assert-True ($readme.Contains("assets/templates/vite-react-shadcn/")) "README should mention bundled React template"
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
Assert-True ($openaiYaml.Contains("Vite + React + TypeScript + shadcn")) "agents/openai.yaml should mention the default React stack"
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
