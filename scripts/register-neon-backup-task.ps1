[CmdletBinding()]
param(
  [string]$TaskName = "ER-Destacamento-Neon-Backup"
)

$ErrorActionPreference = "Stop"
Import-Module ScheduledTasks

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupScript = Join-Path $PSScriptRoot "backup-neon.ps1"
$powershellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Test-Path -LiteralPath $backupScript)) {
  throw "No existe $backupScript."
}

$action = New-ScheduledTaskAction `
  -Execute $powershellPath `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`"" `
  -WorkingDirectory $projectRoot

$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 5 -At "2:00 AM"
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Respaldo validado de Neon cada cinco dias." `
  -Force | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName

[PSCustomObject]@{
  TaskName = $task.TaskName
  State = $task.State
  NextRunTime = $info.NextRunTime
  LastRunTime = $info.LastRunTime
  LastTaskResult = $info.LastTaskResult
}
