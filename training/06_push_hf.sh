#!/usr/bin/env bash
# Push MLC weight folder to Hugging Face.
# Requires: huggingface-cli login
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:-config.yaml}"
REPO="$(python3 - <<PY
import yaml
print(yaml.safe_load(open("$CONFIG"))["hf_repo"])
PY
)"
MLC="$(python3 - <<PY
import yaml
print(yaml.safe_load(open("$CONFIG"))["mlc_dir"])
PY
)"

if [[ "$REPO" == YOUR_HF_USER/* ]]; then
  echo "Edit training/config.yaml hf_repo before pushing (got: $REPO)"
  exit 1
fi

echo "Uploading $(pwd)/${MLC} → https://huggingface.co/${REPO}"
huggingface-cli upload "$REPO" "$(pwd)/${MLC}" . --repo-type model
echo "Done. Set ASKWISE_FT_HF_REPO / training config and rebuild the extension."
