<#
바탕화면에 CCPulse 바로가기 생성 스크립트
- 개인 경로 하드코딩 제거
- 스크립트가 있는 폴더 기준으로 상대 동작
#>

$ErrorActionPreference = 'Stop'

# 현재 스크립트가 있는 디렉터리 (배포 위치)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 실행 대상: 같은 폴더의 CCPulse.bat을 PowerShell로 숨김 실행
$targetExe = 'powershell.exe'
$targetArgs = "-WindowStyle Hidden -Command `"& `'$scriptDir\\CCPulse.bat`'`""

# 아이콘은 같은 폴더의 icon.ico가 있으면 사용
$iconPath = Join-Path $scriptDir 'icon.ico'
if (-not (Test-Path $iconPath)) {
    # ico가 없으면 png도 허용(보이기만 함). 없으면 생략
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

Write-Host '바탕화면에 바로가기가 생성되었습니다!' -ForegroundColor Green