$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repoRoot "frontend"
$nodeExe = "C:\Users\Sonu\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

Set-Location $frontendRoot
$env:BROWSER = "none"
& $nodeExe "node_modules\react-scripts\bin\react-scripts.js" "start"
