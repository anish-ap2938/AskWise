# Push MLC weight folder to Hugging Face (Windows)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Config = if ($args[0]) { $args[0] } else { "config.yaml" }
$py = if (Test-Path ".\.venv\Scripts\python.exe") { (Resolve-Path ".\.venv\Scripts\python.exe").Path } else { "python" }

$REPO = & $py -c "import yaml; print(yaml.safe_load(open(r'$Config', encoding='utf-8'))['hf_repo'])"
$MLC = & $py -c "import yaml; print(yaml.safe_load(open(r'$Config', encoding='utf-8'))['mlc_dir'])"

if ($REPO -like "YOUR_HF_USER/*") {
  throw "Edit training/config.yaml hf_repo before pushing (got: $REPO)"
}

$MLC_PATH = Join-Path (Get-Location) $MLC
Write-Host "Uploading $MLC_PATH -> https://huggingface.co/$REPO"

& $py -c @"
from huggingface_hub import HfApi, login
import os
token = os.environ.get('HF_TOKEN') or os.environ.get('HUGGING_FACE_HUB_TOKEN')
if token:
    login(token=token, add_to_git_credential=False)
api = HfApi()
api.create_repo('$REPO', repo_type='model', exist_ok=True, private=False)
api.upload_folder(folder_path=r'$MLC_PATH', repo_id='$REPO', repo_type='model')
print('Uploaded https://huggingface.co/$REPO')
"@
if ($LASTEXITCODE -ne 0) { throw "upload failed ($LASTEXITCODE)" }
