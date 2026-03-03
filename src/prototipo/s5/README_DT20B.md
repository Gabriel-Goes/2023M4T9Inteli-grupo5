# S5 - DT-20B (Deslocamento em mm)

Este documento consolida a migracao do S5 de peso (kg) para deslocamento (mm) usando o transdutor linear KYOWA/PEACOCK DT-20B (faixa 0-20 mm), mantendo leitura no HX711 pelos mesmos cabos E+/E-/A+/A-.

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
