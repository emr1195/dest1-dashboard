[CmdletBinding()]
param(
  [string]$ProjectRoot
)

$ErrorActionPreference = "Stop"

if (-not $ProjectRoot) {
  $ProjectRoot = Split-Path -Parent $PSScriptRoot
}

$envFile = Join-Path $ProjectRoot ".env.neon.local"
$backupDir = Join-Path $ProjectRoot "backups"
$logFile = Join-Path $backupDir "backup.log"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

function Write-BackupLog {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $logFile -Value "[$timestamp] $Message" -Encoding UTF8
}

function Find-PostgresTool {
  param([string]$ToolName)

  $command = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $installRoot = "C:\Program Files\PostgreSQL"
  if (Test-Path -LiteralPath $installRoot) {
    $tool = Get-ChildItem -LiteralPath $installRoot -Recurse -Filter "$ToolName.exe" -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending |
      Select-Object -First 1
    if ($tool) {
      return $tool.FullName
    }
  }

  throw "No se encontro $ToolName. Instala las herramientas de PostgreSQL."
}

$previousPassword = $env:PGPASSWORD
$previousSslMode = $env:PGSSLMODE
$previousChannelBinding = $env:PGCHANNELBINDING
$partialPath = $null

try {
  if (-not (Test-Path -LiteralPath $envFile)) {
    throw "No existe $envFile."
  }

  $connectionLine = Get-Content -LiteralPath $envFile |
    Where-Object { $_ -like "DATABASE_URL=*" } |
    Select-Object -First 1
  if (-not $connectionLine) {
    throw "DATABASE_URL no esta configurada en $envFile."
  }

  $connectionString = $connectionLine.Substring("DATABASE_URL=".Length).Trim().Trim('"').Trim("'")
  $uri = [System.Uri]$connectionString
  $userInfo = $uri.UserInfo.Split(':', 2)
  if ($userInfo.Count -ne 2) {
    throw "DATABASE_URL no contiene usuario y contrasena."
  }

  $databaseUser = [System.Uri]::UnescapeDataString($userInfo[0])
  $env:PGPASSWORD = [System.Uri]::UnescapeDataString($userInfo[1])
  $env:PGSSLMODE = "require"
  $env:PGCHANNELBINDING = "require"

  $databaseName = $uri.AbsolutePath.TrimStart('/')
  $databasePort = if ($uri.IsDefaultPort) { 5432 } else { $uri.Port }
  $pgDump = Find-PostgresTool "pg_dump"
  $pgRestore = Find-PostgresTool "pg_restore"

  $fileTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $finalPath = Join-Path $backupDir "neon-$fileTimestamp.backup"
  $partialPath = "$finalPath.partial"

  Write-BackupLog "Iniciando respaldo de $($uri.Host)/$databaseName."

  & $pgDump `
    --format=custom `
    --compress=6 `
    --no-owner `
    --no-privileges `
    --host=$($uri.Host) `
    --port=$databasePort `
    --username=$databaseUser `
    --dbname=$databaseName `
    --file=$partialPath 2>> $logFile

  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump termino con codigo $LASTEXITCODE."
  }

  & $pgRestore --list $partialPath *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "La validacion del respaldo termino con codigo $LASTEXITCODE."
  }

  Move-Item -LiteralPath $partialPath -Destination $finalPath
  $partialPath = $null

  $sizeMb = [math]::Round((Get-Item -LiteralPath $finalPath).Length / 1MB, 2)
  Write-BackupLog "Respaldo completado: $finalPath ($sizeMb MB)."
  Write-Output $finalPath
} catch {
  Write-BackupLog "ERROR: $($_.Exception.Message)"
  throw
} finally {
  if ($partialPath -and (Test-Path -LiteralPath $partialPath)) {
    Remove-Item -LiteralPath $partialPath -Force
  }

  $env:PGPASSWORD = $previousPassword
  $env:PGSSLMODE = $previousSslMode
  $env:PGCHANNELBINDING = $previousChannelBinding
}
