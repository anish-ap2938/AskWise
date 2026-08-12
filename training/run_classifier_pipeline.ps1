# Unattended chain: finish labeling -> synthesize rare modes -> train the classifier.
#
# Each stage is resumable, so re-running this script after an interruption picks up
# where it stopped. Stages run strictly one at a time: labeling and generation use
# different long system prompts, and interleaving them evicts Ollama's prefix cache
# and roughly halves throughput for both.
#
# ASCII only on purpose: Windows PowerShell reads .ps1 as ANSI when there is no BOM,
# so a stray non-ASCII character breaks string parsing.
#
#   powershell -ExecutionPolicy Bypass -File training\run_classifier_pipeline.ps1

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

$py = ".\.venv\Scripts\python.exe"
$env:PYTHONIOENCODING = "utf-8"

function Log($msg) {
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg"
}

function Wait-ForScript($pattern, $label) {
  $seen = $false
  while ($true) {
    $running = Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
      Where-Object { $_.CommandLine -match $pattern }
    if (-not $running) { break }
    if (-not $seen) {
      Log "waiting for $label to finish..."
      $seen = $true
    }
    Start-Sleep -Seconds 30
  }
  if ($seen) { Log "$label finished" }
}

function Count-Lines($path) {
  if (-not (Test-Path $path)) { return 0 }
  return (Get-Content $path | Measure-Object -Line).Lines
}

Log "=== AskWise classifier pipeline ==="

# --- Stage 1: labeling -------------------------------------------------------
Wait-ForScript '11_autolabel' 'labeling'

$labeled = Count-Lines "data\raw\labeled.jsonl"
$pool = Count-Lines "data\raw\pool.jsonl"
Log "labeled $labeled of $pool"

# Resume if the run died early rather than completing the pool.
if ($labeled -lt ($pool - 500)) {
  Log "resuming labeling for the remainder"
  & $py 11_autolabel_modes.py --limit 40000 --workers 5
  $after = Count-Lines "data\raw\labeled.jsonl"
  Log "labeling done: $after rows"
}

# --- Stage 2: synthetic prompts for under-covered modes ---------------------
Wait-ForScript '13_synth' 'synth generation'
Log "starting synth generation"
& $py 13_synth_mode_prompts.py --workers 5 --verify --scale 0.65
$synth = Count-Lines "data\raw\synth.jsonl"
Log "synth done: $synth rows"

# --- Stage 3: train + export the classifier --------------------------------
Log "training intent classifier"
& $py 12_train_intent_clf.py
if ($LASTEXITCODE -ne 0) {
  Log "training FAILED with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Log "model exported to public/assets/intent-model.json"

# --- Stage 4: guard against a silently dropped class ------------------------
# min-per-class filtering can quietly discard a mode that synth under-supplied.
# A model missing a class can never predict it, which is exactly the failure the
# stale 9-class model produced against the 18-mode taxonomy.
$expected = & $py -c @"
import json, re, pathlib
src = pathlib.Path('../src/shared/types.ts').read_text(encoding='utf-8')
block = src.split('ModeId')[1].split(';')[0]
modes = [m for m in re.findall(r'"([a-z_]+)"', block) if m != 'custom']
model = json.load(open('../public/assets/intent-model.json', encoding='utf-8'))
missing = sorted(set(modes) - set(model['classes']))
print(len(modes), len(model['classes']), ','.join(missing))
"@
$parts = "$expected".Trim().Split(" ")
Log "taxonomy modes: $($parts[0]), model classes: $($parts[1])"
if ($parts.Length -gt 2 -and $parts[2]) {
  Log "FAILED - model is missing classes: $($parts[2])"
  Log "raise synth volume for those modes or lower --min-per-class, then re-run"
  exit 1
}

# --- Stage 5: retune the hybrid blend and report ----------------------------
Push-Location ..
Log "checking python/typescript feature parity"
& npx vitest run tests/unit/intentModel.test.ts
if ($LASTEXITCODE -ne 0) { Log "PARITY FAILED - features diverged, model scores are untrustworthy" }

Log "tuning hybrid constants"
& npm run train:tune-hybrid

Log "final eval"
& npm run eval
Pop-Location

Log "=== done ==="
