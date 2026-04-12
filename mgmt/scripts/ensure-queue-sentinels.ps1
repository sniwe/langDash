$ErrorActionPreference = 'Stop'

function Get-QueueState {
  param(
    [Parameter(Mandatory = $true)][string]$QueueDir
  )

  if (-not (Test-Path -LiteralPath $QueueDir)) {
    New-Item -ItemType Directory -Path $QueueDir -Force | Out-Null
  }

  $files = Get-ChildItem -LiteralPath $QueueDir -File -Filter '*.txt' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^(\d+)\.txt$' }

  $maxOrdinal = 0
  $hasBlank = $false

  foreach ($file in $files) {
    if ($file.Name -match '^(\d+)\.txt$') {
      $ordinal = [int]$Matches[1]
      if ($ordinal -gt $maxOrdinal) {
        $maxOrdinal = $ordinal
      }
    }

    $content = ''
    try {
      $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
    } catch {
      $content = ''
    }

    if ([string]::IsNullOrWhiteSpace($content)) {
      $hasBlank = $true
    }
  }

  [pscustomobject]@{
    QueueDir = $QueueDir
    MaxOrdinal = $maxOrdinal
    HasBlank = $hasBlank
  }
}

function Ensure-QueueSentinel {
  param(
    [Parameter(Mandatory = $true)][string]$QueueDir,
    [Parameter(Mandatory = $true)][string]$QueueName
  )

  $state = Get-QueueState -QueueDir $QueueDir
  if ($state.HasBlank) {
    Write-Host "[$QueueName] blank sentinel already present"
    return
  }

  $nextOrdinal = [Math]::Max(1, $state.MaxOrdinal + 1)
  $sentinelPath = Join-Path $QueueDir ("{0}.txt" -f $nextOrdinal)
  if (-not (Test-Path -LiteralPath $sentinelPath)) {
    New-Item -ItemType File -Path $sentinelPath -Force | Out-Null
  } else {
    Set-Content -LiteralPath $sentinelPath -Value '' -NoNewline
  }

  Write-Host "[$QueueName] created blank sentinel: $sentinelPath"
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$todoDir = Join-Path $root 'mgmt\toDo'
$errFixDir = Join-Path $root 'mgmt\errFix'

Ensure-QueueSentinel -QueueDir $todoDir -QueueName 'toDo'
Ensure-QueueSentinel -QueueDir $errFixDir -QueueName 'errFix'
