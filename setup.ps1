# One-command local setup for the real estate marketplace monorepo (Windows / PowerShell).
#
# Usage (from PowerShell, in the repo root):
#   .\setup.ps1                # fresh database via migrations + seed (default)
#   .\setup.ps1 -FromDump      # restore database-dump.sql instead
#
# If script execution is blocked, run once per session:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# Safe to re-run: DB user/database creation is skipped if they already
# exist, and env files are only copied if they aren't already there.

param(
    [switch]$FromDump
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

$DbName = "marketplace_dev"
$DbUser = "marketplace"
$DbPassword = "marketplace_dev"

function Info($msg) { Write-Host "`n▸ $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function WarnMsg($msg) { Write-Host "  [!] $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
Info "Checking prerequisites"

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command node)) { Write-Error "Node.js not found — install Node 22.x first: https://nodejs.org"; exit 1 }
if (-not (Test-Command npm))  { Write-Error "npm not found (should ship with Node)"; exit 1 }
if (-not (Test-Command psql)) { Write-Error "PostgreSQL client (psql) not found — install PostgreSQL 16.x first: https://www.postgresql.org/download/windows/ (make sure to add its bin folder to PATH)"; exit 1 }

$nodeVersion = node -v
$npmVersion = npm -v
$psqlVersion = (psql --version)
Ok "node $nodeVersion, npm $npmVersion, $psqlVersion"

# ---------------------------------------------------------------------------
Info "Installing dependencies (npm workspaces — one install for all apps)"
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }
Ok "dependencies installed"

# ---------------------------------------------------------------------------
Info "Setting up PostgreSQL database"

# The Windows PostgreSQL installer creates a "postgres" superuser with the
# password you set at install time — psql will prompt for it interactively
# if it isn't cached. That's expected the first time you run this.
$env:PGPASSWORD = $null
$adminOk = $false
try {
    psql -U postgres -c "SELECT 1" *> $null
    if ($LASTEXITCODE -eq 0) { $adminOk = $true }
} catch {}

if (-not $adminOk) {
    WarnMsg "Couldn't connect to PostgreSQL as 'postgres' non-interactively."
    Write-Host "  If you're prompted for a password above and it still fails, create the"
    Write-Host "  role and database manually, then re-run this script:"
    Write-Host "    psql -U postgres -c `"CREATE USER $DbUser WITH PASSWORD '$DbPassword' CREATEDB;`""
    Write-Host "    psql -U postgres -c `"CREATE DATABASE $DbName OWNER $DbUser;`""
    exit 1
}

$roleExists = (psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DbUser'").Trim()
if ($roleExists -eq "1") {
    Ok "role '$DbUser' already exists"
} else {
    psql -U postgres -c "CREATE USER $DbUser WITH PASSWORD '$DbPassword' CREATEDB;"
    Ok "created role '$DbUser'"
}

$dbExists = (psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'").Trim()
if ($dbExists -eq "1") {
    Ok "database '$DbName' already exists"
} else {
    psql -U postgres -c "CREATE DATABASE $DbName OWNER $DbUser;"
    Ok "created database '$DbName'"
}

# ---------------------------------------------------------------------------
Info "Configuring environment files"

function Copy-EnvFile($ExamplePath, $TargetPath) {
    if (Test-Path $TargetPath) {
        Ok "$TargetPath already exists, leaving it as-is"
    } else {
        Copy-Item $ExamplePath $TargetPath
        Ok "created $TargetPath"
    }
}
Copy-EnvFile "apps\api\.env.example"    "apps\api\.env"
Copy-EnvFile "apps\web\.env.example"    "apps\web\.env.local"
Copy-EnvFile "apps\mobile\.env.example" "apps\mobile\.env"

# ---------------------------------------------------------------------------
Info "Preparing the database schema"
Set-Location "$RootDir\apps\api"
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit 1 }

# Schema always comes from migrations, whichever data path is chosen below —
# database-dump.sql is data-only (see database-dump.sql itself / LOCAL_SETUP.md).
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit 1 }

if ($FromDump) {
    $dumpPath = "$RootDir\database-dump.sql"
    if (-not (Test-Path $dumpPath)) {
        Write-Error "database-dump.sql not found at repo root — cannot restore from dump."
        exit 1
    }
    $env:PGPASSWORD = $DbPassword
    psql -h localhost -U $DbUser -d $DbName -f $dumpPath
    Remove-Item Env:\PGPASSWORD
    Ok "restored database-dump.sql"
} else {
    npx prisma db seed
    Ok "ran migrations + seed"
}
Set-Location $RootDir

# ---------------------------------------------------------------------------
Info "Done — start the app in three separate terminals:"
Write-Host @"

  cd apps\api; npm run start:dev       # http://localhost:4000  (docs at /docs)
  npm run dev:web                      # http://localhost:3000
  npm run dev:mobile                   # Expo dev tools

"@
Info "Seeded login (password for all: DevPass123!)"
Write-Host @"

  Admin:    +920000000001
  Dealer:   +920000000002  (Ahmed - City Realty)
  Dealer:   +920000000003  (Sara - Prime Homes)
  Customer: +920000000004  (Bilal Khan)

"@
Write-Host "See LOCAL_SETUP.md for the full walkthrough and known limitations."
