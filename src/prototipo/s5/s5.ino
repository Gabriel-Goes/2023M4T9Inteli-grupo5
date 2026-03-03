// Importacao das bibliotecas
#include <HX711.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <UbidotsEsp32Mqtt.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <WiFi.h>
#include <Preferences.h>

#if __has_include("credentials.local.h")
#include "credentials.local.h"
#else
#error "Arquivo credentials.local.h ausente em src/prototipo/s5/. Defina: UBIDOTS_TOKEN, SSID e PW."
#endif

const char *DEVICE_LABEL = "balancairon";
const char *DISPLACEMENT_LABEL = "displacement_mm";
const char *WEIGHT_LABEL = "weight_kg";
const char *SENSOR_TYPE_ID_LABEL = "sensor_type_id";
const char *TEMP_LABEL = "temperature";
const char *HMDT_LABEL = "humidity";

const unsigned long PUBLISH_FREQUENCY = 2000UL;
const unsigned long SAMPLE_INTERVAL_MS = 1000UL;
unsigned long publishTimer = 0;
unsigned long sampleTimer = 0;

const int PIN_RED = 15;
const int PIN_GREEN = 2;
const int PIN_BLUE = 19;

const int ZERO_BUTTON = 0;
const int DISPLAY_BUTTON = 17;
bool displayOn = true;

const unsigned long LONG_PRESS_20MM_MS = 3000UL;
const unsigned long LONG_PRESS_DISPLAY_MS = 1500UL;
const unsigned long SENSOR_CONFIRM_TIMEOUT_MS = 2000UL;

const int HX711_DT_PIN = 4;
const int HX711_SCK_PIN = 18;

// Modelo de calibracao para o transdutor linear (0-20 mm).
const long RAW_ZERO_DEFAULT = 0L;
const long RAW_AT_20MM_DEFAULT = 100000L;
const float DISPLACEMENT_MIN_MM = 0.0f;
const float DISPLACEMENT_WARN_MM = 15.0f;
const float DISPLACEMENT_MAX_MM = 20.0f;

// Modelo inicial de celula de carga (kg), com tara em campo e escala fixa no firmware.
const float LOAD_CELL_SCALE_FACTOR = 219359.9079f;
const float LOAD_CELL_MIN_KG = 0.0f;
const float LOAD_CELL_WARN_KG = 8.0f;
const float LOAD_CELL_MAX_KG = 10.0f;

const char *NVS_NAMESPACE = "s5cfg";
const char *NVS_SENSOR_KEY = "sensor_idx";

enum SensorType : uint8_t {
  SENSOR_DT20B = 0,
  SENSOR_LOAD_CELL = 1,
  SENSOR_COUNT = 2,
};

Ubidots ubidots(UBIDOTS_TOKEN);
Adafruit_BME280 bme;
LiquidCrystal_I2C lcd(0x27, 16, 2);
Preferences preferences;

float lastMeasurement = 0.0f;
float lastTemp = 0.0f;
float lastHumidity = 0.0f;

int activeSensorIndex = SENSOR_DT20B;
int pendingSensorIndex = -1;
unsigned long pendingSelectionAt = 0;

class LinearDisplacementSensor {
 private:
  HX711 sensor;
  int dtPin;
  int sckPin;
  long rawZero;
  long rawAt20mm;

  long readRawAverage() {
    return sensor.read_average(5);
  }

 public:
  LinearDisplacementSensor(int dtPin, int sckPin, long rawZero, long rawAt20mm)
      : dtPin(dtPin), sckPin(sckPin), rawZero(rawZero), rawAt20mm(rawAt20mm) {}

  void begin() {
    sensor.begin(dtPin, sckPin);
    delay(2000);
  }

