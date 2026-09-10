[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$BundlePath)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$manifest = Get-Content -LiteralPath "$PSScriptRoot\webview2-runtime.json" -Raw | ConvertFrom-Json
foreach ($file in @('qingzhi_desktop.exe', 'flutter_windows.dll', 'WebView2Loader.dll', 'data\icudtl.dat',
    'data\app.so', 'WebView2\msedgewebview2.exe', 'WebView2\msedge.dll',
    'WebView2\icudtl.dat', 'WebView2\resources.pak', 'WebView2\locales\en-US.pak',
    'WebView2\runtime-manifest.json')) {
    if (!(Test-Path -LiteralPath (Join-Path $BundlePath $file) -PathType Leaf)) {
        throw "Release bundle missing: $file"
    }
}
$runtime = Join-Path $BundlePath 'WebView2'
$exe = Get-Item -LiteralPath (Join-Path $runtime 'msedgewebview2.exe')
if ($exe.VersionInfo.FileVersion -ne $manifest.version) { throw 'Wrong bundled WebView2 version.' }
$packaged = Get-Content -LiteralPath (Join-Path $runtime 'runtime-manifest.json') -Raw | ConvertFrom-Json
if ($packaged.sha256 -ne $manifest.sha256) { throw 'Wrong bundled WebView2 manifest.' }
$bytes = (Get-ChildItem -LiteralPath $runtime -File -Recurse | Measure-Object -Property Length -Sum).Sum
Write-Host ('Verified fixed WebView2 {0}; runtime disk size: {1:N1} MiB' -f $manifest.version, ($bytes / 1MB))

# Exercise the actual SDK loader against the bundled runtime (not the system).
if (!('Qingzhi.WebView2Probe' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace Qingzhi {
    public static class WebView2Probe {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern IntPtr LoadLibraryW(string path);
        [DllImport("WebView2Loader.dll", CharSet = CharSet.Unicode)]
        public static extern int GetAvailableCoreWebView2BrowserVersionString(
            string browserExecutableFolder, out IntPtr versionInfo);
    }
}
'@
}
$loader = Join-Path (Resolve-Path -LiteralPath $BundlePath).Path 'WebView2Loader.dll'
if ([Qingzhi.WebView2Probe]::LoadLibraryW($loader) -eq [IntPtr]::Zero) {
    throw "Cannot load bundled WebView2Loader.dll: $([Runtime.InteropServices.Marshal]::GetLastWin32Error())"
}
$versionPointer = [IntPtr]::Zero
# Explicit environment overrides must not point the probe to a system browser.
$oldRuntime = $env:WEBVIEW2_BROWSER_EXECUTABLE_FOLDER
try {
    $env:WEBVIEW2_BROWSER_EXECUTABLE_FOLDER = (Resolve-Path -LiteralPath $runtime).Path
    $hr = [Qingzhi.WebView2Probe]::GetAvailableCoreWebView2BrowserVersionString(
        $env:WEBVIEW2_BROWSER_EXECUTABLE_FOLDER, [ref]$versionPointer)
    if ($hr -ne 0) { throw "Bundled WebView2 detection failed (HRESULT $hr)." }
    $detected = [Runtime.InteropServices.Marshal]::PtrToStringUni($versionPointer)
    if ($detected -ne $manifest.version) { throw "Unexpected runtime detected: $detected" }
    Write-Host "SDK loader detected bundled runtime: $detected"
} finally {
    if ($versionPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::FreeCoTaskMem($versionPointer)
    }
    $env:WEBVIEW2_BROWSER_EXECUTABLE_FOLDER = $oldRuntime
}
