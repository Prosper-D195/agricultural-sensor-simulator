const net = require("node:net");
const dgram = require("node:dgram");
const { validateReading } = require("./validation");
const { saveReadingToCsv } = require("./storage");
const { closeDatabase } = require("./database");

const HOST = "0.0.0.0";
const PORT = 5000;
const UDP_PORT = 5001;

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

function gracefulShutdown(signal) {
  console.log(`\nSignal ${signal} reçu : fermeture propre du serveur...`);

  server.close(() => {
    console.log("Serveur TCP fermé.");
  });

  udpServer.close(() => {
    console.log("Serveur UDP fermé.");
  });

  closeDatabase();
  console.log("Base SQLite fermée.");

  setTimeout(() => {
    console.error("Fermeture forcée après timeout.");
    process.exit(1);
  }, 5000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));