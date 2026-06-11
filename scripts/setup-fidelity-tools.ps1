param(
  [switch]$CheckOnly,
  [switch]$SkipPython,
  [switch]$SkipRealEsrgan,
  [switch]$SkipVectorizer,
  [string]$Python = "python"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$results = [System.Collections.Generic.List[object]]::new()
$toolRoot = Join-Path $root ".fidelity-tools"
$config = [ordered]@{
  toolRoot = $toolRoot
  pythonPath = $null
  rembgMode = $null
  rembgCommand = $null
  realesrganPath = $null
  vtracerCommand = $null
  updatedAt = (Get-Date).ToString("o")
}

function Add-Result([string]$Tool, [bool]$Ok, [string]$Detail) {
  $results.Add([pscustomobject]@{
    Tool = $Tool
    Ok = $Ok
    Detail = $Detail
  })
}

function Test-Command([string]$Name) {
  $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-Executable([string]$Path) {
  try {
    & $Path --version *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Save-Config {
  New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null
  $configPath = Join-Path $toolRoot "config.json"
  $json = $config | ConvertTo-Json -Depth 5
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($configPath, $json, $utf8NoBom)
}

Push-Location $root
try {
  if (-not (Test-Command "node")) {
    Add-Result "node" $false "Node.js is required for fidelity scripts."
  } else {
    Add-Result "node" $true ((node --version) -join " ")
  }

  if (-not (Test-Command "npm")) {
    Add-Result "npm" $false "npm is required to install sharp and pixelmatch."
  } elseif ($CheckOnly) {
    Add-Result "npm" $true "npm available; skipped npm install because -CheckOnly was set."
  } else {
    npm install --ignore-scripts --no-audit --fund=false
    Add-Result "npm" $true "Installed Node fidelity dependencies from package-lock.json/package.json."
  }

  New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null

  $pythonOk = $false
  if (-not $SkipPython) {
    $pythonOk = Test-Executable $Python
    if ($pythonOk) {
      $resolvedPython = Resolve-Path -LiteralPath $Python -ErrorAction SilentlyContinue
      if ($resolvedPython) {
        $config.pythonPath = $resolvedPython.Path
      } else {
        $config.pythonPath = $Python
      }
    }
  }

  if ($SkipPython) {
    Add-Result "rembg" $false "Skipped Python/rembg setup by request."
  } elseif (-not $pythonOk) {
    Add-Result "rembg" $false "Python command '$Python' was not found."
  } elseif (Test-Command "rembg") {
    $config.rembgMode = "command"
    $config.rembgCommand = "rembg"
    Add-Result "rembg" $true "rembg command is already available."
  } elseif ($CheckOnly) {
    Add-Result "rembg" $false "rembg command is missing; run without -CheckOnly to install via pip."
  } else {
    & $Python -m pip install --upgrade "rembg[cpu,cli]"
    & $Python -c "import rembg" *> $null
    if ($LASTEXITCODE -eq 0) {
      $pythonDir = Split-Path -Parent $config.pythonPath
      $rembgExe = Join-Path $pythonDir "Scripts\rembg.exe"
      if (Test-Path -LiteralPath $rembgExe) {
        $config.rembgMode = "command"
        $config.rembgCommand = $rembgExe
      } else {
        $config.rembgMode = "python-module"
      }
      Add-Result "rembg" $true "Installed rembg into Python environment: $Python"
    } else {
      Add-Result "rembg" $false "Attempted rembg[cpu,cli] install with '$Python -m pip install --upgrade rembg[cpu,cli]', but import check failed."
    }
  }

  if ($SkipRealEsrgan) {
    Add-Result "realesrgan-ncnn-vulkan" $false "Skipped Real-ESRGAN setup by request."
  } elseif (Test-Command "realesrgan-ncnn-vulkan") {
    $config.realesrganPath = "realesrgan-ncnn-vulkan"
    Add-Result "realesrgan-ncnn-vulkan" $true "realesrgan-ncnn-vulkan command is available."
  } elseif ($CheckOnly) {
    Add-Result "realesrgan-ncnn-vulkan" $false "Real-ESRGAN command is missing."
  } elseif (Test-Command "scoop") {
    scoop install realesrgan-ncnn-vulkan
    if (Test-Command "realesrgan-ncnn-vulkan") {
      $config.realesrganPath = "realesrgan-ncnn-vulkan"
    }
    Add-Result "realesrgan-ncnn-vulkan" (Test-Command "realesrgan-ncnn-vulkan") "Attempted install with Scoop."
  } else {
    $extractPath = Join-Path $toolRoot "realesrgan-ncnn-vulkan"
    $exe = $null
    if (Test-Path -LiteralPath $extractPath) {
      $exe = Get-ChildItem -LiteralPath $extractPath -Recurse -Filter "realesrgan-ncnn-vulkan.exe" | Select-Object -First 1
    }

    if (-not $exe) {
      $zipUrl = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip"
      $zipPath = Join-Path $toolRoot "realesrgan-ncnn-vulkan-windows.zip"
      Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
      if (Test-Path -LiteralPath $extractPath) {
        Remove-Item -LiteralPath $extractPath -Recurse -Force
      }
      Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force
      $exe = Get-ChildItem -LiteralPath $extractPath -Recurse -Filter "realesrgan-ncnn-vulkan.exe" | Select-Object -First 1
    }

    if ($exe) {
      $config.realesrganPath = $exe.FullName
      Add-Result "realesrgan-ncnn-vulkan" $true "Portable Real-ESRGAN available at $($exe.FullName)."
    } else {
      Add-Result "realesrgan-ncnn-vulkan" $false "Downloaded archive but could not find realesrgan-ncnn-vulkan.exe."
    }
  }

  if ($SkipVectorizer) {
    Add-Result "vtracer" $false "Skipped VTracer setup by request."
  } elseif (Test-Command "vtracer") {
    $config.vtracerCommand = "vtracer"
    Add-Result "vtracer" $true "vtracer command is available."
  } elseif ($CheckOnly) {
    Add-Result "vtracer" $false "vtracer command is missing."
  } elseif (Test-Command "cargo") {
    cargo install vtracer
    if (Test-Command "vtracer") {
      $config.vtracerCommand = "vtracer"
    }
    Add-Result "vtracer" (Test-Command "vtracer") "Attempted install with cargo."
  } else {
    Add-Result "vtracer" $false "Install Rust/Cargo or manually add vtracer to PATH."
  }

  Save-Config
} finally {
  Pop-Location
}

$results
