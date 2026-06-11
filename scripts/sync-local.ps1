param(
  [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
  [string]$CodexHome = $(if ($env:CODEX_HOME) { $env:CODEX_HOME } else { "D:\Codex\.codex" }),
  [string]$SkillName = "moni-ui-skill",
  [switch]$Clean
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath([string]$Path) {
  $executionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
}

function Assert-ChildPath([string]$Child, [string]$Parent) {
  $childFull = Resolve-AbsolutePath $Child
  $parentFull = Resolve-AbsolutePath $Parent
  if (-not $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to operate outside target root. Child=$childFull Parent=$parentFull"
  }
}

$source = Resolve-AbsolutePath $SourceRoot
$skillsRoot = Resolve-AbsolutePath (Join-Path $CodexHome "skills")
$target = Join-Path $skillsRoot $SkillName

if (-not (Test-Path -LiteralPath (Join-Path $source "SKILL.md"))) {
  throw "SourceRoot does not look like a Codex skill: $source"
}

New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null
Assert-ChildPath $target $skillsRoot

if ($Clean -and (Test-Path -LiteralPath $target)) {
  $resolvedTarget = Resolve-AbsolutePath $target
  Assert-ChildPath $resolvedTarget $skillsRoot
  Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $target | Out-Null

$excludeNames = @(".git", "tmp", "node_modules", "dist", ".fidelity-tools")
Get-ChildItem -LiteralPath $source -Force |
  Where-Object { $excludeNames -notcontains $_.Name } |
  ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force
  }

Write-Host "Synced $source to $target"
