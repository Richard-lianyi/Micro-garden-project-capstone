# Continue development on another Windows computer

## Current state

- Local checkout on this computer: D:\Capstone\Micro-garden-project-capstone.
- Arduino Uno sketch compiled successfully with arduino:avr 1.8.8, DHT sensor library 1.4.7, and Adafruit Unified Sensor 1.1.15.
- Four soil inputs and DHT telemetry were received from physical hardware on COM5. DHT readings sometimes returned null; inspect wiring if persistent.
- server.cjs and serial-reader.ps1 provide a read-only Windows USB serial bridge with Node.js and Windows PowerShell. No npm dependencies.
- dashboard now reads real telemetry. Web control buttons are disabled. Arduino firmware still performs automatic watering independently.
- HTTP dashboard and API responses were verified. User reported an empty page; visual browser verification was unavailable. Investigate browser rendering if it persists.
- Pump, grow-light and light-sensor hardware were not verified.

## Start on another computer

Clone the repository, or preserve local edits and run git pull in an existing checkout.
Install Node.js and Arduino IDE if needed. Connect Arduino and identify its COM port.
Close Arduino Serial Monitor and Serial Plotter, then run in the repository folder:

```powershell
$env:ARDUINO_PORT = 'COM5'
node server.cjs
```

Replace COM5 with that computer's actual port. Open http://127.0.0.1:3000 in Edge or Chrome. Do not open dashboard/index.html directly. The server must run on the same computer as the USB-connected Arduino. Ctrl+C stops a foreground server.

## Hardware and firmware

| Component | Uno pin |
| --- | --- |
| DHT11 data | D2 |
| Shared pump relay | D8 |
| Grow light relay | D7 |
| Four soil analog outputs | A1-A4 |
| Optional LDR divider | A0 |

Open micro_garden_ui/micro_garden_ui.ino in Arduino IDE. Install the Adafruit DHT sensor library and Adafruit Unified Sensor. Select Arduino Uno and the correct USB port.
Relays are active-low. Automatic lighting is disabled until wiring and thresholds are calibrated. The light schedule starts at boot.
All four soil inputs are enabled; disconnected inputs can trigger watering. Threshold 550 needs calibration. A dry reading on any sensor triggers the shared pump for two seconds followed by 30 seconds settling. Three consecutive dry bursts cause lockout.
Keep pump power disconnected during sensor-only testing. Opening the serial connection can reset Uno and clear its lockout.
Serial Monitor uses 9600 baud and newline. Commands supported by firmware: WATER_NOW, LIGHT_ON, LIGHT_OFF, LIGHT_AUTO, RESET_WATER_LOCK. The web bridge does not send commands.

## Remaining work

Verify dashboard rendering in the user's browser, calibrate soil sensors, investigate intermittent DHT failures, then test relay wiring and hardware before adding acknowledged web controls.
