# Resumo de Alteracoes - ESP32 (2026-02-26)

## Objetivo desta iteracao
- Corrigir/validar serial (`tty`/baud).
- Fazer backup completo do firmware atual.
- Atualizar firmware principal (`s5`) com nova rede Wi-Fi.
- Remover travamento em `conectando ao servidor...`.

## Alteracoes realizadas

### 1) Diagnostico serial
- Porta identificada: `/dev/ttyUSB0`.
- Baud confirmado: `57600`.
- Conflito inicial de acesso resolvido (processo `tio` ocupando a porta).

### 2) Backup completo da flash do ESP32
- Chip detectado: `ESP32-D0WD-V3`.
- Tamanho de flash: `4MB`.
- Backup gerado:
  - `backups/esp32/esp32_flash_backup_20260225_201918_4MB.bin`
  - SHA256: `d0dcacae2c5d114cfd7638bbd11fb73c6d5fe097b18c978a7df46f4a7f6fc00a`

### 3) Preparacao do ambiente de compilacao
- Instalacao de bibliotecas Arduino necessarias para compilar `s5.ino` no ambiente atual.
- Ajuste para uso da biblioteca Ubidots compativel com include `UbidotsEsp32Mqtt.h`.

### 4) Atualizacao do firmware principal (`src/prototipo/s5/s5.ino`)
- Wi-Fi atualizado para:
  - SSID: `Caju`
  - Senha: `Grumixama42@!`
- Observacao de hardware registrada: ESP32 usado suporta apenas `2.4 GHz` (sem `5 GHz`).
- Ajuste de conexao MQTT para nao bloquear o boot:
  - Removido `ubidots.reconnect()` bloqueante no `setup`.
  - Passou para `ubidots.connect()` com tratamento de falha.
  - Reconexao no `loop` em modo nao bloqueante.
  - Publicacao e `ubidots.loop()` apenas quando conectado.

### 5) Gravações realizadas
- Firmware `s5` compilado e enviado para `/dev/ttyUSB0` (FQBN `esp32:esp32:esp32doit-devkit-v1`).
- Binario consolidado com rede `Caju` salvo em:
  - `backups/esp32/esp32_new_s5_caju_merged_20260225_203255.bin`
  - SHA256: `76dbb9f885c5b7d51a45abdb1cbeb56425d81f18916bb9a8fa287b86bb7f1070`

### 6) Documentacao de operacao
- Criado/atualizado:
  - `backups/esp32/README.md`
- Contem comandos de rollback para firmware antigo e reflash da versao nova.

## Estado atual
- Dispositivo chega na tela `Peso` (loop principal ativo).
- Medicao local esta funcional.
- Conexao MQTT ainda precisa de investigacao dedicada.

## Proxima iteracao (planejada)
- Foco exclusivo em diagnostico MQTT:
  - Validar conectividade da rede para broker MQTT (porta/saida).
  - Validar token, device label e variaveis no Ubidots.
  - Coletar logs seriais de conexao com debug.
  - Ajustar estrategia de retry/telemetria conforme resultado.

