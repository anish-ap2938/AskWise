# Convert merged HF weights → MLC q4f16_1 for WebLLM (Windows)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Config = if ($args[0]) { $args[0] } else { "config.yaml" }
$py = if (Test-Path ".\.venv\Scripts\python.exe") { (Resolve-Path ".\.venv\Scripts\python.exe").Path } else { "python" }

$MERGED = & $py -c "import yaml; print(yaml.safe_load(open(r'$Config', encoding='utf-8'))['merged_dir'])"
$OUT = & $py -c "import yaml; print(yaml.safe_load(open(r'$Config', encoding='utf-8'))['mlc_dir'])"
$NAME = & $py -c "import yaml; print(yaml.safe_load(open(r'$Config', encoding='utf-8'))['output_name'])"

$MERGED_PATH = Join-Path (Get-Location) $MERGED
$OUT_PATH = Join-Path (Get-Location) $OUT
New-Item -ItemType Directory -Force -Path $OUT_PATH | Out-Null

# Prefer float16 export if present (MLC loader is happier than bf16).
$F16 = Join-Path (Get-Location) "output\merged_hf_f16"
if (Test-Path (Join-Path $F16 "config.json")) {
  $MERGED_PATH = $F16
}

Write-Host "==> gen_config + convert_weight for $NAME"
Write-Host "    source: $MERGED_PATH"
& $py -m mlc_llm gen_config $MERGED_PATH --quantization q4f16_1 --conv-template qwen2 -o $OUT_PATH
if ($LASTEXITCODE -ne 0) { throw "gen_config failed ($LASTEXITCODE)" }

# CPU device avoids Vulkan float16 issues on Windows; numpy<2 required for TVM.
& $py -m mlc_llm convert_weight $MERGED_PATH --quantization q4f16_1 --device cpu --model-type qwen2 -o $OUT_PATH
if ($LASTEXITCODE -ne 0) { throw "convert_weight failed ($LASTEXITCODE)" }

Write-Host ""
Write-Host "MLC weights ready at: $OUT_PATH"
Write-Host "Wasm: reuse packaged AskWise Qwen2.5-1.5B q4f16_1 wasm."
