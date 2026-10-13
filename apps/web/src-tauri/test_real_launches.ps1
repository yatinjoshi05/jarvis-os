$exePath = "D:\jarvis\apps\web\src-tauri\target\debug\app.exe"
Set-Location "D:\jarvis\apps\web\src-tauri"

$successes = 0
$crashes = 0

for ($i = 1; $i -le 10; $i++) {
    Write-Host "========================================"
    Write-Host "           Launch Attempt $i           "
    Write-Host "========================================"
    
    # Ensure no lingering app.exe
    Get-Process -Name "app" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 1
    
    $proc = Start-Process -FilePath $exePath -PassThru
    Start-Sleep -Seconds 4
    
    if ($proc.HasExited) {
        $code = [string]::Format("0x{0:X8}", $proc.ExitCode)
        Write-Host "CRASHED! Attempt $i exited with code $code"
        $crashes++
    } else {
        Write-Host "SUCCESS! Attempt $i is running fine (PID $($proc.Id))"
        $successes++
        $proc | Stop-Process -Force
    }
    
    Get-Process -Name "app" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 1
}

Write-Host "========================================"
Write-Host "FINAL RESULT: Successes: $successes / Crashes: $crashes"
Write-Host "========================================"
