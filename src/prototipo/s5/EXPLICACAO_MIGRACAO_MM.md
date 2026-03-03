# Explicacao curta - migracao de kg para mm (S5)

## Como o codigo funciona agora

- O sinal do sensor continua entrando no HX711 (mesma ligacao E+/E-/A+/A-).
- O firmware le o valor bruto (`raw`) do HX711.
- Esse `raw` e convertido para deslocamento em milimetros com calibracao linear de 2 pontos.

Formula usada:

`mm = (raw - raw_zero) * 20.0 / (raw_at_20mm - raw_zero)`

## O que foi modificado para trocar de sensor

1. Removido o modelo de balanca (peso em `kg`).
2. Criada logica de deslocamento (`LinearDisplacementSensor`) em `mm`.
3. Botao de tare virou ajuste de referencia zero (`raw_zero`) na posicao atual.
4. Saidas de tela/serial trocadas de `kg` para `mm`.
5. Telemetria principal no Ubidots trocada de `weight` para `displacement_mm`.
6. Limites de LED adaptados para faixa de deslocamento (normal/aviso/critico em mm).
7. `microSD.ino` foi movido para `experimentos/` para evitar conflito de compilacao.

## Em uma frase

A mudanca funcionou porque o firmware deixou de interpretar o HX711 como peso e passou a interpretar como deslocamento linear calibrado em mm.
