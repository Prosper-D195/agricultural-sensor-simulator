# Simulateur de capteur agricole

Projet pédagogique Node.js pour simuler, transmettre et stocker des mesures de capteurs agricoles (température et humidité du sol) via TCP et UDP.

## Fonctionnalités

- Simulateur de capteur `soil-01` générant des mesures réalistes
- Transmission des mesures via TCP et UDP
- Serveur de collecte avec validation des données
- Stockage dans un fichier CSV
- Journalisation des événements dans le terminal
- Gestion propre de l'arrêt (SIGINT, SIGTERM)

## Prérequis

- Node.js (v24)
- npm

## Installation

Aucune dépendance externe n'est nécessaire. Les modules utilisés sont natifs (`node:net`, `node:dgram`, `node:fs`, `node:path`).

```bash
git clone git@github.com:Prosper-D195/agricultural-sensor-simulator.git
cd agricultural-sensor-simulator
```

## Utilisation

### Démarrer le serveur

```bash
npm run server
```

Le serveur écoute sur :
- TCP : port 5000
- UDP : port 5001

### Lancer le simulateur TCP

```bash
npm run sensor:tcp
```

### Lancer le simulateur UDP

```bash
npm run sensor:udp
```

### Tester une mesure invalide

```bash
node src/test-invalid-reading.js
```

## Structure du projet

```text
agricultural-sensor-simulator/
├── data/
│   └── readings.csv
├── src/
│   ├── server.js
│   ├── sensor-simulator.js
│   └── test-invalid-reading.js
├── .gitignore
├── package.json
└── README.md
```

## Format des données

Les mesures sont envoyées au format JSON :

```json
{
  "sensorId": "soil-01",
  "temperature": 31.2,
  "humidity": 24.7,
  "timestamp": "2026-08-03T20:00:00Z"
}
```

- `temperature` : degrés Celsius (°C), entre 28 et 36
- `humidity` : pourcentage (%), entre 20 et 45
- `timestamp` : date ISO 8601 UTC

## Stockage CSV

Les mesures valides sont enregistrées dans `data/readings.csv` :

```csv
sensorId,temperature,humidity,timestamp,protocol
"soil-01","31.2","24.7","2026-08-03T20:00:00Z","TCP"
```

## Validation

Le serveur rejette les mesures si :
- le JSON est invalide
- `sensorId` est absent ou non chaîne
- `temperature` n'est pas un nombre
- `humidity` n'est pas un nombre ou hors de [0, 100]
- `timestamp` n'est pas une date valide

## Protocoles

| Critère | TCP | UDP |
|---|---|---|
| Connexion | Requise | Non requise |
| Fiabilité | Garantie | Non garantie |
| Réponse serveur | Oui (JSON) | Non |

## Licence

ISC

