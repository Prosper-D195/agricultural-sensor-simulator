const net = require("node:net");
const dgram = require("node:dgram");

const PROTOCOL = process.argv[2] || "tcp";

const HOST = "127.0.0.1";
const TCP_PORT = 5000;
const UDP_PORT = 5001;

const sensorReading = {
  sensorId: "soil-01",
  temperature: 31.2,
  humidity: 24.7,
  timestamp: "2026-08-03T20:00:00Z",
};

function startTcpSimulator() {
  const client = net.createConnection(
    {
      host: HOST,
      port: TCP_PORT,
    },
    () => {
      console.log(`Connecté au serveur TCP ${HOST}:${TCP_PORT}`);

      const message = JSON.stringify(sensorReading);

      client.write(message);

      console.log("Mesure TCP envoyée :", sensorReading);

      client.end();
    }
  );

  client.on("error", (error) => {
    console.error("Erreur de connexion TCP :", error.message);
  });

  client.on("close", () => {
    console.log("Connexion TCP fermée.");
  });
}

function startUdpSimulator() {
  const client = dgram.createSocket("udp4");
  const message = Buffer.from(JSON.stringify(sensorReading));

  client.send(message, UDP_PORT, HOST, (error) => {
    if (error) {
      console.error("Erreur d'envoi UDP :", error.message);
      client.close();
      return;
    }

    console.log(`Mesure UDP envoyée vers ${HOST}:${UDP_PORT}`);
    console.log("Mesure :", sensorReading);

    client.close();
  });
}

if (PROTOCOL === "tcp") {
  startTcpSimulator();
} else if (PROTOCOL === "udp") {
  startUdpSimulator();
} else {
  console.error("Protocole invalide. Utilise tcp ou udp.");
  process.exit(1);
}