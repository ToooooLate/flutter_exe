[CmdletBinding()]
param(
    # Optional offline copy of the CAB pinned in webview2-runtime.json.
    [string]$CabPath = $env:WEBVIEW2_FIXED_CAB
)
$ErrorActionPreference = 'Stop'
# Windows PowerShell progress rendering is expensive for large downloads.
$ProgressPreference = 'SilentlyContinue'
Set-StrictMode -Version Latest
$project = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $PSScriptRoot 'webview2-runtime.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$cache = Join-Path $project '.webview2'
New-Item -ItemType Directory -Force -Path $cache | Out-Null

if (!$CabPath) {
    $CabPath = Join-Path $cache "WebView2-$($manifest.version)-$($manifest.architecture).cab"
    if (!(Test-Path -LiteralPath $CabPath)) {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $partial = "$CabPath.partial"
        try {
            Write-Host "Downloading fixed WebView2 $($manifest.version) ($($manifest.architecture))..."
            Invoke-WebRequest -UseBasicParsing -Uri $manifest.url -OutFile $partial
            Move-Item -LiteralPath $partial -Destination $CabPath -Force
        } finally {
            if (Test-Path -LiteralPath $partial) { Remove-Item -LiteralPath $partial -Force }
        }
    }
}
$CabPath = (Resolve-Path -LiteralPath $CabPath).Path
Write-Host "Verifying WebView2 CAB: $CabPath"
if ((Get-FileHash -LiteralPath $CabPath -Algorithm SHA256).Hash -ne $manifest.sha256) {
    throw "WebView2 CAB SHA256 mismatch: $CabPath. Remove the cached CAB or supply the pinned offline CAB."
}

# Extract afresh to avoid mixing files from different runtime versions.
$staging = Join-Path $cache ([Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $staging | Out-Null
try {
    Write-Host 'Extracting fixed WebView2 runtime...'
    & "$env:SystemRoot\System32\expand.exe" $CabPath '-F:*' $staging | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to extract fixed WebView2 CAB.' }
    $executables = @(Get-ChildItem -LiteralPath $staging -Filter msedgewebview2.exe -Recurse)
    if ($executables.Count -ne 1) { throw 'Expected exactly one WebView2 runtime in CAB.' }
    $source = $executables[0].Directory.FullName
    if ($executables[0].VersionInfo.FileVersion -ne $manifest.version) {
        throw 'Extracted WebView2 version does not match manifest.'
    }
    foreach ($file in @('msedge.dll', 'icudtl.dat', 'resources.pak', 'locales\en-US.pak')) {
        if (!(Test-Path -LiteralPath (Join-Path $source $file) -PathType Leaf)) {
            throw "Incomplete WebView2 runtime: $file"
        }
    }
    $destination = Join-Path $cache 'runtime'
    if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Recurse -Force }
    Move-Item -LiteralPath $source -Destination $destination
    Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $destination 'runtime-manifest.json')
    Write-Host "Prepared WebView2 $($manifest.version) ($($manifest.architecture)): $destination"
} finally {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
