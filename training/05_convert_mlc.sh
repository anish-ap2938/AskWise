#!/usr/bin/env bash
# Convert merged HF weights → MLC q4f16_1 for WebLLM.
# Requires: https://llm.mlc.ai/docs/install/mlc_llm.html
# AND a Wasm build toolchain for compiling a new .wasm (only needed if you
# change architecture/quantization). For Qwen2.5-1.5B-q4f16_1 we REUSE the
# packaged AskWise wasm — only weights need converting + uploading.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:-config.yaml}"
MERGED="$(python3 - <<PY
import yaml
print(yaml.safe_load(open("$CONFIG"))["merged_dir"])
PY
)"
OUT="$(python3 - <<PY
import yaml
print(yaml.safe_load(open("$CONFIG"))["mlc_dir"])
PY
)"
NAME="$(python3 - <<PY
import yaml
print(yaml.safe_load(open("$CONFIG"))["output_name"])
PY
)"

MERGED_PATH="$(pwd)/${MERGED}"
OUT_PATH="$(pwd)/${OUT}"
mkdir -p "$OUT_PATH"

echo "==> gen_config + convert_weight for ${NAME}"
mlc_llm gen_config "$MERGED_PATH" \
  --quantization q4f16_1 \
  --conv-template qwen2 \
  -o "$OUT_PATH"

mlc_llm convert_weight "$MERGED_PATH" \
  --quantization q4f16_1 \
  -o "$OUT_PATH"

echo ""
echo "MLC weights ready at: $OUT_PATH"
echo "Upload this folder to Hugging Face as your MLC repo."
echo ""
echo "Wasm: AskWise already ships Qwen2.5-1.5B q4f16_1 wasm — reuse it."
echo "Only compile a new wasm if you change architecture or quantization:"
echo "  mlc_llm compile $OUT_PATH/mlc-chat-config.json --device webgpu -o dist/${NAME}-q4f16_1-webgpu.wasm"
