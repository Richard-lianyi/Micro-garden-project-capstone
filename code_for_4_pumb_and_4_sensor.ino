// Digital output pins
int IN1 = 8;
int IN2 = 9;
int IN3 = 10;
int IN4 = 11;

// Analog input pins
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
int wateringTime = 2000;   // 2 seconds watering
int waitTime = 30000;      // 30 seconds wait

void setup() {

  Serial.begin(9600);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, HIGH);
}

void loop() {

  // Sensor 1
  Serial.print("MOISTURE 1: ");
  value1 = analogRead(Pin1);
  Serial.println(value1);

  if(value1 > threshold){
    Serial.println("Watering Zone 1");
    digitalWrite(IN1, LOW);
    delay(wateringTime);
    digitalWrite(IN1, HIGH);
  }

  // Sensor 2
  Serial.print("MOISTURE 2: ");
  value2 = analogRead(Pin2);
  Serial.println(value2);

  if(value2 > threshold){
    Serial.println("Watering Zone 2");
    digitalWrite(IN2, LOW);
    delay(wateringTime);
    digitalWrite(IN2, HIGH);
  }

  // Sensor 3
  Serial.print("MOISTURE 3: ");
  value3 = analogRead(Pin3);
  Serial.println(value3);

  if(value3 > threshold){
    Serial.println("Watering Zone 3");
    digitalWrite(IN3, LOW);
    delay(wateringTime);
    digitalWrite(IN3, HIGH);
  }

  // Sensor 4
  Serial.print("MOISTURE 4: ");
  value4 = analogRead(Pin4);
  Serial.println(value4);

  if(value4 > threshold){
    Serial.println("Watering Zone 4");
    digitalWrite(IN4, LOW);
    delay(wateringTime);
    digitalWrite(IN4, HIGH);
  }

  Serial.println("---------------------");

  delay(waitTime);
}