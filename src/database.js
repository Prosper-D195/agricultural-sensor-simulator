const path = require("node:path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "readings.db");

const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    timestamp TEXT NOT NULL,
    protocol TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_readings_sensor_id
  ON readings(sensor_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_readings_timestamp
  ON readings(timestamp)
`);

const insertReading = db.prepare(`
  INSERT INTO readings (sensor_id, temperature, humidity, timestamp, protocol)
  VALUES (?, ?, ?, ?, ?)
`);

function saveReadingToDatabase(reading, protocol) {
  try {
    insertReading.run(
      reading.sensorId,
      reading.temperature,
      reading.humidity,
      reading.timestamp,
      protocol
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function closeDatabase() {
  db.close();
}

module.exports = {
  db,
  saveReadingToDatabase,
  closeDatabase,
};