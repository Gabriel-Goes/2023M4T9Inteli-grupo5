# Project Structure

Root: `/home/ipt/projetos/SOC/2023M4T9Inteli-grupo5`

## Directory Tree (up to 3 levels)

```
.
├── README.md
├── assets/
├── backups/
│   └── esp32/
├── document/
│   └── outros/
│       └── img/
└── src/
    └── prototipo/
        ├── s1/
        ├── s2/
        ├── s3/
        ├── s4/
        └── s5/
```

## Module Organization

### Firmware prototypes

- Location: `src/prototipo/`
- Purpose: chronological firmware evolution
- Key files:
  - `src/prototipo/s5/s5.ino`
  - `src/prototipo/s5/credentials.local.h`
  - `src/prototipo/s5/microSD.ino`

### Documentation

- Location: `README.md`, `document/`
- Purpose: project context, process docs, images

## Where Things Live

- Sensor logic and control loop: `src/prototipo/s*/s*.ino`
- Cloud integration: same firmware files (`Ubidots` calls)
- Environment sensors: same firmware files (`Adafruit_BME280`)
- Local config/secrets: `src/prototipo/s5/credentials.local.h` (not for versioning)
