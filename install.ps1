# CCPulse - Windows Installation Script
# https://github.com/renechoi/ccpulse
# Run in PowerShell as Administrator: iwr -useb https://raw.githubusercontent.com/renechoi/ccpulse/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CCPulse Installer            ║" -ForegroundColor Cyan
Write-Host "║         GUI Edition v1.0.0             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  This script requires Administrator privileges." -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host "Right-click PowerShell → Run as Administrator" -ForegroundColor Gray
    exit 1
}

Write-Host "🔍 System detected: Windows" -ForegroundColor Green

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Gray
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Node.js not found. Installing..." -ForegroundColor Yellow
    
    # Download Node.js installer
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    Write-Host "📥 Downloading Node.js..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    
    Write-Host "📦 Installing Node.js..." -ForegroundColor Gray
    Start-Process msiexec.exe -Wait -ArgumentList "/i", $nodeInstaller, "/quiet"
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Remove-Item $nodeInstaller -Force
    Write-Host "✅ Node.js installed successfully" -ForegroundColor Green
}

# Check Git
Write-Host "Checking Git..." -ForegroundColor Gray
try {
    $gitVersion = git --version 2>$null
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Git not found. Installing..." -ForegroundColor Yellow
    
    # Download Git installer
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $gitInstaller = "$env:TEMP\git-installer.exe"
    
    Write-Host "📥 Downloading Git..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
    
    Write-Host "📦 Installing Git..." -ForegroundColor Gray
    Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT" -Wait
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Remove-Item $gitInstaller -Force
    Write-Host "✅ Git installed successfully" -ForegroundColor Green
}

# Set installation directory
$installDir = "$env:LOCALAPPDATA\ccpulse"
Write-Host "📁 Installation path: $installDir" -ForegroundColor Gray

# Check existing installation
if (Test-Path $installDir) {
    Write-Host "⚠️  Existing installation found." -ForegroundColor Yellow
    $response = Read-Host "Overwrite? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Installation cancelled." -ForegroundColor Red
        exit 0
    }
    Remove-Item -Path $installDir -Recurse -Force
}

# Clone repository
Write-Host "📥 Downloading latest version..." -ForegroundColor Gray
git clone https://github.com/renechoi/ccpulse.git $installDir 2>$null

Set-Location $installDir

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Gray
npm install --production

# Create desktop shortcut
Write-Host "🖥️  Creating desktop shortcut..." -ForegroundColor Gray
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcut = "$desktop\CCPulse.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcut)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -Command `"cd '$installDir'; npm start`""
$Shortcut.WorkingDirectory = $installDir
$Shortcut.IconLocation = "$installDir\icon.ico"
$Shortcut.Description = "CCPulse"
$Shortcut.Save()

# Create Start Menu shortcut
$startMenu = [Environment]::GetFolderPath("StartMenu")
$startMenuFolder = "$startMenu\Programs\CCPulse"
New-Item -ItemType Directory -Path $startMenuFolder -Force | Out-Null

$startShortcut = "$startMenuFolder\CCPulse.lnk"
$Shortcut = $WshShell.CreateShortcut($startShortcut)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -Command `"cd '$installDir'; npm start`""
$Shortcut.WorkingDirectory = $installDir
$Shortcut.IconLocation = "$installDir\icon.ico"
$Shortcut.Description = "CCPulse"
$Shortcut.Save()

# Add to PATH
Write-Host "🔧 Adding to PATH..." -ForegroundColor Gray
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "User")
    $env:Path = "$env:Path;$installDir"
}

# Create ccpulse.cmd command
$cmdContent = @"
@echo off
cd /d "$installDir"
npm start
"@
Set-Content -Path "$installDir\ccpulse.cmd" -Value $cmdContent

# Auto-start setup
Write-Host ""
Write-Host "Do you want to enable auto-start with Windows? (y/n)" -ForegroundColor Yellow -NoNewline
$autostart = Read-Host
if ($autostart -eq 'y') {
    $startupFolder = [Environment]::GetFolderPath("Startup")
    $startupShortcut = "$startupFolder\CCPulse.lnk"
    
    $Shortcut = $WshShell.CreateShortcut($startupShortcut)
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-WindowStyle Hidden -Command `"cd '$installDir'; npm start`""
    $Shortcut.WorkingDirectory = $installDir
    $Shortcut.IconLocation = "$installDir\icon.ico"
    $Shortcut.Description = "CCPulse"
    $Shortcut.Save()
    
    Write-Host "✅ Auto-start enabled" -ForegroundColor Green
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 Installation completed successfully!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "How to run:"
Write-Host "  1. Desktop shortcut: Double-click 'CCPulse'"
Write-Host "  2. Start Menu: Search 'CCPulse'"
Write-Host "  3. Command Prompt: ccpulse"
Write-Host ""
Write-Host "To uninstall:"
Write-Host "  Run: iwr -useb https://raw.githubusercontent.com/renechoi/ccpulse/main/uninstall.ps1 | iex"
Write-Host ""
Write-Host "Need help? https://github.com/renechoi/ccpulse/issues"
Write-Host ""

# Launch now?
Write-Host "Launch CCPulse now? (y/n)" -ForegroundColor Yellow -NoNewline
$launch = Read-Host
if ($launch -eq 'y') {
    Start-Process powershell -ArgumentList "-Command", "cd '$installDir'; npm start" -WindowStyle Hidden
    Write-Host "✨ CCPulse is running!" -ForegroundColor Green
}