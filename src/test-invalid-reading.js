const net = require("node:net");

const HOST = "127.0.0.1";
const PORT = 5000;

const invalidReading = {
  sensorId: "soil-01",
  temperature: 31.2,
  humidity: 125, // > 100, donc invalide
  timestamp: "2026-08-03T20:00:00Z",
};

const client = net.createConnection(
  {
    host: HOST,
    port: PORT,
  },
  () => {
    console.log(`Connecté au serveur TCP ${HOST}:${PORT}`);

    const message = JSON.stringify(invalidReading) + "\n";

    client.write(message);

    console.log("Mesure invalide envoyée :", invalidReading);
  }
);

client.on("data", (data) => {
  console.log("Réponse du serveur :", data.toString().trim());
  client.end();
});

client.on("error", (error) => {
  console.error("Erreur de connexion :", error.message);
});

client.on("close", () => {
  console.log("Connexion TCP fermée.");
});