const fs = require("node:fs");
const path = require("node:path");
const { saveReadingToDatabase } = require("./database");

const DATA_DIR = path.join(__dirname, "..", "data");
const CSV_FILE = path.join(DATA_DIR, "readings.csv");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(
    CSV_FILE,
    "sensorId,temperature,humidity,timestamp,protocol\n"
  );
}

function saveReadingToCsv(reading, protocol = "TCP") {
  const row = [
    reading.sensorId,
    reading.temperature,
    reading.humidity,
    reading.timestamp,
    protocol,
  ]
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
    .join(",");

  try {
    fs.appendFileSync(CSV_FILE, `${row}\n`);
    console.log(`Mesure ${protocol} enregistrée dans le fichier CSV.`);
  } catch (error) {
    console.error(`Erreur d'écriture CSV (${protocol}) :`, error.message);
  }

  const result = saveReadingToDatabase(reading, protocol);

  if (result.success) {
    console.log(`Mesure ${protocol} enregistrée dans la base SQLite.`);
  } else {
    console.error(`Erreur d'écriture SQLite (${protocol}) :`, result.error);
  }
}

module.exports = {
  saveReadingToCsv,
};