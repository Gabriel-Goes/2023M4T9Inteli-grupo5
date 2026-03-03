#include <WiFi.h>
  #include <NTPClient.h>
  #include <WiFiUdp.h>
  #include <SD.h>
  const char* ssid = "Inteli-COLLEGE";
  const char* password = "QzaWxs@123";
  const char* ntpServer = "pool.ntp.org";
  const long gmtOffset_sec = -3 * 3600;
  const int daylightOffset_sec = 0;
  WiFiUDP ntpUDP;
  NTPClient timeClient(ntpUDP, ntpServer, gmtOffset_sec, daylightOffset_sec);
  const int chipSelect = 27; // SD card CS pin
  void setup() {
    Serial.begin(9600);
    // Connect to Wi-Fi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("WiFi connected");
    // Initialize time and SD card
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    timeClient.begin();
    if (!SD.begin(chipSelect)) {
      Serial.println("Failed to initialize SD card");
      return;
    }
  }
  void loop() {
    timeClient.update();
    char* formattedTime = pegarTime();
    float peso = 75.5; // Replace with actual weight reading
    Serial.println(formattedTime);
    Serial.println(formattedTime);
    char dataToSave[50];
    snprintf(dataToSave, sizeof(dataToSave), "%s : %.2f", formattedTime, peso);
    char fileName[50];
    snprintf(fileName, sizeof(fileName), "/dados_%s.txt", formattedTime);
    File dataFile = SD.open(fileName, FILE_WRITE);
    if (dataFile) {
      dataFile.println(dataToSave);
      dataFile.close();
      Serial.println("Data saved successfully in: " + String(fileName));
    } else {
      Serial.println("Error opening file");
    }
    delay(1000);
  }
  char* pegarTime() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
      return "Failed to obtain time";
    }
    static char dateTimeStr[50];
    strftime(dateTimeStr, sizeof(dateTimeStr), "%Y-%m-%d_%H-%M-%S", &timeinfo);
    return dateTimeStr;
  }