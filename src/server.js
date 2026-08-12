const net = require("node:net");
const dgram = require("node:dgram");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "0.0.0.0";
const PORT = 5000;
const UDP_PORT = 5001;

const DATA_DIR = path.join(__dirname, "..", "data");
const CSV_FILE = path.join(DATA_DIR, "readings.csv");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(
    CSV_FILE,
    "sensorId,temperature,humidity,timestamp,protocol\n"
  );
}

function validateReading(reading) {
  if (!reading || typeof reading !== "object") {
    return {
      valid: false,
      message: "La mesure doit être un objet.",
    };
  }

  if (
    typeof reading.sensorId !== "string" ||
    reading.sensorId.trim() === ""
  ) {
    return {
      valid: false,
      message: "sensorId doit être une chaîne non vide.",
    };
  }

  if (
    typeof reading.temperature !== "number" ||
    Number.isNaN(reading.temperature)
  ) {
    return {
      valid: false,
      message: "temperature doit être un nombre.",
    };
  }

  if (
    typeof reading.humidity !== "number" ||
    Number.isNaN(reading.humidity)
  ) {
    return {
      valid: false,
      message: "humidity doit être un nombre.",
    };
  }

  if (reading.humidity < 0 || reading.humidity > 100) {
    return {
      valid: false,
      message: "humidity doit être comprise entre 0 et 100.",
    };
  }

  if (
    typeof reading.timestamp !== "string" ||
    Number.isNaN(Date.parse(reading.timestamp))
  ) {
    return {
      valid: false,
      message: "timestamp doit être une date valide.",
    };
  }

  return {
    valid: true,
    message: "Mesure valide.",
  };
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
}

const server = net.createServer((socket) => {
  console.log(
    `Client TCP connecté : ${socket.remoteAddress}:${socket.remotePort}`
  );

  let buffer = "";

  socket.on("data", (data) => {
    buffer += data.toString();

    const messages = buffer.split("\n");
    buffer = messages.pop();

    for (const message of messages) {
      if (!message.trim()) continue;

      console.log("Message reçu :", message);

      try {
        const reading = JSON.parse(message);

        const validation = validateReading(reading);

        if (!validation.valid) {
          console.error("Mesure rejetée :", validation.message);

          const response = {
            success: false,
            message: validation.message,
          };

          socket.write(JSON.stringify(response) + "\n");
          return;
        }

        saveReadingToCsv(reading, "TCP");

        console.log(
          `[TCP] Mesure enregistrée : ${reading.sensorId} | ` +
            `${reading.temperature}°C | ${reading.humidity}%`
        );

        const response = {
          success: true,
          message: "Mesure enregistrée",
        };

        socket.write(JSON.stringify(response) + "\n");
      } catch (error) {
        console.error("Le message reçu n'est pas un JSON valide.");

        const response = {
          success: false,
          message: "JSON invalide",
        };

        socket.write(JSON.stringify(response) + "\n");
      }
    }
  });

  socket.on("end", () => {
    console.log("Client TCP déconnecté.");
  });

  socket.on("error", (error) => {
    console.error("Erreur avec le client :", error.message);
  });
});

server.listen(PORT, () => {
  console.log(`Serveur TCP démarré sur le port ${PORT}`);
});

server.on("error", (error) => {
  console.error("Erreur du serveur TCP :", error.message);
});

const udpServer = dgram.createSocket("udp4");

udpServer.on("message", (message, remote) => {
  console.log(
    `Message UDP reçu de ${remote.address}:${remote.port}`
  );

  const messageText = message.toString();

  try {
    const reading = JSON.parse(messageText);

    const validation = validateReading(reading);

    if (!validation.valid) {
      console.error("Mesure UDP rejetée :", validation.message);
      return;
    }

    saveReadingToCsv(reading, "UDP");

    console.log(
      `[UDP] Mesure enregistrée : ${reading.sensorId} | ` +
        `${reading.temperature}°C | ${reading.humidity}%`
    );
  } catch (error) {
    console.error("Le message UDP n'est pas un JSON valide.");
  }
});

udpServer.on("error", (error) => {
  console.error("Erreur du serveur UDP :", error.message);
  udpServer.close();
});

udpServer.bind(UDP_PORT, () => {
  console.log(`Serveur UDP démarré sur le port ${UDP_PORT}`);
});