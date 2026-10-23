# Local USB sensor dashboard (Windows)

1. Upload micro_garden_ui/micro_garden_ui.ino to Arduino Uno.
2. Close Arduino Serial Monitor and Serial Plotter. Keep pump power disconnected during sensor testing.
3. Open PowerShell in this project folder and run:

```powershell
node server.cjs
```

4. Open http://127.0.0.1:3000 in your browser. Do not open index.html directly.
5. Stop the server with Ctrl+C before reopening Serial Monitor.

Default port: COM5, 9600 baud. To select another port:

```powershell
$env:ARDUINO_PORT = 'COM6'
node server.cjs
```

Requires Node.js and Windows PowerShell; no npm packages are needed.
The serial reader retries every three seconds when a port cannot be opened.
The dashboard marks data stale after five seconds without telemetry.
Web controls are disabled: this version only reads hardware status.
The Arduino firmware itself still performs automatic watering and lockout.
LIGHT_RAW is not meaningful while A0 is disconnected. Calibrate soil thresholds.
