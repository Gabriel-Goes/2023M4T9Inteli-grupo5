# Project Roadmap - S5 DT-20B

Updated: 2026-03-03

## Horizonte atual

1. Fechar migracao de medicao para deslocamento (mm) com validacao completa de bancada.
2. Melhorar estabilidade de leitura em repouso para reduzir ruido perceptivel no display.
3. Preparar documentacao operacional final para handoff tecnico e executivo.

## Itens de roadmap (curto prazo)

### RDM-00 - Estrutura multi-sensor para ensaios de laboratorio (proposta Fabio)

Contexto:
- O laboratorio utiliza sensores distintos em ensaios diferentes.
- A proposta e transformar o ESP32 em plataforma de aquisicao multi-sensor, com troca operacional via botoes sem regravar firmware.

Objetivo:
- Permitir selecionar o perfil de sensor no botao vermelho e calibrar o sensor ativo no botao azul.

Escopo V1:
- Perfis suportados: `DT-20B (mm)` e `Celula de carga (kg)`.
- Botao vermelho:
  - clique curto: percorre lista de sensores.
  - confirmacao automatica por timeout.
  - clique longo: liga/desliga backlight do LCD.
- Botao azul:
  - DT-20B: curto = zero, longo = referencia 20 mm.
  - Celula de carga: tara (zero) com escala fixa.
- Persistencia em NVS do ultimo sensor selecionado.
- Telemetria por label do sensor ativo + `sensor_type_id`.

Criterios de aceite:
1. Troca de sensor funcional sem recompilar firmware.
2. Sensor selecionado mantido apos reboot.
3. Calibracao operacional por botao azul conforme perfil ativo.
4. LCD e serial exibem valor com unidade correta (`mm` ou `kg`).
5. Publicacao MQTT com label do sensor ativo e campo identificador do tipo.

Status:
- Implemented (firmware em branch de trabalho)

---

### RDM-01 - Verificacao e mitigacao de ruido de sinal em repouso

Contexto:
- Com `zero` ajustado e DT-20B em repouso mecanico, a leitura no display oscila em poucas casas decimais.

Objetivo:
- Caracterizar o ruido em condicao de repouso e definir estrategia de mitigacao no firmware sem perder resposta util da medicao.

Escopo:
- Aquisição e analise de amostras de leitura crua do HX711 em repouso.
- Medicao da variacao em `mm` apos conversao.
- Definicao de abordagem de filtragem/estabilizacao para exibicao e telemetria.

Fora de escopo:
- Troca de hardware (HX711/transdutor).
- Redesenho eletrico da placa.

Criterios de aceite:
1. Procedimento de teste em repouso documentado (duracao, taxa de amostragem, condicao mecanica).
2. Faixa de oscilacao em repouso quantificada e registrada.
3. Regra de estabilizacao aprovada para exibicao (ex.: filtro movel, janela morta, histerese ou combinacao).
4. Validacao de que a mitigacao nao mascara deslocamentos reais pequenos.

Entregaveis:
1. Relatorio curto de bancada com ruido baseline e ruido apos mitigacao.
2. Atualizacao de firmware com estrategia escolhida.
3. Atualizacao do `README_DT20B.md` com comportamento de estabilidade em repouso.

Status:
- Planned

---

### RDM-02 - Validacao final de operacao em campo

Objetivo:
- Concluir ciclo de validacao final da branch em ambiente de uso.

Criterios de aceite:
1. Publicacao `displacement_mm` validada no Ubidots apos ajustes finais.
2. Limiares de LED validados em transicao normal/aviso/critico.
3. Calibracao 0 mm e 20 mm repetivel em multiplas tentativas.

Status:
- In progress

---

### RDM-03 - Handoff de documentacao para gestao

Objetivo:
- Consolidar leitura executiva sobre perifericos, calibracao e operacao do prototipo.

Criterios de aceite:
1. Documento de perifericos com cores e diagrama renderizado no GitHub.
2. Riscos e pendencias fisicas claramente sinalizados.
3. Conteudo revisado para leitura por publico nao tecnico.

Status:
- In progress
