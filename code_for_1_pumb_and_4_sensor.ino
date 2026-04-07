// One pump output pin
int pumpPin = 8;

// Soil moisture sensor pins
int Pin1 = A1;
int Pin2 = A2;
int Pin3 = A3;
int Pin4 = A4;

// Sensor values
int value1 = 0;
int value2 = 0;
int value3 = 0;
int value4 = 0;

// Settings
int threshold = 550;
int wateringTime = 2000;   // 2 seconds
int waitTime = 3000;      // 30 seconds

void setup() {
  Serial.begin(9600);

  pinMode(pumpPin, OUTPUT);

  // Pump OFF initially
  digitalWrite(pumpPin, HIGH);
}

void loop() {
  // Read all sensors
  value1 = analogRead(Pin1);
  value2 = analogRead(Pin2);
  value3 = analogRead(Pin3);
  value4 = analogRead(Pin4);

  // Print sensor readings
  Serial.print("MOISTURE 1: ");
  Serial.println(value1);

  Serial.print("MOISTURE 2: ");
  Serial.println(value2);

  Serial.print("MOISTURE 3: ");
  Serial.println(value3);

  Serial.print("MOISTURE 4: ");
  Serial.println(value4);

  // If any zone is dry, turn on the pump
  if (value1 > threshold || value2 > threshold || value3 > threshold || value4 > threshold) {
    Serial.println("Dry soil detected. Watering...");
    digitalWrite(pumpPin, LOW);   // Pump ON
    delay(wateringTime);
    digitalWrite(pumpPin, HIGH);  // Pump OFF
  } else {
    Serial.println("Soil moisture is sufficient. Pump OFF.");
  }

  Serial.println("----------------------");
  delay(waitTime);
}