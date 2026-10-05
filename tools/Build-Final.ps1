param([Parameter(Mandatory=$true)][string]$InputFile,[Parameter(Mandatory=$true)][string]$Payload)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$stage=Split-Path $root -Parent
$env:PATH="$stage\runtime\node-v22.23.3-win-x64;$env:PATH"
$env:CSC_IDENTITY_AUTO_DISCOVERY='false'
$data=Get-Content -Raw -Encoding UTF8 $InputFile|ConvertFrom-Json
& C:\Chacademi\tools\python\python.exe "$PSScriptRoot\build-distribution.py" $InputFile $Payload "$stage\release-output"
if($LASTEXITCODE){throw 'Final integration, privacy, license or hash gate failed'}
$id=$data.microsoftClientId
$authPath="$root\app\assets\js\ipcconstants.js"
$text=[IO.File]::ReadAllText($authPath)
$text=[regex]::Replace($text,"exports.AZURE_CLIENT_ID = '[^']+'","exports.AZURE_CLIENT_ID = '$id'")
[IO.File]::WriteAllText($authPath,$text,[Text.UTF8Encoding]::new($false))
Set-Location $root
npm.cmd ci --no-audit --no-fund
if($LASTEXITCODE){throw 'Dependency install failed'}
npm.cmd run lint
if($LASTEXITCODE){throw 'Lint failed'}
npx.cmd electron-builder --win nsis zip --x64 --publish never
if($LASTEXITCODE){throw 'Packaging failed'}
node tools/verify-updater.js dist
if($LASTEXITCODE){throw 'Updater metadata verification failed'}
$files=Get-ChildItem "$root\dist" -File | Where-Object Extension -in '.exe','.zip'
if(($files|Where-Object Extension -eq '.exe').Count -lt 1 -or ($files|Where-Object Extension -eq '.zip').Count -lt 1){throw 'Setup/ZIP outputs missing'}
$hashes=$files|ForEach-Object {"$((Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower())  $($_.Name)"}
[IO.File]::WriteAllLines("$root\dist\SHA256SUMS.txt",$hashes,[Text.UTF8Encoding]::new($false))
Write-Output 'Setup and ZIP built in staging; publication remains a separate authorized step.'