  bool isCalibrationValid() const {
    return labs(rawAt20mm - rawZero) > 10;
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
    float mm = convertRawToMillimeters(readRawAverage());
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

  void setSpanReference20mm() {
    rawAt20mm = readRawAverage();
    Serial.print("Referencia 20mm ajustada: ");
    Serial.println(rawAt20mm);
    lcd.setCursor(0, 1);
    lcd.print("Span 20mm ok    ");

    if (!isCalibrationValid()) {
      Serial.println("ATENCAO: valor de 20mm muito proximo do zero");
    }
  }

  void printCalibrationInfo() {
    Serial.print("DT-20B calibracao rawZero=");
    Serial.print(rawZero);
    Serial.print(" rawAt20mm=");
    Serial.println(rawAt20mm);

    if (!isCalibrationValid()) {
      Serial.println("ATENCAO: calibracao invalida para DT-20B");
    }
  }
};

class LoadCellSensor {
 private:
  HX711 sensor;
  int dtPin;
  int sckPin;
  float scaleFactor;

 public:
  LoadCellSensor(int dtPin, int sckPin, float scaleFactor) : dtPin(dtPin), sckPin(sckPin), scaleFactor(scaleFactor) {}

  void begin() {
    sensor.begin(dtPin, sckPin);
    sensor.set_scale(scaleFactor);
    delay(2000);
  }

  void tare() {
    sensor.tare();
    Serial.println("Carga tara ajustada");
    lcd.setCursor(0, 1);
    lcd.print("Tara ajustada    ");
  }

  float measureKilograms(bool clampOutput) {
    float kg = sensor.get_units(5);
    if (!clampOutput) {
      return kg;
    }
    return constrain(kg, LOAD_CELL_MIN_KG, LOAD_CELL_MAX_KG);
  }

  void printCalibrationInfo() {
    Serial.print("LoadCell scaleFactor=");
    Serial.println(scaleFactor, 4);
  }
};

LinearDisplacementSensor displacementSensor(HX711_DT_PIN, HX711_SCK_PIN, RAW_ZERO_DEFAULT, RAW_AT_20MM_DEFAULT);
LoadCellSensor loadCellSensor(HX711_DT_PIN, HX711_SCK_PIN, LOAD_CELL_SCALE_FACTOR);

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

const char *sensorIdByIndex(int sensorIndex) {
  if (sensorIndex == SENSOR_LOAD_CELL) {
    return "load_cell";
  }
  return "dt20b";
}

const char *sensorNameByIndex(int sensorIndex) {
  if (sensorIndex == SENSOR_LOAD_CELL) {
    return "Carga";
  }
  return "DT20B";
}

const char *sensorUnitByIndex(int sensorIndex) {
  if (sensorIndex == SENSOR_LOAD_CELL) {
    return "kg";
  }
  return "mm";
}

const char *sensorTelemetryLabelByIndex(int sensorIndex) {
  if (sensorIndex == SENSOR_LOAD_CELL) {
    return WEIGHT_LABEL;
  }
  return DISPLACEMENT_LABEL;
}

float sensorWarnThresholdByIndex(int sensorIndex) {
  if (sensorIndex == SENSOR_LOAD_CELL) {
    return LOAD_CELL_WARN_KG;
  }
  return DISPLACEMENT_WARN_MM;
}

float sensorCriticalThresholdByIndex(int sensorIndex) {
  if (sensorIndex == SENSOR_LOAD_CELL) {
    return LOAD_CELL_MAX_KG;
  }
  return DISPLACEMENT_MAX_MM;
}

void setNormalLed() {
  digitalWrite(PIN_RED, HIGH);
  digitalWrite(PIN_GREEN, LOW);
  digitalWrite(PIN_BLUE, HIGH);
}

void updateLedByThreshold(float value, float warningThreshold, float criticalThreshold, const char *sensorName) {
  if (value >= criticalThreshold) {
    digitalWrite(PIN_RED, LOW);
    digitalWrite(PIN_GREEN, HIGH);
    digitalWrite(PIN_BLUE, HIGH);
    Serial.print("Alerta critico ");
    Serial.println(sensorName);
    return;
  }

  if (value >= warningThreshold) {
    digitalWrite(PIN_RED, LOW);
    digitalWrite(PIN_GREEN, LOW);
    digitalWrite(PIN_BLUE, HIGH);
    Serial.print("Alerta aviso ");
    Serial.println(sensorName);
    return;
  }

  setNormalLed();
}

void showSelectionPreview(int sensorIndex) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Selecionar:");
  lcd.setCursor(0, 1);
  lcd.print(sensorNameByIndex(sensorIndex));
  lcd.print("      ");

