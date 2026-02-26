//importação das bibliotecas
#include <HX711.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <UbidotsEsp32Mqtt.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <WiFi.h>

// cartao sd
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <SD.h>

#if __has_include("credentials.local.h")
#include "credentials.local.h"
#else
#error "Arquivo credentials.local.h ausente em src/prototipo/s5/. Defina: UBIDOTS_TOKEN, SSID e PW."
#endif

const char *DEVICE_LABEL = "balancairon";                           // Label do dispositivo onde os dados serão publicados
const char *WEIGHT_LABEL = "weight";                                // Variável (peso) do dispositivo onde os dados serão publicados
const char *TEMP_LABEL = "temperature";                             // Variável (temperatura) do dispositivo onde os dados serão publicados
const char *HMDT_LABEL = "humidity";                                // Variável (umidade) do dispositivo onde os dados serão publicados
const int PUBLISH_FREQUENCY = 2000;                                 // Frequência em milissegundos
unsigned long timer;
uint8_t analogPin = 34;                                             // Pin usado para ler dados do GPIO34 ADC_CH6.
const int pin_red = 15;                                               // Pino vermelho conectado ao LED que indica quando o peso máximo foi atingido
const int pin_green = 2;                                             // Pino verde conectado ao LED que indica quando o peso máximo foi atingido
const int pin_blue = 19;                                             // Pino azul conectado ao LED que indica quando o peso máximo foi atingido
const int tareButton = 0;
const int displayButton = 17;                                       // Pino do botão para ligar/desligar o display
bool displayOn = true;                                              // Inicialmente, o display está ligado
const int scale_tare = 219359.9079;


Ubidots ubidots(UBIDOTS_TOKEN); // Declaração do Ubidots
Adafruit_BME280 bme; // I2C
LiquidCrystal_I2C lcd(0x27, 16, 2); // Declaração do display lcd

// Classe para representar a célula de carga como uma balança
class DigitalScale {
private:
  HX711 scale; // Objeto da biblioteca HX711 para interagir com a célula de carga
  //int ledPin; // Pino conectado ao LED que indica quando o peso máximo foi atingido
  int redPin;
  int greenPin;
  int bluePin;
  float maxWeight; // Peso máximo que a balança pode medir antes de acionar o LED
  int dtPin;
  int sckPin;
  float scaleFactor;
  float cellMaxWeight;
public:
  // Construtor: inicializa a balança, configura os pinos e define o fator de escala
  DigitalScale(int dtPin, int sckPin, int redPin, int greenPin, int bluePin, float scaleFactor, float maxWeight, float cellMaxWeight)
      : redPin(redPin), greenPin(greenPin), bluePin(bluePin), maxWeight(maxWeight), dtPin(dtPin), sckPin(sckPin), scaleFactor(scaleFactor), cellMaxWeight(cellMaxWeight)  {
    pinMode(redPin, OUTPUT); // Configura o pino do LED como saída
    pinMode(greenPin, OUTPUT); // Configura o pino do LED como saída
    pinMode(bluePin, OUTPUT); // Configura o pino do LED como saída
    scale.begin(dtPin, sckPin); // Inicializa a balança
    scale.set_scale(scaleFactor); // Define o fator de escala para a conversão de unidades
    delay(2000); // Aguarda 2 segundos para estabilizar
  }

  // Função para zerar a balança
  void tara() {
    scale.tare();
    Serial.println("Balanca Zerada"); // Imprime uma mensagem no monitor serial
    lcd.setCursor(0,1);
    lcd.print("Balanca Zerada  "); // Imprime uma mensagem no monitor lcd
  }
  // Função para medir o peso atual, descontando a tara
  float measureWeight() {
    return scale.get_units(5); // Lê o peso atual, faz a média de 5 leituras e subtrai a tara
  }
  // Função para verificar se o peso máximo foi atingido e acionar o LED, caso atinja o peso máximo

