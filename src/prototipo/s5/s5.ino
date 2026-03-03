// Importacao das bibliotecas
#include <HX711.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <UbidotsEsp32Mqtt.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <WiFi.h>

#if __has_include("credentials.local.h")
#include "credentials.local.h"
#else
#error "Arquivo credentials.local.h ausente em src/prototipo/s5/. Defina: UBIDOTS_TOKEN, SSID e PW."
#endif

const char *DEVICE_LABEL = "balancairon";
const char *DISPLACEMENT_LABEL = "displacement_mm";
const char *TEMP_LABEL = "temperature";
const char *HMDT_LABEL = "humidity";

const int PUBLISH_FREQUENCY = 2000;
unsigned long timer;

const int PIN_RED = 15;
const int PIN_GREEN = 2;
const int PIN_BLUE = 19;

const int ZERO_BUTTON = 0;
const int DISPLAY_BUTTON = 17;
bool displayOn = true;

const int HX711_DT_PIN = 4;
const int HX711_SCK_PIN = 18;

// Modelo de calibracao para o transdutor linear (0-20 mm).
// Ajuste estes valores no comissionamento em bancada.
const long RAW_ZERO_DEFAULT = 0L;
const long RAW_AT_20MM_DEFAULT = 100000L;
const float DISPLACEMENT_MIN_MM = 0.0f;
const float DISPLACEMENT_WARN_MM = 15.0f;
const float DISPLACEMENT_MAX_MM = 20.0f;

Ubidots ubidots(UBIDOTS_TOKEN);
Adafruit_BME280 bme;
LiquidCrystal_I2C lcd(0x27, 16, 2);

class LinearDisplacementSensor {
 private:
  HX711 sensor;
  int redPin;
  int greenPin;
  int bluePin;
  int dtPin;
  int sckPin;
  long rawZero;
  long rawAt20mm;
  float warningMm;
  float maxMm;

  long readRawAverage() {
    return sensor.read_average(5);
  }

 public:
  LinearDisplacementSensor(int dtPin, int sckPin, int redPin, int greenPin, int bluePin, long rawZero, long rawAt20mm,
                           float warningMm, float maxMm)
      : redPin(redPin),
        greenPin(greenPin),
        bluePin(bluePin),
        dtPin(dtPin),
        sckPin(sckPin),
        rawZero(rawZero),
        rawAt20mm(rawAt20mm),
        warningMm(warningMm),
        maxMm(maxMm) {}

  void begin() {
    pinMode(redPin, OUTPUT);
    pinMode(greenPin, OUTPUT);
    pinMode(bluePin, OUTPUT);
    sensor.begin(dtPin, sckPin);
    delay(2000);
  }

  bool isCalibrationValid() const {
    return labs(rawAt20mm - rawZero) > 10;
  }

  long readRaw() {
    return readRawAverage();
  }

  float convertRawToMillimeters(long raw) const {
    if (!isCalibrationValid()) {
      return 0.0f;
    }

    // Conversao linear por dois pontos:
    // mm = (raw - raw_zero) * 20.0 / (raw_at_20mm - raw_zero)
    float mm = ((float)(raw - rawZero) * DISPLACEMENT_MAX_MM) / (float)(rawAt20mm - rawZero);
    return mm;
  }

  float measureMillimeters(bool clampOutput) {
    float mm = convertRawToMillimeters(readRaw());
    if (!clampOutput) {
      return mm;
    }
    return constrain(mm, DISPLACEMENT_MIN_MM, DISPLACEMENT_MAX_MM);
  }

  void zeroReference() {
    rawZero = readRawAverage();
    Serial.println("Referencia zero ajustada");
    lcd.setCursor(0, 1);
    lcd.print("Zero ajustado   ");
  }

  void printCalibrationInfo() {
    Serial.print("Calibracao rawZero=");
    Serial.print(rawZero);
    Serial.print(" rawAt20mm=");
    Serial.println(rawAt20mm);

    if (!isCalibrationValid()) {
      Serial.println("ATENCAO: calibracao invalida para DT-20B");
    }
  }

  void updateLedByDisplacement(float displacementMm) {
    if (displacementMm >= maxMm) {
      digitalWrite(redPin, LOW);
      digitalWrite(greenPin, HIGH);
      digitalWrite(bluePin, HIGH);
      Serial.println("Alerta: limite maximo de deslocamento");
      return;
    }

    if (displacementMm >= warningMm) {
      digitalWrite(redPin, LOW);
      digitalWrite(greenPin, LOW);
      digitalWrite(bluePin, HIGH);
      Serial.println("Alerta: deslocamento em faixa de aviso");
      return;
    }

    digitalWrite(redPin, HIGH);
    digitalWrite(greenPin, LOW);
    digitalWrite(bluePin, HIGH);
  }
};

