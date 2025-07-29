@echo off
REM ========================================
REM Sudoku Web Game Server - Windows Starter
REM ========================================
REM Automatisches Startskript für das Sudoku-Spiel
REM Port: 8123
REM URL: http://localhost:8123

title Sudoku Web Game Server (Port 8123)
color 0A

echo.
echo ==========================================
echo   🎮 SUDOKU WEB GAME SERVER STARTER 🎮
echo ==========================================
echo.
echo Starte Webserver auf Port 8123...
echo URL: http://localhost:8123
echo.
echo Drücke STRG+C zum Beenden des Servers
echo ==========================================
echo.

REM Prüfe verfügbare Server-Optionen in Reihenfolge der Präferenz

REM 1. Python 3 (bevorzugt)
python --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✅ Python 3 gefunden - Starte HTTP Server...
    echo.
    start /B python -m http.server 8123
    goto :server_started
)

REM 2. Python 2 (Fallback)
python2 --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✅ Python 2 gefunden - Starte HTTP Server...
    echo.
    start /B python2 -m SimpleHTTPServer 8123
    goto :server_started
)

REM 3. Node.js mit http-server
node --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✅ Node.js gefunden - Installiere http-server falls nötig...
    npm install -g http-server >nul 2>&1
    echo ✅ Starte http-server...
    echo.
    start /B npx http-server -p 8123 -c-1 --cors
    goto :server_started
)

REM 4. PHP (falls installiert)
php --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✅ PHP gefunden - Starte Built-in Server...
    echo.
    start /B php -S localhost:8123
    goto :server_started
)

REM Kein Server gefunden
echo ❌ FEHLER: Kein unterstützter Webserver gefunden!
echo.
echo Bitte installiere eine der folgenden Optionen:
echo.
echo 1. Python 3 (empfohlen):
echo    https://www.python.org/downloads/
echo.
echo 2. Node.js:
echo    https://nodejs.org/download/
echo.
echo 3. PHP:
echo    https://www.php.net/downloads
echo.
pause
exit /B 1

:server_started
echo ✅ Server erfolgreich gestartet!
echo.
echo 🌐 Sudoku-Spiel verfügbar unter:
echo    http://localhost:8123
echo.
echo 📱 Für andere Geräte im Netzwerk:
for /f "delims=" %%i in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet*' | Where-Object {$_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress"') do set LOCAL_IP=%%i
if defined LOCAL_IP (
    echo    http://%LOCAL_IP%:8123
) else (
    echo    http://[DEINE-IP]:8123
)
echo.
echo 🎮 Features:
echo    ✅ 4×4, 6×6, 9×9, 16×16 Raster
echo    ✅ 4 Schwierigkeitsgrade
echo    ✅ PWA (App-Installation möglich)
echo    ✅ Offline-Funktionalität
echo    ✅ Touch & Desktop optimiert
echo.
echo ⚠️  Zum Beenden: STRG+C drücken oder Fenster schließen
echo.

REM Öffne Browser automatisch nach kurzer Verzögerung
timeout /t 3 /nobreak >nul
start http://localhost:8123

REM Warte auf Benutzerabbruch
echo Drücke eine beliebige Taste zum Beenden...
pause >nul

REM Cleanup - Stoppe alle Python/Node Prozesse auf Port 8123
echo.
echo 🛑 Stoppe Server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8123"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo ✅ Server gestoppt. Auf Wiedersehen!
timeout /t 2 /nobreak >nul