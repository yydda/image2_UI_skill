param(
  [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
  [string]$CodexHome = $(if ($env:CODEX_HOME) { $env:CODEX_HOME } else { "D:\Codex\.codex" }),
  [string]$SkillName = "moni-ui-skill"
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath([string]$Path) {
  $executionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
}

$source = Resolve-AbsolutePath $SourceRoot
$skillsRoot = Resolve-AbsolutePath (Join-Path $CodexHome "skills")
$target = Join-Path $skillsRoot $SkillName

if (-not (Test-Path -LiteralPath (Join-Path $source "SKILL.md"))) {
  throw "SourceRoot does not look like a Codex skill: $source"
}

New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null

& (Join-Path $PSScriptRoot "sync-local.ps1") `
  -SourceRoot $source `
  -CodexHome $CodexHome `
  -SkillName $SkillName

Write-Host "Installed $SkillName to $target"
Write-Host "Restart Codex or open a new session to reload skills."
