# S5 - DT-20B (Deslocamento em mm)

Este documento consolida a migracao do S5 de peso (kg) para deslocamento (mm) e descreve os perifericos fisicos do prototipo para leitura tecnica e executiva.

## Visao executiva

- Sensor principal atual: transdutor linear DT-20B (0-20 mm).
- Unidade principal do sistema: `mm` (LCD, serial e Ubidots).
- Botao azul: calibracao de zero e span.
- Botao vermelho: liga/desliga o backlight do LCD (funcao no firmware).
- Indicacao local: LED RGB por faixas de deslocamento.
- Display local: LCD 16x2 via I2C.

## Perifericos da placa (fisico + firmware)

| Periferico | Cor fisica | Funcao operacional | GPIO/Interface | Conector/ligacao | Estado atual | Observacoes |
| --- | --- | --- | --- | --- | --- | --- |
| `BUTTON_ZERO` | Azul | Calibracao: toque curto = `raw_zero`; segurar 3s e soltar = `raw_at_20mm` | `GPIO0` | Entrada digital de botao no ESP32 | Funcao confirmada em firmware, cor confirmada | Posicao/etiqueta fisica: `PENDENTE DE VALIDACAO`; tipo do botao: `PENDENTE` |
| `BUTTON_DISPLAY` | Vermelho | Alterna backlight do LCD (on/off) | `GPIO17` | Entrada digital de botao no ESP32 | Funcao confirmada em firmware, cor confirmada | Registrado como botao de display no firmware; nao documentar como reset logico |
| `LED_RGB` | `PENDENTE DE VALIDACAO` | Indicacao de estado (normal/aviso/critico) | `GPIO15` (R), `GPIO2` (G), `GPIO19` (B) | Saidas digitais para LED RGB | GPIOs confirmados em firmware | Mapeamento canal-cor final depende da montagem fisica |
| `LCD` | Backlight branca | Exibicao local de deslocamento, temperatura e umidade | I2C (`0x27`) | Barramento I2C no ESP32 | Interface confirmada em firmware | Modelo fisico exato: `PENDENTE DE VALIDACAO` |
| `HX711` | `PENDENTE DE VALIDACAO` | Conversao da ponte de medicao para leitura digital | `DT=GPIO4`, `SCK=GPIO18` | Ponte E+/E-/A+/A- | Interface confirmada em firmware | Caminho de sinal mantido na migracao para mm |
| Conector de alimentacao | Preto e vermelho | Alimentacao do prototipo | Alimentacao DC | Cabos de energia | Cor confirmada | Tensao/corrente nominal: `PENDENTE DE VALIDACAO` |
| Conector de dados do sensor | Branco e verde | Caminho de dados do sensor | Dados do circuito de medicao | Cabos de dados | Cor confirmada | Mapa exato por borne/pino fisico: `PENDENTE DE VALIDACAO` |

## Diagrama textual (UML simplificado)

```plantuml
@startuml
skinparam monochrome true
skinparam componentStyle rectangle

component "ESP32" as ESP32
component "BUTTON_ZERO\nAzul\nGPIO0" as BTN_ZERO
component "BUTTON_DISPLAY\nVermelho\nGPIO17" as BTN_DISP
component "LED_RGB\nGPIO15/2/19" as LED
component "LCD 16x2 I2C\nAddr 0x27\nBacklight branca" as LCD
component "HX711\nDT=GPIO4\nSCK=GPIO18" as HX
component "Transdutor DT-20B\n(ponte E+/E-/A+/A-)" as DT20B
component "Conector alimentacao\nPreto/Vermelho" as PWR
component "Conector dados\nBranco/Verde" as DATA

BTN_ZERO --> ESP32 : botao de calibracao
BTN_DISP --> ESP32 : botao display on/off
ESP32 --> LED : sinalizacao local
ESP32 --> LCD : I2C
DT20B --> HX : ponte de medicao
HX --> ESP32 : sinal digital (DT/SCK)
PWR --> ESP32 : energia
DATA --> HX : caminho de dados sensor
@enduml
```

## Legenda de cores e convencoes

- Azul: botao de calibracao (`BUTTON_ZERO`).
- Vermelho: botao de display (`BUTTON_DISPLAY`).
- Preto/Vermelho: conector de alimentacao.
- Branco/Verde: conector de dados do sensor.
- Itens marcados como `PENDENTE DE VALIDACAO` precisam confirmacao visual final na bancada.

## Como o codigo funciona agora

- O firmware le o valor bruto (`raw`) do HX711.
- O `raw` e convertido para deslocamento em milimetros por calibracao linear de 2 pontos.
- A unidade principal em LCD, serial e telemetria e `mm`.

Formula:

`mm = (raw - raw_zero) * 20.0 / (raw_at_20mm - raw_zero)`

## O que foi modificado na migracao

1. Removido o modelo de balanca (peso em `kg`) para o sinal principal.
2. Adotada logica de deslocamento (`LinearDisplacementSensor`) em `mm`.
3. Botao ZERO passou a operar calibracao de dois pontos em campo.
4. Saidas de tela e serial atualizadas para `mm`.
5. Telemetria principal no Ubidots trocada para `displacement_mm`.
6. Limiares de LED adaptados para faixa de deslocamento.
7. `microSD.ino` movido para `src/prototipo/s5/experimentos/` para evitar conflito de compilacao.

## Calibracao em campo (botao ZERO - GPIO0)

- Toque curto: grava referencia de 0 mm (`raw_zero`) na posicao atual.
- Segurar por 3 segundos: entra em modo de calibracao de span de 20 mm.
- Soltar o botao: grava referencia de 20 mm (`raw_at_20mm`) na posicao atual.

Constantes usadas:

- `RAW_ZERO_DEFAULT`: leitura bruta inicial para 0 mm.
- `RAW_AT_20MM_DEFAULT`: leitura bruta inicial para 20 mm.

## Telemetria

- Variavel principal Ubidots: `displacement_mm`
- Variaveis adicionais: `temperature`, `humidity`
- Device label atual: `balancairon`

## Limiares de alerta (LED)

- Normal: `< 15 mm`
- Aviso: `>= 15 mm` e `< 20 mm`
- Critico: `>= 20 mm`

## Validacao em bancada

1. Posicionar sensor em referencia mecanica e executar toque curto (zero).
2. Confirmar leitura proxima de 0 mm no serial/LCD.
3. Aplicar deslocamento conhecido e conferir leitura em mm.
4. Para span, segurar ZERO por 3s, ajustar para referencia de 20 mm e soltar para gravar.
5. Verificar publicacao em `displacement_mm` no Ubidots.
6. Verificar transicao de LED em normal/aviso/critico.

## Pendencias de identificacao fisica

1. Posicao/etiqueta fisica exata dos dois botoes na placa final.
2. Tipo fisico de cada botao (momentaneo, trava, etc.).
3. Tipo fisico do LED RGB e mapeamento final cor x canal na montagem.
4. Modelo fisico final do LCD (fabricante/modulo I2C).
5. Mapa final de conectores por posicao fisica (ex.: J1/J2/bornes).