  Serial.print("Selecao pendente: ");
  Serial.println(sensorIdByIndex(sensorIndex));
}

void showActiveSensorHeader() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(sensorNameByIndex(activeSensorIndex));
  lcd.print(":");
}

void initializeSensorByIndex(int sensorIndex) {
  if (sensorIndex == SENSOR_LOAD_CELL) {
    loadCellSensor.begin();
    loadCellSensor.tare();
    loadCellSensor.printCalibrationInfo();
  } else {
    displacementSensor.begin();
    displacementSensor.zeroReference();
    displacementSensor.printCalibrationInfo();
  }
}

void persistActiveSensor() {
  preferences.putUChar(NVS_SENSOR_KEY, (uint8_t)activeSensorIndex);
}

void activateSensor(int sensorIndex, bool saveToNvs) {
  activeSensorIndex = sensorIndex;
  pendingSensorIndex = -1;

  Serial.print("Sensor ativo: ");
  Serial.println(sensorIdByIndex(activeSensorIndex));

  showActiveSensorHeader();
  initializeSensorByIndex(activeSensorIndex);

  if (saveToNvs) {
    persistActiveSensor();
  }
}

void cycleSensorSelection() {
  if (pendingSensorIndex < 0) {
    pendingSensorIndex = activeSensorIndex;
  }

  pendingSensorIndex = (pendingSensorIndex + 1) % SENSOR_COUNT;
  pendingSelectionAt = millis();
  showSelectionPreview(pendingSensorIndex);
}

void confirmPendingSensorIfTimedOut() {
  if (pendingSensorIndex < 0) {
    return;
  }

  if (millis() - pendingSelectionAt < SENSOR_CONFIRM_TIMEOUT_MS) {
    return;
  }

  if (pendingSensorIndex != activeSensorIndex) {
    activateSensor(pendingSensorIndex, true);
  } else {
    pendingSensorIndex = -1;
    showActiveSensorHeader();
  }
}

void toggleDisplayBacklight() {
  displayOn = !displayOn;
  if (displayOn) {
    lcd.backlight();
  } else {
    lcd.noBacklight();
  }

  Serial.print("Display ");
  Serial.println(displayOn ? "ligado" : "desligado");
}

void handleSelectButton() {
  static int lastReading = HIGH;
  static int stableState = HIGH;
  static unsigned long lastDebounceAt = 0;
  static unsigned long pressedAt = 0;

  int reading = digitalRead(DISPLAY_BUTTON);

  if (reading != lastReading) {
    lastDebounceAt = millis();
    lastReading = reading;
  }

  if (millis() - lastDebounceAt < 25) {
    return;
  }

  if (reading == stableState) {
    return;
  }

  stableState = reading;
  if (stableState == LOW) {
    pressedAt = millis();
    return;
  }

  unsigned long pressDuration = millis() - pressedAt;
  if (pressDuration < 40) {
    return;
  }

  if (pressDuration >= LONG_PRESS_DISPLAY_MS) {
    pendingSensorIndex = -1;
    toggleDisplayBacklight();
    return;
  }

  cycleSensorSelection();
}

void handleCalibrationButton() {
  if (digitalRead(ZERO_BUTTON) != LOW) {
    return;
  }

  delay(50);
  if (digitalRead(ZERO_BUTTON) != LOW) {
    return;
  }

  unsigned long pressedAt = millis();
  while (digitalRead(ZERO_BUTTON) == LOW) {
    if (activeSensorIndex == SENSOR_DT20B && (millis() - pressedAt >= LONG_PRESS_20MM_MS)) {
      lcd.setCursor(0, 1);
      lcd.print("Solte p gravar20");
    }
    delay(10);
  }

  unsigned long pressDuration = millis() - pressedAt;

  if (activeSensorIndex == SENSOR_LOAD_CELL) {
    loadCellSensor.tare();
    delay(200);
    return;
  }

  if (pressDuration >= LONG_PRESS_20MM_MS) {
    displacementSensor.setSpanReference20mm();
  } else {
    displacementSensor.zeroReference();
  }

  delay(200);
}