  void checkMaxWeight() {
    float weight = measureWeight();                                 // Mede o peso atual com a função measureWeight
    if ((weight >= maxWeight) && (cellMaxWeight >= weight)) {       // Se o peso for maior ou igual ao máximo permitido
      digitalWrite(redPin, 0);                                      // Liga o LED vermelho
      digitalWrite(greenPin, 0);                                    // Liga o LED verde
      digitalWrite(bluePin, 255);                                   // Desliga o LED azul
      Serial.println("Peso maximo atingido!");                      // Imprime uma mensagem no monitor serial de alerta de excesso de peso
      lcd.setCursor(0, 1);                                          // Localiza o cursor do display para a segunda linha
      lcd.print("Peso maximo!    ");                                // Imprime uma mensagem no monitor lcd de alerta de excesso de peso
    } else if ((weight >= cellMaxWeight) && (weight > maxWeight)) { // Se o peso for maior ou igual ao peso limite físico da célula de carga
      digitalWrite(redPin, 0);                                      // Liga o LED vermelho
      digitalWrite(greenPin, 255);                                  // Desliga o LED verde
      digitalWrite(bluePin, 255);                                   // Desliga o LED azul
      Serial.println("Peso maximo da celula atingido!");            // Imprime uma mensagem no monitor serial de alerta de excesso de peso da célula
      lcd.setCursor(0, 1);                                          // localiza o cursor do display para a segunda linha
      lcd.print("Maximo da celula!    ");                           // Imprime uma mensagem no monitor lcd de alerta de excesso de peso da célula
    }
    else {
      digitalWrite(redPin, 255);                                    // Desliga o LED vermelho
      digitalWrite(greenPin, 0);                                    // Liga o LED verde
      digitalWrite(bluePin, 255);                                   // Desliga o LED azul
    }
  }

};

