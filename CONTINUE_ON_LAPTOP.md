# Continue development on another computer

## Current project state

- `dashboard/index.html` and `dashboard/app.js`: English browser dashboard with simulated sensor values, a 2-second watering simulation, a 30-second settling period, light controls, temperature history, and activity log.
- `micro_garden_ui/micro_garden_ui.ino`: combined Arduino Uno R3 sketch with four soil inputs, one pump, DHT11, grow light relay, telemetry, and serial commands. Not compiled or verified on physical hardware yet.
- Original Arduino sketches and reports are retained.
- The Node.js USB serial bridge has NOT been implemented. The dashboard currently operates only in simulation mode.

## Open the project on your laptop

Clone this repository, or use GitHub's Code > Download ZIP and extract it:

```text
git clone https://github.com/Richard-lianyi/Micro-garden-project-capstone.git
```

If already cloned, run `git pull` in that checkout after preserving any local edits.

Open `dashboard/index.html` in a browser. No installation is required for the simulation. The desktop's localhost URL does not transfer to the laptop; open the downloaded file instead.

## Arduino setup

Open `micro_garden_ui/micro_garden_ui.ino` in Arduino IDE. Install the Adafruit DHT sensor library and Adafruit Unified Sensor dependency. Select Arduino Uno and the correct USB port.

Verify wiring before uploading:

| Component | Pin |
| --- | --- |
| DHT11 data | D2 |
| Shared pump relay | D8 |
| Grow light relay | D7 |
| Four soil sensor outputs | A1-A4 |
| Optional LDR divider output | A0 |

The sketch assumes active-low relays. Automatic light control is disabled until the LDR is wired, calibrated, and `ENABLE_AUTO_LIGHT` is enabled. Its configured photoperiod starts at boot rather than using wall-clock time.

All four soil inputs are currently enabled. Adjust the sketch before operating if fewer sensors are connected; floating inputs can trigger watering. Automatic watering uses a raw ADC threshold of 550, a 2-second burst, and a 30-second pause. Three consecutive dry bursts cause a watering lockout. Inspect the system before sending `RESET_WATER_LOCK`.

Serial Monitor: 9600 baud, newline. Commands: `WATER_NOW`, `LIGHT_ON`, `LIGHT_OFF`, `LIGHT_AUTO`, `RESET_WATER_LOCK`. Telemetry begins with `DATA,`.

## Next development step

Implement a local Node.js server using USB serial communication and a browser connection. Replace simulated samples with Arduino telemetry, and forward control requests with acknowledgements and connection status. Close Arduino Serial Monitor when the bridge uses the port. Node.js is not needed for the current simulation.
