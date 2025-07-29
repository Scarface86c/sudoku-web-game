# 🚀 Sudoku Server Startskripts

Dieses Verzeichnis enthält Startskripts zum lokalen Ausführen des Sudoku-Spiels auf Windows.

## 📋 Verfügbare Skripts

### 1. `start-server.bat` (Batch-Datei)
- **Einfachste Option** für Windows-Benutzer
- Doppelklick zum Starten
- Automatische Server-Erkennung (Python, Node.js, PHP)
- Öffnet Browser automatisch

### 2. `start-server.ps1` (PowerShell)
- **Erweiterte Optionen** und bessere Fehlerbehandlung
- Farbige Ausgabe und detaillierte Informationen
- Unterstützt Parameter

## 🎯 Schnellstart

### Option A: Batch-Datei (Einfach)
1. Doppelklick auf `start-server.bat`
2. Warten bis Browser öffnet
3. Spielen unter `http://localhost:8123`

### Option B: PowerShell (Erweitert)
```powershell
# Standard-Start (Port 8123)
.\start-server.ps1

# Benutzerdefinierten Port verwenden
.\start-server.ps1 -Port 9000

# Ohne automatischen Browser-Start
.\start-server.ps1 -NoBrowser
```

## 🔧 Systemanforderungen

Das Skript erkennt automatisch verfügbare Server:

### 1. Python 3 (Empfohlen)
```bash
# Installation: https://www.python.org/downloads/
# Verwendung: python -m http.server 8123
```

### 2. Node.js + http-server
```bash
# Installation: https://nodejs.org/download/
# Verwendung: npx http-server -p 8123
```

### 3. PHP Built-in Server
```bash
# Installation: https://www.php.net/downloads
# Verwendung: php -S localhost:8123
```

## 🌐 Zugriff

### Lokal
- **Standard-URL**: http://localhost:8123
- **Alternative**: http://127.0.0.1:8123

### Netzwerk (andere Geräte)
- **Automatisch angezeigt** in der Skript-Ausgabe
- Format: `http://[DEINE-IP]:8123`
- Beispiel: `http://192.168.1.100:8123`

## 🎮 Game Features

Das Sudoku-Spiel bietet:

- ✅ **Multi-Size Grids**: 4×4, 6×6, 9×9, 16×16
- ✅ **4 Schwierigkeitsgrade**: Easy, Medium, Hard, Hardcore
- ✅ **Progressive Web App**: Installierbar als Desktop/Mobile App
- ✅ **Offline-Funktionalität**: Spielt auch ohne Internet
- ✅ **Responsive Design**: Optimiert für alle Bildschirmgrößen
- ✅ **Accessibility**: Vollständige Barrierefreiheit
- ✅ **Dark/Light Theme**: Automatische Systemerkennung
- ✅ **Advanced Hints**: Lernfähiges Hinweissystem
- ✅ **Statistics**: Timer, Fehler-Tracking, Statistiken

## 🛠️ Troubleshooting

### Problem: "Kein Server gefunden"
**Lösung**: Installiere Python 3:
1. Gehe zu https://www.python.org/downloads/
2. Lade neueste Python 3.x Version herunter
3. Installiere mit "Add Python to PATH" Option
4. Starte Skript erneut

### Problem: "Port bereits belegt"
**Lösung**: Ändere Port in PowerShell:
```powershell
.\start-server.ps1 -Port 8124
```

### Problem: Browser öffnet nicht automatisch
**Lösung**: Manuell öffnen:
- Gehe zu http://localhost:8123 in deinem Browser

### Problem: Andere Geräte können nicht zugreifen
**Lösung**: Firewall prüfen:
1. Windows Firewall → Eingehende Regeln
2. Neue Regel → Port → TCP → 8123
3. Verbindung zulassen

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Öffne http://localhost:8123
2. Klicke auf "Installieren" in der Adressleiste
3. Bestätige Installation
4. App wird als Desktop-Anwendung verfügbar

### Mobile
1. Öffne http://[DEINE-IP]:8123 auf dem Handy
2. Browser-Menü → "Zum Startbildschirm hinzufügen"
3. App funktioniert offline

## 🔒 Sicherheitshinweise

- **Nur lokales Netzwerk**: Server ist standardmäßig nur im lokalen Netzwerk erreichbar
- **Keine Authentifizierung**: Jeder im Netzwerk kann zugreifen
- **Entwicklungsserver**: Nicht für Produktionsumgebungen geeignet
- **Firewall**: Windows Firewall kann Zugriff blockieren

## 📝 Anpassungen

### Port ändern
```batch
REM In start-server.bat Zeile ändern:
start /B python -m http.server 8124
```

```powershell
# PowerShell Parameter verwenden:
.\start-server.ps1 -Port 8124
```

### Automatischer Browser-Start deaktivieren
```powershell
.\start-server.ps1 -NoBrowser
```

## 🤝 Support

Bei Problemen:
1. Prüfe Python/Node.js Installation
2. Teste Port-Verfügbarkeit: `netstat -an | findstr 8123`
3. Firewall-Einstellungen überprüfen
4. Antivirus-Software temporär deaktivieren

---

**Viel Spaß beim Sudoku spielen! 🎯✨**