$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4191
$url = "http://127.0.0.1:$port/"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

function Assert-True($condition, $message) {
  if (-not $condition) {
    throw $message
  }
}

Assert-True (Test-Path -LiteralPath (Join-Path $root "index.html")) "Missing index.html"
Assert-True (Test-Path -LiteralPath (Join-Path $root "styles.css")) "Missing styles.css"
Assert-True (Test-Path -LiteralPath (Join-Path $root "script.js")) "Missing script.js"
Assert-True (Test-Path -LiteralPath $chrome) "Chrome not found at $chrome"

$html = Get-Content -LiteralPath (Join-Path $root "index.html") -Raw
Assert-True (-not ($html -match "https?://")) "Demo should not depend on remote URLs"
Assert-True (($html -match "data-go=`"home`"") -and ($html -match "data-go=`"meeting`"")) "Missing expected click paths"

$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($existing) {
  $existing | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

$server = Start-Process -FilePath python -ArgumentList @("-m", "http.server", "$port", "--bind", "127.0.0.1") -WorkingDirectory $root -WindowStyle Hidden -PassThru
$chromeProcess = $null

try {
  Start-Sleep -Seconds 2
  $status = (Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 10).StatusCode
  Assert-True ($status -eq 200) "Preview server did not return 200"

  $screenshots = Join-Path $root "screenshots"
  New-Item -ItemType Directory -Force -Path $screenshots | Out-Null
  $desktopShot = Join-Path $screenshots "validate-desktop.png"
  & $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1280,960 --screenshot="$desktopShot" $url | Out-Null
  Start-Sleep -Seconds 1
  Assert-True ((Test-Path -LiteralPath $desktopShot) -and ((Get-Item -LiteralPath $desktopShot).Length -gt 10000)) "Chrome screenshot failed"

  $profile = Join-Path $env:TEMP "marble-note-validate-cdp"
  if (Test-Path -LiteralPath $profile) {
    Remove-Item -LiteralPath $profile -Recurse -Force
  }
  $chromeProcess = Start-Process -FilePath $chrome -ArgumentList @("--headless=new", "--disable-gpu", "--remote-debugging-port=9230", "--user-data-dir=$profile", "--window-size=390,860", $url) -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds 3

  $targets = Invoke-RestMethod -Uri "http://127.0.0.1:9230/json" -TimeoutSec 10
  $page = $targets | Where-Object { $_.type -eq "page" } | Select-Object -First 1
  Assert-True $page "No Chrome page target found"

  $ws = [System.Net.WebSockets.ClientWebSocket]::new()
  $ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  $script:cdpId = 0

  function Receive-CdpMessage {
    $buffer = New-Object byte[] 1048576
    $chunks = [System.Collections.Generic.List[byte]]::new()
    do {
      $seg = [ArraySegment[byte]]::new($buffer)
      $result = $script:ws.ReceiveAsync($seg, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
      for ($i = 0; $i -lt $result.Count; $i++) {
        $chunks.Add($buffer[$i])
      }
    } while (-not $result.EndOfMessage)
    return ([Text.Encoding]::UTF8.GetString($chunks.ToArray()) | ConvertFrom-Json)
  }

  function Send-Cdp($method, $params = $null) {
    $script:cdpId++
    $payload = @{ id = $script:cdpId; method = $method }
    if ($null -ne $params) {
      $payload.params = $params
    }
    $json = $payload | ConvertTo-Json -Depth 20 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($json)
    $script:ws.SendAsync([ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    while ($true) {
      $msg = Receive-CdpMessage
      if ($null -ne $msg -and $msg.id -eq $script:cdpId) {
        return $msg
      }
    }
  }

  function Eval-Js([string]$expr) {
    $response = Send-Cdp "Runtime.evaluate" @{ expression = $expr; awaitPromise = $true; returnByValue = $true }
    if ($response.result.exceptionDetails) {
      throw "JS failed: $expr"
    }
    return $response.result.result.value
  }

  Send-Cdp "Runtime.enable" | Out-Null
  $initial = Eval-Js 'document.querySelector(".phone.is-active").dataset.screen'
  $afterHome = Eval-Js 'document.querySelector("[data-screen=cover] [data-go=home]").click(), document.querySelector(".phone.is-active").dataset.screen'
  $afterMeeting = Eval-Js 'document.querySelector("[data-screen=home] [data-go=meeting]").click(), document.querySelector(".phone.is-active").dataset.screen'
  $brokenImages = Eval-Js 'Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).length'

  Assert-True ($initial -eq "cover") "Initial screen should be cover"
  Assert-True ($afterHome -eq "home") "Cover -> home click failed"
  Assert-True ($afterMeeting -eq "meeting") "Home -> meeting click failed"
  Assert-True ($brokenImages -eq 0) "Found broken images"

  $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "done", [Threading.CancellationToken]::None).GetAwaiter().GetResult()

  [pscustomobject]@{
    Ok = $true
    Url = $url
    Screenshot = $desktopShot
    Initial = $initial
    AfterHome = $afterHome
    AfterMeeting = $afterMeeting
    BrokenImages = $brokenImages
  }
}
finally {
  if ($chromeProcess) {
    Stop-Process -Id $chromeProcess.Id -Force -ErrorAction SilentlyContinue
  }
  if ($server) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
}
