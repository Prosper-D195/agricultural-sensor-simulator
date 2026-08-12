const net = require("node:net");
const dgram = require("node:dgram");

const PROTOCOL = process.argv[2] || "tcp";

const HOST = "127.0.0.1";
const TCP_PORT = 5000;
const UDP_PORT = 5001;

function createReading() {
  return {
    sensorId: "soil-01",
    temperature: Number((28 + Math.random() * 8).toFixed(1)),
    humidity: Number((20 + Math.random() * 25).toFixed(1)),
    timestamp: new Date().toISOString(),
  };
}

function startTcpSimulator() {
  const client = net.createConnection(
    {
      host: HOST,
      port: TCP_PORT,
    },
    () => {
      console.log(`Connecté au serveur TCP ${HOST}:${TCP_PORT}`);

      sendReading();

      setInterval(sendReading, 5000);
    }
  );

  function sendReading() {
    const reading = createReading();

    const message = JSON.stringify(reading) + "\n";

    client.write(message);

    console.log("Mesure TCP envoyée :", reading);
  }

  client.on("error", (error) => {
    console.error("Erreur de connexion TCP :", error.message);
  });

  client.on("close", () => {
    console.log("Connexion TCP fermée.");
  });
}

function startUdpSimulator() {
  const client = dgram.createSocket("udp4");

  function sendReading() {
    const reading = createReading();

    const message = Buffer.from(JSON.stringify(reading));

    client.send(message, UDP_PORT, HOST, (error) => {
      if (error) {
        console.error("Erreur d'envoi UDP :", error.message);
        return;
      }

      console.log("Mesure UDP envoyée :", reading);
    });
  }

  console.log(`Envoi de mesures UDP vers ${HOST}:${UDP_PORT} toutes les 5 secondes`);

  sendReading();

  const interval = setInterval(sendReading, 5000);

  process.on("SIGINT", () => {
    clearInterval(interval);
    client.close();
    console.log("Simulateur UDP arrêté.");
    process.exit(0);
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