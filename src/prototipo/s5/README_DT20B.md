# S5 - DT-20B (Deslocamento em mm)

Este firmware S5 foi adaptado para transdutor linear KYOWA/PEACOCK DT-20B (faixa 0-20 mm), mantendo leitura via HX711 nos cabos E+/E-/A+/A-.

## Telemetria

- Variavel principal Ubidots: `displacement_mm`
- Variaveis adicionais: `temperature`, `humidity`
- Device label atual: `balancairon`

## Calibracao

A conversao usa dois pontos:

- `RAW_ZERO_DEFAULT`: leitura bruta no ponto 0 mm
- `RAW_AT_20MM_DEFAULT`: leitura bruta no ponto 20 mm

Formula usada no firmware:

`mm = (raw - raw_zero) * 20.0 / (raw_at_20mm - raw_zero)`

Durante setup, o botao de zero (GPIO0) redefine o zero para a posicao atual em campo.

## Limiares de alerta (LED)

- Normal: `< 15 mm`
- Aviso: `>= 15 mm` e `< 20 mm`
- Critico: `>= 20 mm`

## Validacao em bancada

1. Ajustar sensor em posicao de referencia e acionar zero.
2. Confirmar leitura proxima de 0 mm no serial/LCD.
3. Aplicar deslocamento conhecido (ex.: ~10 mm) e conferir leitura.
4. Verificar publicacao em `displacement_mm` no Ubidots.
5. Verificar transicao de LED em aviso/critico.

## Observacao de build

`microSD.ino` foi movido para `src/prototipo/s5/experimentos/` para evitar conflito de `setup()/loop()` com o sketch principal.
