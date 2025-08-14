<#
Create a CCPulse desktop shortcut (Windows)
- No hard-coded user paths
- Targets CCPulse.bat in the same folder as this script
#>

$ErrorActionPreference = 'Stop'

# Determine the directory of this script (deployment location)
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

# Run target: hidden PowerShell that launches CCPulse.bat
$targetExe = 'powershell.exe'
$batPath  = Join-Path $scriptDir 'CCPulse.bat'
$targetArgs = "-WindowStyle Hidden -Command `"& `'$batPath`'`""

# Icon: prefer icon.ico; fallback to icon.png if present
$iconPath = Join-Path $scriptDir 'icon.ico'
if (-not (Test-Path $iconPath)) {
  $pngIcon = Join-Path $scriptDir 'icon.png'
  if (Test-Path $pngIcon) { $iconPath = $pngIcon }
}

$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'CCPulse.lnk'

$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = $targetExe
$sc.Arguments = $targetArgs
$sc.WorkingDirectory = $scriptDir
if (Test-Path $iconPath) { $sc.IconLocation = $iconPath }
$sc.Description = 'CCPulse'
$sc.Save()

Write-Host 'Desktop shortcut created!' -ForegroundColor Green
