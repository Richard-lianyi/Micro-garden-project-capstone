#include <DHT.h>
#include <string.h>

// Verify these pins and relay polarity against your wiring before uploading.
const byte PUMP_PIN = 8, LIGHT_PIN = 7, DHT_PIN = 2, LDR_PIN = A0;
const byte SOIL_PINS[] = {A1, A2, A3, A4};
const byte RELAY_ON = LOW, RELAY_OFF = HIGH;
const int SOIL_DRY_THRESHOLD = 550;
const int LIGHT_ON_THRESHOLD = 880, LIGHT_OFF_THRESHOLD = 920;
const unsigned long WATER_MS = 2000, SETTLE_MS = 30000;
const unsigned long DAY_MS = 86400000UL, LIGHT_PERIOD_MS = 57600000UL;
// AUTO light requires an installed LDR with readings increasing with brightness.
// Enable after checking its wiring and calibrating the thresholds.
const bool ENABLE_AUTO_LIGHT = false;
const byte MAX_BURSTS = 3; // Lock out after repeated dry cycles; inspect before reset.

DHT dht(DHT_PIN, DHT11);
enum LightMode { AUTO, ON, OFF };
LightMode lightMode = AUTO;
bool pumpOn = false, lightOn = false, settling = false, waterLocked = false;
byte bursts = 0;
int soil[4] = {0, 0, 0, 0}, lightRaw = 0;
float temperature = NAN, humidity = NAN;
bool dhtValid = false;
unsigned long pumpStarted, pumpStopped, lastSample, lastDht, dayStarted;
char command[40];
byte commandLength = 0;
bool overflow = false;

void setLight(bool on) {
  lightOn = on;
  digitalWrite(LIGHT_PIN, on ? RELAY_ON : RELAY_OFF);
}

void startWater(unsigned long now) {
  pumpOn = true;
  pumpStarted = now;
  ++bursts;
  digitalWrite(PUMP_PIN, RELAY_ON);
}

void handleCommand(unsigned long now) {
  if (strcmp(command, "WATER_NOW") == 0) {
    if (waterLocked) Serial.println(F("ERR,WATER_LOCKED"));
    else if (pumpOn || settling) Serial.println(F("ERR,WATER_BUSY"));
    else { startWater(now); Serial.println(F("ACK,WATER_NOW")); }
  } else if (strcmp(command, "LIGHT_ON") == 0) {
    lightMode = ON; setLight(true); Serial.println(F("ACK,LIGHT_ON"));
  } else if (strcmp(command, "LIGHT_OFF") == 0) {
    lightMode = OFF; setLight(false); Serial.println(F("ACK,LIGHT_OFF"));
  } else if (strcmp(command, "LIGHT_AUTO") == 0) {
    if (!ENABLE_AUTO_LIGHT) Serial.println(F("ERR,AUTO_LIGHT_NOT_CONFIGURED"));
    else { lightMode = AUTO; Serial.println(F("ACK,LIGHT_AUTO")); }
  } else if (strcmp(command, "RESET_WATER_LOCK") == 0) {
    // Only issue after inspecting soil, tubing, reservoir and sensors.
    if (pumpOn || settling) Serial.println(F("ERR,WATER_BUSY"));
    else { bursts = 0; waterLocked = false; Serial.println(F("ACK,RESET_WATER_LOCK")); }
  } else Serial.println(F("ERR,UNKNOWN_COMMAND"));
}

void readCommands(unsigned long now) {
  // Bound work so continuous incoming data cannot delay pump shutoff.
  for (byte n = 0; n < 40 && Serial.available(); ++n) {
    char c = Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      command[commandLength] = '\0';
      if (overflow) Serial.println(F("ERR,COMMAND_TOO_LONG"));
      else if (commandLength) handleCommand(now);
      commandLength = 0; overflow = false;
    } else if (commandLength < sizeof(command) - 1 && !overflow) {
      command[commandLength++] = c;
    } else overflow = true;
  }
}

void telemetry() {
  Serial.print(F("DATA,SOIL_RAW="));
  for (byte i = 0; i < 4; ++i) {
    if (i) Serial.print('|');
    Serial.print(soil[i]);
  }
  Serial.print(F(",TEMP_C="));
  if (dhtValid) Serial.print(temperature, 1); else Serial.print(F("null"));
  Serial.print(F(",HUM_PCT="));
  if (dhtValid) Serial.print(humidity, 1); else Serial.print(F("null"));
  Serial.print(F(",LIGHT_RAW=")); Serial.print(lightRaw);
  Serial.print(F(",PUMP=")); Serial.print(pumpOn);
  Serial.print(F(",LIGHT=")); Serial.print(lightOn);
  Serial.print(F(",LIGHT_MODE="));
  Serial.print(lightMode == AUTO ? "AUTO" : lightMode == ON ? "ON" : "OFF");
  Serial.print(F(",AUTO_LIGHT_ENABLED=")); Serial.print(ENABLE_AUTO_LIGHT);
  Serial.print(F(",SETTLING=")); Serial.print(settling);
  Serial.print(F(",WATER_LOCK=")); Serial.println(waterLocked);
}

void setup() {
  // Set the output latch before enabling outputs for active-low relays.
  digitalWrite(PUMP_PIN, RELAY_OFF); pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(LIGHT_PIN, RELAY_OFF); pinMode(LIGHT_PIN, OUTPUT);
  Serial.begin(9600);
  dht.begin();
  dayStarted = millis();
  lastSample = dayStarted - 1000UL;
  lastDht = dayStarted;
  Serial.println(F("READY,MICRO_GARDEN"));
}

void loop() {
  unsigned long now = millis();
  if (pumpOn && now - pumpStarted >= WATER_MS) {
    digitalWrite(PUMP_PIN, RELAY_OFF);
    pumpOn = false; settling = true; pumpStopped = now;
  }
  if (settling && now - pumpStopped >= SETTLE_MS) settling = false;
  readCommands(now);

  if (now - lastDht >= 2000UL && !pumpOn) {
    lastDht = now;
    humidity = dht.readHumidity(); temperature = dht.readTemperature();
    dhtValid = !isnan(humidity) && !isnan(temperature);
  }
  if (now - dayStarted >= DAY_MS) dayStarted += DAY_MS;
  if (now - lastSample >= 1000UL) {
    lastSample = now;
    bool dry = false;
    for (byte i = 0; i < 4; ++i) {
      soil[i] = analogRead(SOIL_PINS[i]);
      if (soil[i] > SOIL_DRY_THRESHOLD) dry = true;
    }
    lightRaw = analogRead(LDR_PIN);
    if (!dry && !pumpOn && !settling && !waterLocked) bursts = 0;
    if (dry && !pumpOn && !settling && !waterLocked) {
      if (bursts >= MAX_BURSTS) waterLocked = true;
      else startWater(now);
    }
    if (lightMode == AUTO) {
      if (!ENABLE_AUTO_LIGHT || now - dayStarted >= LIGHT_PERIOD_MS) setLight(false);
      else if (lightRaw < LIGHT_ON_THRESHOLD) setLight(true);
      else if (lightRaw > LIGHT_OFF_THRESHOLD) setLight(false);
    }
    telemetry();
  }
}
