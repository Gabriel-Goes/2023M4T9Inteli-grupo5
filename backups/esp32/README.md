# ESP32 Backup and Restore

## Device
- Port: `/dev/ttyUSB0`
- Chip: `ESP32-D0WD-V3`
- Flash size: `4MB`

## Backup (current firmware before update)
- File: `backups/esp32/esp32_flash_backup_20260225_201918_4MB.bin`
- SHA256: `d0dcacae2c5d114cfd7638bbd11fb73c6d5fe097b18c978a7df46f4a7f6fc00a`

## New firmware flashed (latest)
- Sketch base: `src/prototipo/s5/s5.ino`
- Board/FQBN: `esp32:esp32:esp32doit-devkit-v1`
- Wi-Fi: `Caju` (`2.4 GHz`)
- Merged image saved as: `backups/esp32/esp32_new_s5_caju_merged_20260225_203255.bin`
- SHA256: `76dbb9f885c5b7d51a45abdb1cbeb56425d81f18916bb9a8fa287b86bb7f1070`

## Restore old firmware (rollback)
Close any serial monitor first, then run:

```bash
~/.arduino15/packages/esp32/tools/esptool_py/5.1.0/esptool \
  --port /dev/ttyUSB0 --baud 460800 \
  write-flash 0x000000 backups/esp32/esp32_flash_backup_20260225_201918_4MB.bin
```

## Reflash the new merged image

```bash
~/.arduino15/packages/esp32/tools/esptool_py/5.1.0/esptool \
  --port /dev/ttyUSB0 --baud 460800 \
  write-flash 0x000000 backups/esp32/esp32_new_s5_caju_merged_20260225_203255.bin
```
