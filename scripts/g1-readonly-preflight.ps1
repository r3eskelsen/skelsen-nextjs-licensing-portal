# ESK-LAB-04 G1: read-only inspection of local tools/resources.
# Sole filesystem write: evidence/G1_WINDOWS_PREFLIGHT.txt within this repository.
# No installations, network calls, container starts/stops, or environment file reads.
$ErrorActionPreference = 'Continue'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$EvidenceDir = Join-Path $Root 'evidence'
if (-not (Test-Path -LiteralPath $EvidenceDir -PathType Container)) { New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null }
$Report = Join-Path $EvidenceDir 'G1_WINDOWS_PREFLIGHT.txt'
$lines = New-Object 'System.Collections.Generic.List[string]'
function Add-Line([string]$line) { $lines.Add($line); Write-Output $line }
function Get-ToolVersion([string]$name, [string[]]$arguments) {
  $command = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $command) { Add-Line "$name=NOT_FOUND"; return }
  try {
    $output = & $name @arguments 2>&1 | Select-Object -First 3
    Add-Line ("{0}={1}" -f $name, (($output | Out-String).Trim() -replace '[\r\n]+', ' | '))
  } catch { Add-Line "$name=ERROR_CHECKING_VERSION" }
}
Add-Line '=== ESK-LAB-04 G1 LOCAL READ-ONLY PREFLIGHT ==='
Add-Line ("UTC_TIME=" + [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
Add-Line ("POWERSHELL_VERSION=" + $PSVersionTable.PSVersion.ToString())
Add-Line ("WINDOWS_VERSION=" + [Environment]::OSVersion.Version.ToString())
Add-Line ("PROJECT_ROOT_EXISTS=" + (Test-Path -LiteralPath $Root -PathType Container))
foreach ($file in @('package.json','LICENSE','.env.example','supabase/config.toml','supabase/migrations/20261105000100_initial.sql','tests/import.test.mjs')) {
  Add-Line ("FILE_{0}={1}" -f $file, (Test-Path -LiteralPath (Join-Path $Root $file) -PathType Leaf))
}
Get-ToolVersion 'node' @('--version')
Get-ToolVersion 'npm' @('--version')
Get-ToolVersion 'docker' @('--version')
Get-ToolVersion 'git' @('--version')
Get-ToolVersion 'wsl' @('--version')
if (Get-Command docker -ErrorAction SilentlyContinue) {
  try {
    $version = & docker version --format '{{.Server.Version}}' 2>$null
    if ($LASTEXITCODE -eq 0 -and $version) { Add-Line ("DOCKER_SERVER=AVAILABLE_VERSION_" + ($version | Select-Object -First 1)) }
    else { Add-Line 'DOCKER_SERVER=UNAVAILABLE' }
  } catch { Add-Line 'DOCKER_SERVER=UNAVAILABLE' }
} else { Add-Line 'DOCKER_SERVER=NOT_INSTALLED' }
try {
  $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
  Add-Line ("PHYSICAL_RAM_GIB=" + [Math]::Round(($os.TotalVisibleMemorySize * 1KB / 1GB), 2))
  Add-Line ("FREE_RAM_GIB=" + [Math]::Round(($os.FreePhysicalMemory * 1KB / 1GB), 2))
} catch { Add-Line 'RAM_CHECK=UNAVAILABLE' }
try {
  $drive = (Get-Item -LiteralPath $Root).PSDrive
  if ($drive -and $drive.Free -ne $null) { Add-Line ("PROJECT_DRIVE_FREE_GIB=" + [Math]::Round(($drive.Free / 1GB), 2)) }
  else { Add-Line 'PROJECT_DRIVE_FREE_GIB=UNAVAILABLE' }
} catch { Add-Line 'PROJECT_DRIVE_FREE_GIB=UNAVAILABLE' }
# Derive the ports actually configured by this project's Supabase configuration.
$configText = Get-Content -LiteralPath (Join-Path $Root 'supabase/config.toml') -Raw
$configuredPorts = @([regex]::Matches($configText, '(?m)^\s*(?:port|shadow_port)\s*=\s*(\d+)\s*$') | ForEach-Object { [int]$_.Groups[1].Value })
$frontendPort = @([regex]::Matches($configText, '(?m)^\s*site_url\s*=\s*"http://(?:localhost|127\.0\.0\.1):(\d+)"') | ForEach-Object { [int]$_.Groups[1].Value })
$allPorts = @($configuredPorts + $frontendPort) | Sort-Object -Unique
if ($allPorts.Count -lt 5) { Add-Line 'PORT_CONFIG_PARSE=HOLD_INCOMPLETE'; }
else { Add-Line ("PORT_CONFIG_PARSE=PASS; PORTS=" + ($allPorts -join ',')) }
foreach ($port in $allPorts) {
  try {
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
      $found = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).Count -gt 0
      Add-Line ("PORT_{0}_LISTENING={1}" -f $port, $found)
    } else { Add-Line ("PORT_{0}_LISTENING=UNKNOWN" -f $port) }
  } catch { Add-Line ("PORT_{0}_LISTENING=UNKNOWN" -f $port) }
}
Add-Line 'INSPECTION_COMPLETED=TRUE'
Add-Line 'NO_INSTALL_NO_DOCKER_MUTATIONS=TRUE'
[System.IO.File]::WriteAllLines($Report, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output ('EVIDENCE_FILE=' + $Report)
Write-Output 'Review the report for personal information before sharing.'
