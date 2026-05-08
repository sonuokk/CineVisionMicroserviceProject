@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

where mvn >nul 2>nul
if errorlevel 1 (
    echo Maven was not found on PATH. Install Maven or open this from a terminal where mvn works.
    pause
    exit /b 1
)

echo Starting CineVision backend services...
echo Make sure your local MongoDB server is running.
echo.

call :start_service "Eureka Server" "eureka-server" 20
call :start_service "User Service" "userService" 8
call :start_service "Movie Service" "movieService" 8
call :start_service "API Gateway" "api-gateway" 0

echo.
echo All service terminals have been opened.
echo Eureka dashboard: http://localhost:8761
echo API gateway:      http://localhost:8080
echo Frontend:         cd frontend ^&^& npm start
pause
exit /b 0

:start_service
set "SERVICE_NAME=%~1"
set "MODULE_NAME=%~2"
set "WAIT_SECONDS=%~3"

echo Starting %SERVICE_NAME%...
start "%SERVICE_NAME%" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%ROOT%'; mvn -pl %MODULE_NAME% spring-boot:run"

if not "%WAIT_SECONDS%"=="0" (
    echo Waiting %WAIT_SECONDS% seconds before starting the next service...
    timeout /t %WAIT_SECONDS% /nobreak >nul
)

exit /b 0
