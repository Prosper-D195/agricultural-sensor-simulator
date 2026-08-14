const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { promisify } = require("node:util");

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const CSV_PATH = path.join(__dirname, "..", "data", "readings.csv");
const SERVER_PORT = 5000;

// Helper : envoyer une mesure TCP et attendre la réponse


    function sendTcpMeasure(measure) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port: SERVER_PORT, host: "127.0.0.1" }, () => {
      client.write(JSON.stringify(measure) + "\n");
    });

    let response = "";

    client.on("data", (data) => {
      response += data.toString();
      // Le serveur envoie la réponse immédiatement, on peut fermer
      client.destroy();
    });

    client.on("close", () => {
      try {
        const json = JSON.parse(response.trim());
        resolve(json);
      } catch (e) {
        resolve({ raw: response });
      }
    });

    client.on("error", reject);

    // Timeout de sécurité
    setTimeout(() => {
      client.destroy();
      resolve({ timeout: true });
    }, 2000);
  });
}

// Helper : lire le CSV
async function readCsv() {
  try {
    const content = await readFile(CSV_PATH, "utf-8");
    return content.trim().split("\n");
  } catch (e) {
    return [];
  }
}

// Helper : compter les lignes (sans l'en-tête)
async function countCsvLines() {
  const lines = await readCsv();
  return lines.length > 0 ? lines.length - 1 : 0;
}

describe("Integration tests", () => {
  let serverProcess;
  let originalCsvContent = null;

  // Démarrer le serveur avant les tests
  beforeAll(async () => {
    // Sauvegarder le CSV actuel
    try {
      originalCsvContent = await readFile(CSV_PATH, "utf-8");
    } catch (e) {
      originalCsvContent = "";
    }

    // Démarrer le serveur
    serverProcess = spawn("node", ["src/server.js"], {
      cwd: path.join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Attendre que le serveur démarre
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  // Arrêter le serveur après les tests
  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill("SIGINT");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Restaurer le CSV
    if (originalCsvContent !== null) {
      await fs.promises.writeFile(CSV_PATH, originalCsvContent);
    }
  });

  test("mesure valide TCP est enregistrée", async () => {
    const measure = {
      sensorId: "soil-01",
      temperature: 31.2,
      humidity: 24.7,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const initialLines = await countCsvLines();

    const response = await sendTcpMeasure(measure);

    expect(response.success).toBe(true);

    const finalLines = await countCsvLines();
    expect(finalLines).toBeGreaterThan(initialLines);
  });

  test("mesure invalide (humidity > 100) est rejetée", async () => {
    const measure = {
      sensorId: "soil-01",
      temperature: 31.2,
      humidity: 125,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const initialLines = await countCsvLines();

    const response = await sendTcpMeasure(measure);

    expect(response.success).toBe(false);

    const finalLines = await countCsvLines();
    expect(finalLines).toBe(initialLines);
  });

  test("mesure invalide (temperature non nombre) est rejetée", async () => {
    const measure = {
      sensorId: "soil-01",
      temperature: "31.2",
      humidity: 24.7,
      timestamp: "2026-08-03T20:00:00Z",
    };

    const initialLines = await countCsvLines();

    const response = await sendTcpMeasure(measure);

    expect(response.success).toBe(false);

    const finalLines = await countCsvLines();
    expect(finalLines).toBe(initialLines);
  });

  test("plusieurs mesures valides sont enregistrées", async () => {
    const measures = [
      {
        sensorId: "soil-01",
        temperature: 30.1,
        humidity: 25.0,
        timestamp: "2026-08-03T20:01:00Z",
      },
      {
        sensorId: "soil-01",
        temperature: 30.2,
        humidity: 25.1,
        timestamp: "2026-08-03T20:02:00Z",
      },
      {
        sensorId: "soil-01",
        temperature: 30.3,
        humidity: 25.2,
        timestamp: "2026-08-03T20:03:00Z",
      },
    ];

    const initialLines = await countCsvLines();

    for (const measure of measures) {
      const response = await sendTcpMeasure(measure);
      expect(response.success).toBe(true);
    }

    const finalLines = await countCsvLines();
    expect(finalLines).toBe(initialLines + measures.length);
  });

  test("plusieurs capteurs sont enregistrés", async () => {
    const measures = [
      {
        sensorId: "soil-01",
        temperature: 30.1,
        humidity: 25.0,
        timestamp: "2026-08-03T20:10:00Z",
      },
      {
        sensorId: "soil-02",
        temperature: 29.5,
        humidity: 30.0,
        timestamp: "2026-08-03T20:10:00Z",
      },
      {
        sensorId: "soil-03",
        temperature: 31.0,
        humidity: 28.0,
        timestamp: "2026-08-03T20:10:00Z",
      },
    ];

    const initialLines = await countCsvLines();

    for (const measure of measures) {
      const response = await sendTcpMeasure(measure);
      expect(response.success).toBe(true);
    }

    const finalLines = await countCsvLines();
    expect(finalLines).toBe(initialLines + measures.length);

    // Vérifier que les 3 capteurs sont présents
    const lines = await readCsv();
    const hasSoil01 = lines.some((line) => line.includes("soil-01"));
    const hasSoil02 = lines.some((line) => line.includes("soil-02"));
    const hasSoil03 = lines.some((line) => line.includes("soil-03"));

    expect(hasSoil01).toBe(true);
    expect(hasSoil02).toBe(true);
    expect(hasSoil03).toBe(true);
  });
});