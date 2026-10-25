$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $Root

$LogDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$SetupLog = Join-Path $LogDir "setup-$Timestamp.log"
$BackendOutLog = Join-Path $LogDir "backend-$Timestamp.out.log"
$BackendErrLog = Join-Path $LogDir "backend-$Timestamp.err.log"
$FrontendOutLog = Join-Path $LogDir "frontend-$Timestamp.out.log"
$FrontendErrLog = Join-Path $LogDir "frontend-$Timestamp.err.log"
$ServiceState = Join-Path $LogDir "active-services-$Timestamp.json"

$script:Npm = $null
$script:Python = $null
$script:PythonArgs = @()
$script:VenvPython = $null
$script:StartedProcesses = @()
$script:BackendProcessId = $null
$script:FrontendProcessId = $null
$script:TranscriptStarted = $false
$env:NEXT_TELEMETRY_DISABLED = "1"

function Write-Step {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Ok {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warn {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Resolve-Executable {
    param([Parameter(Mandatory)][string[]]$Names)
    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($null -ne $command) { return $command.Source }
    }
    return $null
}

function Invoke-CapturedVersion {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$Arguments
    )
    try {
        $value = & $FilePath @Arguments 2>$null | Select-Object -First 1
        if ($null -eq $value) { return $null }
        return $value.ToString().Trim()
    }
    catch {
        return $null
    }
}

function Invoke-Native {
    param(
        [Parameter(Mandatory)][string]$Label,
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$Arguments
    )

    Write-Step $Label
    Write-Host "> $FilePath $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $FilePath @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

function Test-Port {
    param([Parameter(Mandatory)][int]$Port)

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $task = $client.ConnectAsync("127.0.0.1", $Port)
        return $task.Wait(350)
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Invoke-HttpJson {
    param([Parameter(Mandatory)][string]$Uri)

    try {
        return Invoke-RestMethod -Uri $Uri -Method Get -TimeoutSec 5
    }
    catch {
        return $null
    }
}

function Test-BackendHealth {
    $health = Invoke-HttpJson "http://127.0.0.1:8000/api/health"
    if ($null -eq $health) { return $false }

    return (
        $health.service -eq "retail-sales-intelligence" -and
        $health.status -eq "ok" -and
        [int]$health.rows -eq 10194
    )
}

function Test-FrontendHealth {
    try {
        $response = Invoke-WebRequest `
            -Uri "http://127.0.0.1:3000/command-center" `
            -UseBasicParsing `
            -TimeoutSec 5

        if ($response.StatusCode -ne 200) { return $false }
        if ($response.Content -match "Internal Server Error") { return $false }
        if ($response.Content -notmatch "Command Center|Retail Intelligence") { return $false }
        return $true
    }
    catch {
        return $false
    }
}

function Wait-Backend {
    param([int]$Attempts = 120)

    for ($i = 1; $i -le $Attempts; $i++) {
        if (Test-BackendHealth) { return $true }
        Start-Sleep -Seconds 1
    }

    return $false
}

function Wait-Frontend {
    param([int]$Attempts = 120)

    for ($i = 1; $i -le $Attempts; $i++) {
        if (Test-FrontendHealth) { return $true }
        Start-Sleep -Seconds 1
    }

    return $false
}

function Ensure-NodeAndNpm {
    Write-Step "Checking Node.js and npm"

    $nodePath = Resolve-Executable @("node.exe", "node")
    if ($null -eq $nodePath) {
        throw "Node.js was not found. Install Node.js 24.21.x LTS."
    }

    $nodeVersion = Invoke-CapturedVersion $nodePath @("--version")
    if ($null -eq $nodeVersion -or $nodeVersion -notmatch '^v24\.21\.\d+$') {
        throw "Node.js 24.21.x is required. Detected: $nodeVersion."
    }

    $npmPath = Resolve-Executable @("npm.cmd", "npm.exe", "npm.ps1", "npm")
    if ($null -eq $npmPath) {
        $nodeDirectory = Split-Path -Parent $nodePath
        foreach ($candidate in @("npm.cmd", "npm.exe", "npm.ps1")) {
            $fullCandidate = Join-Path $nodeDirectory $candidate
            if (Test-Path -LiteralPath $fullCandidate -PathType Leaf) {
                $npmPath = $fullCandidate
                break
            }
        }
    }

    if ($null -eq $npmPath) {
        throw "npm was not found next to Node.js. Repair/reinstall Node.js 24.21.x."
    }

    $npmVersion = Invoke-CapturedVersion $npmPath @("--version")
    if ($null -eq $npmVersion -or $npmVersion -notmatch '^11\.19\.\d+$') {
        throw "npm 11.19.x is required. Detected: $npmVersion."
    }

    $script:Npm = $npmPath
    Write-Ok "Node: $nodeVersion"
    Write-Ok "npm:  $npmVersion"
    Write-Ok "npm path: $npmPath"
}

function Ensure-Python313 {
    Write-Step "Checking Python 3.13"

    $launcher = Resolve-Executable @("py.exe", "py")
    if ($null -ne $launcher) {
        $candidate = Invoke-CapturedVersion $launcher @("-3.13", "--version")
        if ($null -ne $candidate -and $candidate -match '^Python 3\.13\.') {
            $script:Python = $launcher
            $script:PythonArgs = @("-3.13")
            Write-Ok $candidate
            return
        }
    }

    $pythonPath = Resolve-Executable @("python.exe", "python")
    if ($null -ne $pythonPath) {
        $candidate = Invoke-CapturedVersion $pythonPath @("--version")
        if ($null -ne $candidate -and $candidate -match '^Python 3\.13\.') {
            $script:Python = $pythonPath
            $script:PythonArgs = @()
            Write-Ok $candidate
            return
        }
    }

    throw "Python 3.13.x is required. Install Python 3.13."
}

function Ensure-RequiredFiles {
    Write-Step "Checking project files"

    $required = @(
        ".env.example",
        "package.json",
        "tsconfig.json",
        "biome.json",
        "components.json",
        "backend\requirements.txt",
        "backend\requirements-lock.txt",
        "backend\app\main.py",
        "data\source\sample_-_superstore.xlsx",
        "data\processed\superstore_processed.csv",
        "scripts\verify_data.py",
        "scripts\verify_truth.py",
        "scripts\verify_python_environment.py",
        "scripts\verify_frontend_static.mjs",
        "scripts\verify_local_imports.mjs",
        "scripts\verify_toolchain.py"
    )

    foreach ($relative in $required) {
        $fullPath = Join-Path $Root $relative
        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            throw "Required project file is missing: $relative"
        }
    }

    Write-Ok "Required project files: PASS"
}

function Ensure-EnvironmentFiles {
    Write-Step "Preparing environment files"

    if (-not (Test-Path -LiteralPath ".env.local" -PathType Leaf)) {
        Copy-Item -LiteralPath ".env.example" -Destination ".env.local"
        Write-Host "Created .env.local from .env.example."
    }
    else {
        Write-Host ".env.local already exists; leaving it unchanged."
    }

    $backendEnv = Join-Path $Root "backend\.env"
    if (-not (Test-Path -LiteralPath $backendEnv -PathType Leaf)) {
        Copy-Item -LiteralPath "backend\.env.example" -Destination $backendEnv
        Write-Host "Created backend\.env from backend\.env.example."
    }
    else {
        Write-Host "backend\.env already exists; leaving it unchanged."
    }
}

function Ensure-PythonEnvironment {
    Write-Step "Preparing Python virtual environment"

    $venvDir = Join-Path $Root "backend\.venv"
    $venvPython = Join-Path $venvDir "Scripts\python.exe"
    $valid = $false

    if (Test-Path -LiteralPath $venvPython -PathType Leaf) {
        $version = Invoke-CapturedVersion $venvPython @("--version")
        $valid = $null -ne $version -and $version -match '^Python 3\.13\.'

        if (-not $valid) {
            Write-Warn "Existing backend\.venv is $version; recreating it for Python 3.13.x."
            Remove-Item -LiteralPath $venvDir -Recurse -Force
        }
    }

    if (-not $valid) {
        Invoke-Native `
            "Creating backend virtual environment" `
            $script:Python `
            ($script:PythonArgs + @("-m", "venv", "backend\.venv"))
    }

    $script:VenvPython = $venvPython

    $lock = Join-Path $Root "backend\requirements-lock.txt"
    Invoke-Native `
        "Installing pinned Python dependencies" `
        $script:VenvPython `
        @("-m", "pip", "install", "--disable-pip-version-check", "-r", $lock)

    Invoke-Native `
        "Checking Python dependency consistency" `
        $script:VenvPython `
        @("-m", "pip", "check")

    Invoke-Native `
        "Verifying exact Python environment" `
        $script:VenvPython `
        @("scripts\verify_python_environment.py")
}


function Test-LockfileDirectDependenciesMatch {
    param([Parameter(Mandatory)][string]$LockfilePath)

    try {
        $packageJson = Get-Content -LiteralPath (Join-Path $Root "package.json") -Raw | ConvertFrom-Json
        $lockJson = Get-Content -LiteralPath $LockfilePath -Raw | ConvertFrom-Json
        $rootPackage = $lockJson.packages.""

        if ($null -eq $rootPackage) { return $false }

        foreach ($bucket in @("dependencies", "devDependencies")) {
            $expected = @{}
            $actual = @{}

            $packageBucket = $packageJson.$bucket
            $lockBucket = $rootPackage.$bucket

            if ($null -ne $packageBucket) {
                foreach ($property in $packageBucket.PSObject.Properties) {
                    $expected[$property.Name] = [string]$property.Value
                }
            }

            if ($null -ne $lockBucket) {
                foreach ($property in $lockBucket.PSObject.Properties) {
                    $actual[$property.Name] = [string]$property.Value
                }
            }

            if ($expected.Count -ne $actual.Count) { return $false }

            foreach ($name in $expected.Keys) {
                if (-not $actual.ContainsKey($name)) { return $false }
                if ($actual[$name] -ne $expected[$name]) { return $false }
            }
        }

        return $true
    }
    catch {
        return $false
    }
}

function Install-FrontendDependencies {
    Write-Step "Installing frontend dependencies"

    $lockfile = Join-Path $Root "package-lock.json"

    if (Test-Path -LiteralPath $lockfile -PathType Leaf) {
        if (-not (Test-LockfileDirectDependenciesMatch -LockfilePath $lockfile)) {
            $backup = Join-Path $LogDir "package-lock.stale-$Timestamp.json"
            Move-Item -LiteralPath $lockfile -Destination $backup -Force
            Write-Warn "package-lock.json does not match package.json; moved stale lockfile to $backup."
            Write-Warn "A fresh lockfile will be generated with the approved npm baseline."
        }
    }

    if (Test-Path -LiteralPath $lockfile -PathType Leaf) {
        Invoke-Native `
            "npm ci" `
            $script:Npm `
            @("ci", "--no-audit", "--fund=false")
    }
    else {
        Invoke-Native `
            "npm install" `
            $script:Npm `
            @("install", "--no-audit", "--fund=false")
    }

    if (-not (Test-Path -LiteralPath $lockfile -PathType Leaf)) {
        throw "Frontend dependency installation completed but package-lock.json is missing."
    }

    $requiredBins = @(
        "node_modules\.bin\biome.cmd",
        "node_modules\.bin\next.cmd",
        "node_modules\.bin\tsc.cmd"
    )

    foreach ($relative in $requiredBins) {
        if (-not (Test-Path -LiteralPath (Join-Path $Root $relative) -PathType Leaf)) {
            throw "Frontend dependency installation completed but required executable is missing: $relative"
        }
    }
}

function Start-Backend {
    Write-Step "Starting FastAPI"

    if (Test-Port 8000) {
        if (Test-BackendHealth) {
            Write-Warn "Port 8000 already serves this project's healthy backend; reusing it."
            $script:BackendProcessId = $null
            return
        }

        throw "Port 8000 is occupied by another service."
    }

    $process = Start-Process `
        -FilePath $script:VenvPython `
        -ArgumentList @(
            "-m",
            "uvicorn",
            "backend.app.main:app",
            "--reload",
            "--host",
            "127.0.0.1",
            "--port",
            "8000"
        ) `
        -WorkingDirectory $Root `
        -RedirectStandardOutput $BackendOutLog `
        -RedirectStandardError $BackendErrLog `
        -WindowStyle Hidden `
        -PassThru

    $script:StartedProcesses += $process
    $script:BackendProcessId = $process.Id
    Write-Host "FastAPI PID: $($process.Id)"
    Write-Host "FastAPI stdout: $BackendOutLog"
    Write-Host "FastAPI stderr: $BackendErrLog"
}

function Start-Frontend {
    Write-Step "Starting Next.js development server"

    if (Test-Port 3000) {
        if (Test-FrontendHealth) {
            Write-Warn "Port 3000 already serves a healthy Retail Intelligence frontend; reusing it."
            $script:FrontendProcessId = $null
            return
        }

        throw "Port 3000 is occupied by another service."
    }

    $process = Start-Process `
        -FilePath $script:Npm `
        -ArgumentList @("run", "dev") `
        -WorkingDirectory $Root `
        -RedirectStandardOutput $FrontendOutLog `
        -RedirectStandardError $FrontendErrLog `
        -WindowStyle Hidden `
        -PassThru

    $script:StartedProcesses += $process
    $script:FrontendProcessId = $process.Id
    Write-Host "Next.js PID: $($process.Id)"
    Write-Host "Next.js stdout: $FrontendOutLog"
    Write-Host "Next.js stderr: $FrontendErrLog"
}

function Save-ServiceState {
    $state = [ordered]@{
        created = (Get-Date).ToString("o")
        repository = $Root
        backend = $script:BackendProcessId
        frontend = $script:FrontendProcessId
        backend_started_by_setup = $null -ne $script:BackendProcessId
        frontend_started_by_setup = $null -ne $script:FrontendProcessId
        dashboard_url = "http://localhost:3000/command-center"
        api_docs_url = "http://127.0.0.1:8000/docs"
        backend_log = $BackendOutLog
        backend_error_log = $BackendErrLog
        frontend_log = $FrontendOutLog
        frontend_error_log = $FrontendErrLog
    }

    $state | ConvertTo-Json | Set-Content -LiteralPath $ServiceState -Encoding utf8
}

function Stop-StartedProcesses {
    foreach ($process in $script:StartedProcesses) {
        try {
            if ($null -ne $process -and -not $process.HasExited) {
                & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
            }
        }
        catch {
            # Best-effort cleanup only.
        }
    }

    $script:StartedProcesses = @()
    $script:BackendProcessId = $null
    $script:FrontendProcessId = $null
}

try {
    Start-Transcript -Path $SetupLog -Force | Out-Null
    $script:TranscriptStarted = $true

    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "      RETAIL SALES INTELLIGENCE - ONE CLICK SETUP" -ForegroundColor Cyan
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "Repository: $Root"
    Write-Host "Setup log:  $SetupLog"

    # Keep the logs directory useful without allowing an unbounded build-up.
    Get-ChildItem -LiteralPath $LogDir -Filter "setup-*.log" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
        Remove-Item -Force -ErrorAction SilentlyContinue

    Ensure-RequiredFiles
    Ensure-NodeAndNpm
    Ensure-Python313
    Ensure-EnvironmentFiles
    Ensure-PythonEnvironment
    Install-FrontendDependencies

    Invoke-Native "Repository doctor" $script:Npm @("run", "doctor")
    Invoke-Native "Frontend toolchain contract" $script:VenvPython @("scripts\verify_toolchain.py")
    Invoke-Native "Data verification" $script:VenvPython @("scripts\verify_data.py")
    Invoke-Native "Analytical truth gate" $script:VenvPython @("scripts\verify_truth.py")
    Invoke-Native "Python test suite" $script:VenvPython @("-m", "pytest", "-q")

    # Auto-format first so a fresh clone never fails only because files are unformatted.
    Invoke-Native "Frontend auto-format" $script:Npm @("run", "format")
    Invoke-Native "Frontend format check" $script:Npm @("run", "format:check")
    Invoke-Native "Frontend checks" $script:Npm @("run", "check")
    Invoke-Native "Production build" $script:Npm @("run", "build")
    Invoke-Native "Production dependency audit" $script:Npm @("run", "audit:prod")

    Start-Backend
    Start-Frontend
    Save-ServiceState

    Write-Step "Checking live services"

    if (-not (Wait-Backend)) {
        throw "FastAPI did not become healthy within 120 seconds. Inspect $BackendOutLog and $BackendErrLog."
    }

    Write-Ok "FastAPI health: PASS"

    if (-not (Wait-Frontend)) {
        throw "Next.js did not serve a healthy /command-center page within 120 seconds. Inspect $FrontendOutLog and $FrontendErrLog."
    }

    Write-Ok "Next.js health: PASS"

    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host "SETUP: PASS" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host "Dashboard: http://localhost:3000/command-center"
    Write-Host "API docs:  http://127.0.0.1:8000/docs"
    Write-Host "Logs:      $LogDir"

    Start-Process "http://localhost:3000/command-center" | Out-Null
}
catch {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Red
    Write-Host "SETUP: FAIL" -ForegroundColor Red
    Write-Host "===============================================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Setup log: $SetupLog" -ForegroundColor Yellow
    Write-Host "Service logs: $LogDir" -ForegroundColor Yellow
    Stop-StartedProcesses
    Remove-Item -LiteralPath $ServiceState -Force -ErrorAction SilentlyContinue
    exit 1
}
finally {
    if ($script:TranscriptStarted) {
        try { Stop-Transcript | Out-Null } catch { }
    }
}
