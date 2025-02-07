const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// App initialization
const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Configuration du port série pour lire les données de l'Arduino
const port = new SerialPort({
  path: "COM3", // Vérifiez que le chemin est correct pour votre système
  baudRate: 9600,
});
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// Création du serveur WebSocket sur le port 8000
const wss = new WebSocket.Server({ port: 8000 });

wss.on("connection", (ws) => {
  console.log("Client connecté");

  // Envoi d'un message de bienvenue au client
  ws.send(JSON.stringify({ message: "Connexion établie" }));

  // Lorsque le client se déconnecte
  ws.on("close", () => {
    console.log("Client déconnecté");
  });
});

// Lecture des données du port série et transmission aux clients WebSocket
parser.on("data", (line) => {
  let data = line.trim();

  // Essayer de parser la ligne en JSON pour les touches
  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    parsedData = null;
  }

  if (parsedData && parsedData.key) {
    // Si le JSON possède une propriété "key", on traite comme une touche
    console.log("Touche reçue de l'Arduino:", parsedData.key);

    // Envoyer la touche pressée à tous les clients connectés via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "keypad",
            value: parsedData.key,
          })
        );
      }
    });
  } else {
    // Sinon, on traite comme des données RFID
    console.log("Données RFID reçues de l'Arduino:", data);

    // Envoyer les données RFID à tous les clients connectés via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "rfid",
            value: data,
          })
        );
      }
    });
  }
});

console.log("Serveur WebSocket en écoute sur ws://localhost:8000");

// Démarrer le serveur Express
app.listen(PORT, () =>
  console.log(`Serveur Express démarré sur le port ${PORT}`)
);
