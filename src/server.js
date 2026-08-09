const net = require("node:net");
const dgram = require("node:dgram");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "127.0.0.1";
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

  fs.appendFileSync(CSV_FILE, `${row}\n`);

  console.log(`Mesure ${protocol} enregistrée dans le fichier CSV.`);
}

const server = net.createServer((socket) => {
  console.log("Un client TCP vient de se connecter.");

  socket.on("data", (data) => {
    const message = data.toString();

    console.log("Message reçu :", message);

    try {
      const reading = JSON.parse(message);

      const validation = validateReading(reading);

      if (!validation.valid) {
        console.error("Mesure rejetée :", validation.message);
        return;
      }

      saveReadingToCsv(reading);

      console.log("Mesure valide :", reading);
      console.log("Identifiant du capteur :", reading.sensorId);
      console.log("Température :", reading.temperature, "°C");
      console.log("Humidité :", reading.humidity, "%");
      console.log("Date :", reading.timestamp);
    } catch (error) {
      console.error("Le message reçu n'est pas un JSON valide.");
    }
  });

  socket.on("end", () => {
    console.log("Client TCP déconnecté.");
  });

  socket.on("error", (error) => {
    console.error("Erreur avec le client :", error.message);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Serveur TCP démarré sur ${HOST}:${PORT}`);
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

    console.log("Mesure UDP valide :", reading);
  } catch (error) {
    console.error("Le message UDP n'est pas un JSON valide.");
  }
});

udpServer.on("error", (error) => {
  console.error("Erreur du serveur UDP :", error.message);
  udpServer.close();
});

udpServer.bind(UDP_PORT, HOST, () => {
  console.log(`Serveur UDP démarré sur ${HOST}:${UDP_PORT}`);
});