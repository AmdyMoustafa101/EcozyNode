const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// App initialization
const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Configuration du port série pour lire les données de l'Arduino
const port = new SerialPort({
  path: '/dev/ttyACM0', // Vérifiez que le chemin est correct pour votre système
  baudRate: 9600 
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Création du serveur WebSocket sur le port 8000
const wss = new WebSocket.Server({ port: 8000 });

wss.on('connection', ws => {
  console.log('Client connecté');

  // Envoi d'un message de bienvenue au client
  ws.send(JSON.stringify({ message: 'Connexion établie' }));

  // Lorsque le client se déconnecte
  ws.on('close', () => {
    console.log('Client déconnecté');
  });
});

// Lecture des données du port série et transmission aux clients WebSocket
parser.on('data', line => {
  let keyPressed;

  // Essayer de parser la ligne en JSON
  try {
    const parsedData = JSON.parse(line);
    // Si le JSON possède une propriété "key", on l'utilise
    if (parsedData && parsedData.key) {
      keyPressed = parsedData.key;
    } else {
      // Sinon, on peut renvoyer l'objet complet ou un message d'erreur
      keyPressed = parsedData;
    }
  } catch (e) {
    // Si le parsing échoue, on considère que la donnée est une chaîne brute
    keyPressed = line.trim();
  }

  console.log('Touche reçue de l\'Arduino:', keyPressed);

  // Envoyer la touche pressée à tous les clients connectés via WebSocket
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {  // Vérifier si le client est connecté
      client.send(JSON.stringify({
        type: 'keypad',
        value: keyPressed
      }));
    }
  });
});

console.log('Serveur WebSocket en écoute sur ws://localhost:8000');

// Démarrer le serveur Express
app.listen(PORT, () => console.log(`Serveur Express démarré sur le port ${PORT}`));