float measureActiveSensor(bool clampOutput) {
  if (activeSensorIndex == SENSOR_LOAD_CELL) {
    return loadCellSensor.measureKilograms(clampOutput);
  }
  return displacementSensor.measureMillimeters(clampOutput);
}

void updateMainDisplay(float value, float temp, float humidity) {
  char line0[17];
  snprintf(line0, sizeof(line0), "%-6s%6.2f%-2s", sensorNameByIndex(activeSensorIndex), value,
           sensorUnitByIndex(activeSensorIndex));

  lcd.setCursor(0, 0);
  lcd.print("                ");
  lcd.setCursor(0, 0);
  lcd.print(line0);

  lcd.setCursor(0, 1);
  lcd.print(temp, 1);
  lcd.print("C ");
  lcd.print(humidity, 1);
  lcd.print("%   ");
}

void printSerialReadings(float value, float temp, float humidity) {
  Serial.print(sensorNameByIndex(activeSensorIndex));
  Serial.print(":");
  Serial.print(value, 3);
  Serial.print(" ");
  Serial.println(sensorUnitByIndex(activeSensorIndex));

  Serial.print("SensorType:");
  Serial.println(sensorIdByIndex(activeSensorIndex));

  Serial.print("Temperatura:");
  Serial.print(temp);
  Serial.println(" C");
  Serial.print("Umidade:");
  Serial.print(humidity);
  Serial.println("%");
}

void ensureMqttConnected() {
  if (ubidots.connected()) {
    return;
  }

  Serial.println("Erro na conexao MQTT");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Erro conexao!");
  lcd.setCursor(0, 1);
  lcd.print("Reconectando...");

  if (ubidots.connect()) {
    Serial.println("MQTT reconectado");
    showActiveSensorHeader();
  } else {
    Serial.println("Falha MQTT, nova tentativa no proximo ciclo");
  }

  delay(300);
}

void publishTelemetryIfDue() {
  if (!ubidots.connected()) {
    return;
  }

  if (millis() - publishTimer < PUBLISH_FREQUENCY) {
    return;
  }

  ubidots.add(sensorTelemetryLabelByIndex(activeSensorIndex), lastMeasurement);
  ubidots.add(SENSOR_TYPE_ID_LABEL, (float)activeSensorIndex);
  ubidots.add(TEMP_LABEL, lastTemp);
  ubidots.add(HMDT_LABEL, lastHumidity);
  ubidots.publish(DEVICE_LABEL);
  publishTimer = millis();
}

void readSensorsIfDue() {
  if (millis() - sampleTimer < SAMPLE_INTERVAL_MS) {
    return;
  }

  sampleTimer = millis();
  lastMeasurement = measureActiveSensor(true);
  lastTemp = bme.readTemperature();
  lastHumidity = bme.readHumidity();

  updateMainDisplay(lastMeasurement, lastTemp, lastHumidity);
  printSerialReadings(lastMeasurement, lastTemp, lastHumidity);

  updateLedByThreshold(lastMeasurement, sensorWarnThresholdByIndex(activeSensorIndex),
                       sensorCriticalThresholdByIndex(activeSensorIndex), sensorNameByIndex(activeSensorIndex));
}

void setup() {
  Serial.begin(57600);

  pinMode(ZERO_BUTTON, INPUT_PULLUP);
  pinMode(DISPLAY_BUTTON, INPUT_PULLUP);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE, OUTPUT);

  setNormalLed();

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

  preferences.begin(NVS_NAMESPACE, false);
  uint8_t storedSensor = preferences.getUChar(NVS_SENSOR_KEY, SENSOR_DT20B);
  if (storedSensor >= SENSOR_COUNT) {
    storedSensor = SENSOR_DT20B;
  }

  Serial.println("Botao vermelho: curto seleciona sensor, longo liga/desliga LCD");
  Serial.println("Botao azul: calibra sensor ativo");

  activateSensor((int)storedSensor, false);

  publishTimer = millis();
  sampleTimer = 0;
}

void loop() {
  handleSelectButton();
  confirmPendingSensorIfTimedOut();
  handleCalibrationButton();

  readSensorsIfDue();
  ensureMqttConnected();
  publishTelemetryIfDue();

  if (ubidots.connected()) {
    ubidots.loop();
  }
}
