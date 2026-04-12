$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$serverPort = 8787
$domain = 'braggadocian-osteometrical-petronila.ngrok-free.dev'
$serverUrl = "http://localhost:$serverPort"
$publicUrl = "https://$domain"
$sentinelScript = Join-Path $PSScriptRoot 'ensure-queue-sentinels.ps1'

Write-Host "[audioTest] bridge start"
Write-Host "[audioTest] root: $root"
Write-Host "[audioTest] local: $serverUrl"
Write-Host "[audioTest] public: $publicUrl"

if (Test-Path -LiteralPath $sentinelScript) {
  & $sentinelScript
} else {
  Write-Host "[audioTest] queue sentinel script missing: $sentinelScript"
}

try {
  Invoke-WebRequest -Uri $serverUrl -TimeoutSec 2 | Out-Null
  Write-Host "[audioTest] server already up"
} catch {
  Write-Host "[audioTest] start server via npm start"
  Start-Process npm.cmd -ArgumentList 'start' -WorkingDirectory $root | Out-Null

  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
      Invoke-WebRequest -Uri $serverUrl -TimeoutSec 2 | Out-Null
      $ready = $true
      break
    } catch {
      continue
    }
  }

  if (-not $ready) {
    throw "Local server not ready on $serverUrl"
  }
  Write-Host "[audioTest] server ready"
}

Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[audioTest] old ngrok stopped"

Start-Process ngrok -ArgumentList "http --domain=$domain $serverPort" -WorkingDirectory $root | Out-Null
Write-Host "[audioTest] ngrok started"
