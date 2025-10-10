# scripts/move-routes-to-pages.ps1
param(
  [string]$Source = "src/routes",
  [string]$Target = "src/pages"
)
if (Test-Path $Target) {
  Write-Host "Target $Target already exists. Aborting." -ForegroundColor Red
  exit 1
}
if (-Not (Test-Path $Source)) {
  Write-Host "Source $Source not found. Aborting." -ForegroundColor Red
  exit 1
}
Rename-Item -Path $Source -NewName ([System.IO.Path]::GetFileName($Target))
Write-Host "Renamed $Source -> $Target" -ForegroundColor Green
