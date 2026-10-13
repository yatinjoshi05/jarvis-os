$ErrorActionPreference = 'Continue'
Set-Location "D:\jarvis\apps\web\src-tauri"

for ($i = 1; $i -le 10; $i++) {
    Write-Host "========================================"
    Write-Host "           Launch Attempt $i           "
    Write-Host "========================================"
    $output = cargo check 2>&1
    $output | Out-File -FilePath "cargo-check-attempt-$i.txt" -Encoding utf8
    Write-Host "Launch Attempt $i finished successfully."
}