// Função de callback para mensagens recebidas
void callback(char *topic, byte *payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
   // Imprime a carga útil da mensagem
  for (int i = 0; i < length; i++)
  {
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
    B11111
};// criação do caracter de teste do display

// Cria um objeto da classe DigitalScale com os pinos e parâmetros especificados
DigitalScale myScale(4, 18, pin_red, pin_green, pin_blue, scale_tare, 1, 2); // nesse caso, foi especifidado o pino do LED 5, peso máximo de 1kg e a escala conforme calibração

void setup() {
  Serial.begin(57600); // Inicializa a comunicação serial com uma taxa de 57600 bps
  pinMode(tareButton, INPUT_PULLDOWN); // Configura o pino do botão como INPUT_PULLUP para evitar resistor externo
  pinMode(displayButton, INPUT_PULLUP);
  lcd.init(); // inicia o dislay lcd
  lcd.backlight(); // ativa a luz de fundo do display
  lcd.createChar(0, barra);
    // Exibe o caractere personalizado em todas as posições do LCD
  for (int i = 0; i < 32; i++) {
    lcd.setCursor(i % 16, i / 16);  // Defina a posição do cursor
    lcd.write(byte(0));             // Escreva o caractere personalizado
    delay(100);                     // Aguarde um curto período de tempo para observar o display
  }
  delay(1000);
  lcd.clear(); // Limpa o display LCD
  lcd.print("Bem vindo!"); // Exibe a mensagem "Bem vindo!" no display LCD
  lcd.clear();
  bool status;
  status = bme.begin(0x76); // Inicializa o sensor BME280 com o endereço I2C 0x76
  if (!status) {
    Serial.println("Sensor BME280 não encontrado, cheque a fiação!"); // Imprime no console se o sensor BME280 não for encontrado
    lcd.print("sensor temp");                                       // Imprime no diplay que há um problema no sensor de temperatura
    lcd.setCursor(0,1);
    lcd.print("desconectado!");
    delay(1000);
  };
  delay(1000);
  lcd.print("conectando wifi");
  ubidots.connectToWifi(SSID, PW); // Conecta-se à rede Wi-Fi usando credenciais do credentials.local.h
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("conectando ao");
  lcd.setCursor(0,1);
  lcd.print("servidor...");
  ubidots.setCallback(callback); // Configura a função de retorno de chamada para o cliente Ubidots
  ubidots.setup(); // Configuração inicial do cliente Ubidots
  if (!ubidots.connect()) {
    Serial.println("Falha ao conectar MQTT no setup");
  }
  timer = millis();// Inicializa a variável de temporização com o tempo atual em milissegundos
  delay(1000);

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Peso:");
  myScale.tara();

}
void loop() {
  // Mede o peso atual e imprime no monitor serial
  float weight = myScale.measureWeight();
  float temp = bme.readTemperature();
  float humidity = bme.readHumidity();
  lcd.setCursor(6, 0); // Muda o cursor para atualizar o valor do peso
  lcd.print(weight, 3); // Printa o valor medida na célula de carga no display
  lcd.print("kg   "); // Exibe a unidade de medida
  Serial.print("Peso:"); // Exibe a mensagem peso no monitor serial
  Serial.print(weight, 3); //
  Serial.println(" kg"); // Printa o valor medida na célula de carga do monitor serial
  Serial.print("Temperatura:");
  Serial.print(temp);
  Serial.println("°C");
  Serial.print(humidity);
  Serial.println("%   ");

  // Atualiza o display LCD com a temperatura e umidade
  lcd.setCursor(0, 1); // Muda o cursor para a segunda linha do display
  lcd.print(temp, 1); // Exibe a temperatura no display com uma casa decimal
  lcd.print("*C  ");
  lcd.print(humidity, 1); // Exibe a umidade no display com uma casa decimal
  lcd.print("%");

  // Verifica se o peso máximo foi atingido
  myScale.checkMaxWeight();
  delay(1000); // Aguarda 1 segundo antes de fazer a próxima leitura

  // Reconecta ao servidor Ubidots se não estiver conectado
  if (!ubidots.connected()) {
    Serial.println("Erro na conexao MQTT");
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Erro na conexao!");
    lcd.setCursor(0,1);
    lcd.print("Reconectando...");
    if (ubidots.connect()) {
      Serial.println("MQTT reconectado");
      lcd.clear();
    } else {
      Serial.println("Falha MQTT, nova tentativa no proximo ciclo");
    }
    delay(300);
  }
  // Publica os dados no servidor Ubidots com a frequência especificada
  if (ubidots.connected() && labs(millis() - timer) > PUBLISH_FREQUENCY) {
    ubidots.add(WEIGHT_LABEL, weight);   // Adiciona o valor do peso aos dados a serem publicados
    ubidots.add(TEMP_LABEL, temp);       // Adiciona o valor da temperatura aos dados a serem publicados
    ubidots.add(HMDT_LABEL, humidity);   // Adiciona o valor da umidade aos dados a serem publicados
    ubidots.publish(DEVICE_LABEL);       // Publica os dados no servidor Ubidots
    timer = millis();
  }
  if (ubidots.connected()) {
    ubidots.loop(); // Executa o loop do cliente Ubidots para manter a comunicação
  }
  delay(1000);
    // Verifica se o botão foi pressionado para zerar a balança

  if (digitalRead(displayButton) == LOW) {
    delay(50);  // Debounce (evita leituras instáveis)
    if (digitalRead(displayButton) == LOW) {
      // Inverte o estado do display (liga/desliga)
      displayOn = !displayOn;
      // Ligar ou desligar o display com base no estado
      if (displayOn) {
        lcd.backlight();  // Ligar o backlight
      } else {
        lcd.noBacklight();  // Desligar o backlight
      }
      // Aguarda um curto período para evitar múltiplas leituras do botão
      delay(500);
    }
  };
  if (digitalRead(tareButton) == LOW) {
    myScale.tara(); // Zera a balança
  }
}
