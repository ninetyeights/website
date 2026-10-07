$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
function Invoke-Compose {
    & docker compose --env-file .env.production @args
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed: $args" }
}
if (!(Test-Path .env.production)) { Copy-Item .env.production.example .env.production }
if (!(Test-Path backend/.env.production)) { Copy-Item backend/.env.production.example backend/.env.production }
Invoke-Compose build
if (!(Select-String -Path backend/.env.production -Pattern '^APP_KEY=base64:' -Quiet)) {
    $generatedKey = & docker compose --env-file .env.production run --rm --no-deps php php artisan key:generate --show --no-interaction
    if ($LASTEXITCODE -ne 0) { throw 'APP_KEY generation failed' }
    $envContent = Get-Content backend/.env.production -Raw
    $envContent = $envContent -replace '(?m)^APP_KEY=.*', "APP_KEY=$($generatedKey.Trim())"
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) 'backend/.env.production'), $envContent)
}
Invoke-Compose up -d --wait postgres
Invoke-Compose run --rm php php artisan migrate --force --no-interaction
Invoke-Compose up -d --wait
