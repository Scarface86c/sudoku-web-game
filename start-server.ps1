# ========================================
# Sudoku Web Game Server - PowerShell
# ========================================
# PowerShell-Version des Startskripts
# Port: 8123
# URL: http://localhost:8123

param(
    [int]$Port = 8123,
    [switch]$NoBrowser
)

# Fenster-Titel setzen
$Host.UI.RawUI.WindowTitle = "Sudoku Web Game Server (Port $Port)"

# Farben und Header
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  🎮 SUDOKU WEB GAME SERVER STARTER 🎮" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starte Webserver auf Port $Port..." -ForegroundColor Cyan
Write-Host "URL: http://localhost:$Port" -ForegroundColor White
Write-Host ""
Write-Host "Drücke STRG+C zum Beenden des Servers" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Server-Optionen prüfen
$serverStarted = $false

# 1. Python 3 (bevorzugt)
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "✅ Python 3 gefunden - Starte HTTP Server..." -ForegroundColor Green
        Write-Host ""
        $process = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", $Port -PassThru -WindowStyle Hidden
        $serverStarted = $true
        $serverProcess = $process
        $serverType = "Python 3"
    }
} catch {
    # Python nicht gefunden, weiter zum nächsten
}

# 2. Node.js mit http-server (falls Python nicht verfügbar)
if (-not $serverStarted) {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✅ Node.js gefunden - Installiere http-server falls nötig..." -ForegroundColor Green
            npm install -g http-server 2>$null | Out-Null
            Write-Host "✅ Starte http-server..." -ForegroundColor Green
            Write-Host ""
            $process = Start-Process -FilePath "npx" -ArgumentList "http-server", "-p", $Port, "-c-1", "--cors" -PassThru -WindowStyle Hidden
            $serverStarted = $true
            $serverProcess = $process
            $serverType = "Node.js http-server"
        }
    } catch {
        # Node.js nicht gefunden, weiter zum nächsten
    }
}

# 3. PHP (falls installiert)
if (-not $serverStarted) {
    try {
        $phpVersion = php --version 2>$null
        if ($phpVersion) {
            Write-Host "✅ PHP gefunden - Starte Built-in Server..." -ForegroundColor Green
            Write-Host ""
            $process = Start-Process -FilePath "php" -ArgumentList "-S", "localhost:$Port" -PassThru -WindowStyle Hidden
            $serverStarted = $true
            $serverProcess = $process
            $serverType = "PHP Built-in Server"
        }
    } catch {
        # PHP nicht gefunden
    }
}

# Fehler falls kein Server gefunden
if (-not $serverStarted) {
    Write-Host "❌ FEHLER: Kein unterstützter Webserver gefunden!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Bitte installiere eine der folgenden Optionen:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Python 3 (empfohlen):" -ForegroundColor White
    Write-Host "   https://www.python.org/downloads/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Node.js:" -ForegroundColor White
    Write-Host "   https://nodejs.org/download/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. PHP:" -ForegroundColor White
    Write-Host "   https://www.php.net/downloads" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

# Server erfolgreich gestartet
Write-Host "✅ $serverType erfolgreich gestartet!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Sudoku-Spiel verfügbar unter:" -ForegroundColor Cyan
Write-Host "   http://localhost:$Port" -ForegroundColor White
Write-Host ""

# Lokale IP für Netzwerkzugriff ermitteln
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet*' | 
                Where-Object {$_.IPAddress -notlike '169.254.*'} | 
                Select-Object -First 1).IPAddress
    if ($localIP) {
        Write-Host "📱 Für andere Geräte im Netzwerk:" -ForegroundColor Cyan
        Write-Host "   http://$localIP:$Port" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host "📱 Für andere Geräte im Netzwerk:" -ForegroundColor Cyan
    Write-Host "   http://[DEINE-IP]:$Port" -ForegroundColor White
    Write-Host ""
}

# Game Features anzeigen
Write-Host "🎮 Features:" -ForegroundColor Yellow
Write-Host "   ✅ 4×4, 6×6, 9×9, 16×16 Raster" -ForegroundColor White
Write-Host "   ✅ 4 Schwierigkeitsgrade" -ForegroundColor White
Write-Host "   ✅ PWA (App-Installation möglich)" -ForegroundColor White
Write-Host "   ✅ Offline-Funktionalität" -ForegroundColor White
Write-Host "   ✅ Touch & Desktop optimiert" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Zum Beenden: STRG+C drücken" -ForegroundColor Red
Write-Host ""

# Browser automatisch öffnen (außer -NoBrowser Parameter)
if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$Port"
}

# Warten auf Benutzerabbruch
try {
    Write-Host "Server läuft... Drücke STRG+C zum Beenden." -ForegroundColor Gray
    while ($true) {
        Start-Sleep -Seconds 1
        # Prüfe ob Server-Prozess noch läuft
        if ($serverProcess -and $serverProcess.HasExited) {
            Write-Host "❌ Server wurde unerwartet beendet!" -ForegroundColor Red
            break
        }
    }
} catch {
    # STRG+C gedrückt
    Write-Host ""
    Write-Host "🛑 Stoppe Server..." -ForegroundColor Yellow
    
    # Server-Prozess beenden
    if ($serverProcess -and -not $serverProcess.HasExited) {
        $serverProcess.Kill()
        $serverProcess.WaitForExit(5000)
    }
    
    # Alle Prozesse auf Port beenden (Backup)
    Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    
    Write-Host "✅ Server gestoppt. Auf Wiedersehen!" -ForegroundColor Green
    Start-Sleep -Seconds 1
}