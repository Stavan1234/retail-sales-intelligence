$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

$root = (Get-Location).Path
$logDir = Join-Path $root "logs"
$files = Get-ChildItem -LiteralPath $logDir -Filter "active-services-*.json" -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending

if (-not $files) {
    Write-Host "No active setup service-state file was found." -ForegroundColor Yellow
    exit 0
}

$stateFile = $files[0].FullName
$state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json

if ($state.repository -ne $root) {
    Write-Host "The newest service-state file belongs to another repository checkout; refusing to kill those processes." -ForegroundColor Yellow
    Write-Host "State: $($state.repository)" -ForegroundColor Yellow
    Write-Host "Here:  $root" -ForegroundColor Yellow
    exit 1
}

$stopped = 0
foreach ($pidValue in @($state.backend, $state.frontend)) {
    if ($null -eq $pidValue) { continue }

    $pidInt = [int]$pidValue
    if ($pidInt -le 0) { continue }

    try {
        $process = Get-Process -Id $pidInt -ErrorAction SilentlyContinue
        if ($null -ne $process) {
            & taskkill.exe /PID $pidInt /T /F 2>$null | Out-Null
            $stopped++
        }
    }
    catch {
        # Best-effort shutdown only.
    }
}

Remove-Item -LiteralPath $stateFile -Force -ErrorAction SilentlyContinue
Write-Host "Retail Sales Intelligence services stopped ($stopped process tree(s))." -ForegroundColor Green