void callback(char *topic, byte *payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

byte barra[8] = {
    B11111,
    B11111,
    B11111,
    B11111,
    B11111,
    B11111,
    B11111,
    B11111,
};

LinearDisplacementSensor displacementSensor(HX711_DT_PIN, HX711_SCK_PIN, PIN_RED, PIN_GREEN, PIN_BLUE, RAW_ZERO_DEFAULT,
                                            RAW_AT_20MM_DEFAULT, DISPLACEMENT_WARN_MM, DISPLACEMENT_MAX_MM);

void setup() {
  Serial.begin(57600);
  pinMode(ZERO_BUTTON, INPUT_PULLUP);
  pinMode(DISPLAY_BUTTON, INPUT_PULLUP);

  lcd.init();
  lcd.backlight();
  lcd.createChar(0, barra);

  for (int i = 0; i < 32; i++) {
    lcd.setCursor(i % 16, i / 16);
    lcd.write(byte(0));
    delay(100);
  }

  delay(1000);
  lcd.clear();
  lcd.print("Bem vindo!");
  delay(500);
  lcd.clear();

  displacementSensor.begin();
  displacementSensor.printCalibrationInfo();

  bool status = bme.begin(0x76);
  if (!status) {
    Serial.println("Sensor BME280 nao encontrado, cheque a fiacao!");
    lcd.print("sensor temp");
    lcd.setCursor(0, 1);
    lcd.print("desconectado!");
    delay(1000);
  }

  lcd.clear();
  lcd.print("conectando wifi");
  ubidots.connectToWifi(SSID, PW);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("conectando ao");
  lcd.setCursor(0, 1);
  lcd.print("servidor...");

  ubidots.setCallback(callback);
  ubidots.setup();
  if (!ubidots.connect()) {
    Serial.println("Falha ao conectar MQTT no setup");
  }

  timer = millis();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Desloc:");
  displacementSensor.zeroReference();
}

void loop() {
  float displacementMm = displacementSensor.measureMillimeters(true);
  float temp = bme.readTemperature();
  float humidity = bme.readHumidity();

  lcd.setCursor(7, 0);
  lcd.print(displacementMm, 3);
  lcd.print("mm ");

  Serial.print("Deslocamento:");
  Serial.print(displacementMm, 3);
  Serial.println(" mm");
  Serial.print("Temperatura:");
  Serial.print(temp);
  Serial.println(" C");
  Serial.print("Umidade:");
  Serial.print(humidity);
  Serial.println("%");

  lcd.setCursor(0, 1);
  lcd.print(temp, 1);
  lcd.print("C ");
  lcd.print(humidity, 1);
  lcd.print("%   ");

  displacementSensor.updateLedByDisplacement(displacementMm);
  delay(1000);

  if (!ubidots.connected()) {
    Serial.println("Erro na conexao MQTT");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Erro conexao!");
    lcd.setCursor(0, 1);
    lcd.print("Reconectando...");

    if (ubidots.connect()) {
      Serial.println("MQTT reconectado");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Desloc:");
    } else {
      Serial.println("Falha MQTT, nova tentativa no proximo ciclo");
    }
    delay(300);
  }

  if (ubidots.connected() && labs(millis() - timer) > PUBLISH_FREQUENCY) {
    ubidots.add(DISPLACEMENT_LABEL, displacementMm);
    ubidots.add(TEMP_LABEL, temp);
    ubidots.add(HMDT_LABEL, humidity);
    ubidots.publish(DEVICE_LABEL);
    timer = millis();
  }

  if (ubidots.connected()) {
    ubidots.loop();
  }

  delay(1000);

  if (digitalRead(DISPLAY_BUTTON) == LOW) {
    delay(50);
    if (digitalRead(DISPLAY_BUTTON) == LOW) {
      displayOn = !displayOn;
      if (displayOn) {
        lcd.backlight();
      } else {
        lcd.noBacklight();
      }
      delay(500);
    }
  }

  if (digitalRead(ZERO_BUTTON) == LOW) {
    delay(50);
    if (digitalRead(ZERO_BUTTON) == LOW) {
      displacementSensor.zeroReference();
      delay(300);
    }
  }
}
