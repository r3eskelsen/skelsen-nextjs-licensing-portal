# Local repository-relative evidence capture. Does not touch shared infrastructure.
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
New-Item -ItemType Directory -Force -Path (Join-Path $ProjectRoot 'evidence') | Out-Null
$Log = Join-Path $ProjectRoot 'evidence/windows-node-tests.txt'
node --version | Out-File $Log -Encoding utf8
npm --version | Out-File $Log -Append -Encoding utf8
npm test 2>&1 | Out-File $Log -Append -Encoding utf8
Write-Output "Saved local test evidence to $Log"
