# ASCII-only. Ensure at least one 11_autolabel job; prefer venv; never kill rivals
# (killing races with other agents and was taking down the good job).
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$VenvPy = Join-Path $Root ".venv\Scripts\python.exe"
$OutFile = Join-Path $Root "data\raw\labeled.jsonl"
$Log = Join-Path $Root "data\raw\label_watch.log"
$Pool = Join-Path $Root "data\raw\pool.jsonl"
$Lock = Join-Path $Root "data\raw\label.lock"

function Write-Log($msg) {
  Add-Content -Path $Log -Value "$(Get-Date -Format o) $msg" -Encoding ascii
}

function Get-Labelers {
  Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and ($_.CommandLine -match '11_autolabel_modes') }
}

function Get-LineCount($path) {
  if (-not (Test-Path $path)) { return 0 }
  return (Get-Content $path | Measure-Object -Line).Lines
}

Write-Log "watch start (no-kill) venv=$VenvPy"
$lastLines = Get-LineCount $OutFile
$stableZero = 0

while ($true) {
  $all = @(Get-Labelers)
  $lines = Get-LineCount $OutFile
  $poolLines = Get-LineCount $Pool

  if ($lines -ge $poolLines -and $poolLines -gt 0 -and $all.Count -eq 0) {
    Write-Log "complete lines=$lines pool=$poolLines"
    break
  }

  if ($all.Count -eq 0) {
    # Exclusive start attempt via lock file
    $canStart = $false
    try {
      $fs = [System.IO.File]::Open($Lock, 'OpenOrCreate', 'ReadWrite', 'None')
      $canStart = $true
    } catch {
      Write-Log "lock busy; skip start"
    }
    if ($canStart) {
      try {
        Write-Log "starting venv labeler lines=$lines pool=$poolLines"
        $arg = "/c start `"AskWiseLabel`" /MIN `"$VenvPy`" 11_autolabel_modes.py --limit 40000 --workers 6 --model qwen3:8b --out data\raw\labeled.jsonl"
        Start-Process -FilePath "cmd.exe" -ArgumentList $arg -WorkingDirectory $Root | Out-Null
        Start-Sleep -Seconds 10
      } finally {
        if ($fs) { $fs.Close(); $fs.Dispose() }
      }
    }
  } else {
    $cmds = ($all | ForEach-Object { "pid=$($_.ProcessId)" }) -join " "
    Write-Log "status n=$($all.Count) lines=$lines delta=$($lines - $lastLines) $cmds"
  }

  if ($lines -le $lastLines) { $stableZero++ } else { $stableZero = 0 }
  $lastLines = $lines

  # If a labeler is "running" but file has not grown for ~15 min and still incomplete, log only.
  if ($stableZero -ge 30 -and $lines -lt $poolLines) {
    Write-Log "WARN no growth for a while lines=$lines pool=$poolLines procs=$($all.Count)"
    $stableZero = 0
  }

  Start-Sleep -Seconds 30
}
