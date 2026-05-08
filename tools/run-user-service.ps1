$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envPaths = @(
    (Join-Path $root ".env.example"),
    (Join-Path $root ".env")
)

foreach ($envPath in $envPaths) {
    if (-not (Test-Path $envPath)) {
        continue
    }

    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $parts = $line.Split("=", 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        if ($name) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

if ([string]::IsNullOrWhiteSpace($env:MAIL_USERNAME)) {
    throw "MAIL_USERNAME is not set. Add it to .env or set it in this PowerShell window."
}

if ([string]::IsNullOrWhiteSpace($env:MAIL_PASSWORD)) {
    throw "MAIL_PASSWORD is not set. Add your Gmail app password to .env or set it in this PowerShell window."
}

Write-Host "Starting userService with MAIL_USERNAME=$env:MAIL_USERNAME"
Set-Location $root
mvn -pl userService spring-boot:run
