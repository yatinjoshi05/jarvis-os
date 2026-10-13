@echo off
setlocal
pushd "%~dp0"

REM Keep each long-running development process in its own Windows console.
REM This prevents Ctrl+C / console-control events in the Tauri/Cargo console
REM from being broadcast to the API or Vite process.
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://localhost:3001/api/health ^| Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  start "JARVIS Backend" /min /d "%~dp0..\..\services\backend" cmd /d /s /c "node src\server.js"
)

REM Do not let the next process start until the API is ready to receive proxied AI calls.
powershell -NoProfile -Command "$healthUrl = 'http://localhost:3001/api/health'; for ($attempt = 1; $attempt -le 50; $attempt++) { try { $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 $healthUrl; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 100 }; Write-Error 'JARVIS backend did not become healthy.'; exit 1"
if errorlevel 1 (
  popd
  endlocal
  exit /b 1
)

REM Vite is isolated too. Tauri only connects to devUrl; it does not own this process.
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://localhost:3000 ^| Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  start "JARVIS Vite" /min /d "%~dp0" cmd /d /s /c "node node_modules\vite\bin\vite.js"
)

powershell -NoProfile -Command "$viteUrl = 'http://localhost:3000'; for ($attempt = 1; $attempt -le 50; $attempt++) { try { $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 $viteUrl; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 100 }; Write-Error 'JARVIS Vite server did not become ready.'; exit 1"
if errorlevel 1 (
  popd
  endlocal
  exit /b 1
)

call pnpm run tauri dev

popd
endlocal
