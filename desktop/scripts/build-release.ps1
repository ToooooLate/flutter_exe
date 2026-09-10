[CmdletBinding()]
param([switch]$SkipRuntimePreparation)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
# Flutter 3.32 selects the target architecture from the host, not a CLI flag.
if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') {
    throw 'Build this x64 release in a Windows x64 PowerShell environment.'
}
$project = Split-Path $PSScriptRoot -Parent
Push-Location $project
try {
    if (!$SkipRuntimePreparation) { & "$PSScriptRoot\prepare-webview2.ps1" }
    & flutter config --enable-windows-desktop
    if ($LASTEXITCODE -ne 0) { throw 'Flutter configuration failed.' }
    & flutter pub get
    if ($LASTEXITCODE -ne 0) { throw 'Flutter dependency resolution failed.' }
    & dart test/scripts/check_bundled_webview2.dart
    if ($LASTEXITCODE -ne 0) { throw 'WebView2 startup tests failed.' }
    & flutter build windows --release
    if ($LASTEXITCODE -ne 0) { throw 'Flutter Windows build failed.' }

    $build = Join-Path $project 'build\windows\x64\runner\Release'
    if (!(Test-Path -LiteralPath $build)) { throw "Build output not found: $build" }
    & "$PSScriptRoot\verify-windows-bundle.ps1" -BundlePath $build
    $releases = Join-Path $project 'releases'
    New-Item -ItemType Directory -Force -Path $releases | Out-Null
    $name = 'qingzhi-desktop-windows-x64-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
    $archive = Join-Path $releases "$name.zip"
    Compress-Archive -Path "$build\*" -DestinationPath $archive
    Write-Host "Release ready: $archive"
    Write-Host ('ZIP: {0:N1} MiB' -f ((Get-Item -LiteralPath $archive).Length / 1MB))
    Write-Host 'Extract the whole ZIP to a local user-writable folder. WebView2 is included.'
} finally {
    Pop-Location
}
