const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const Plante = require('./models/Plante');
const ProgrammeArrosage = require('./models/ProgrammeArrosage');

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db"); // Importer la configuration de connexion à MongoDB
const AverageService = require("./services/AverageService"); // Importer le service pour les moyennes


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

// Middleware pour parser le JSON dans le corps des requêtes
app.use(express.json());

// Utiliser le middleware CORS
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Connexion à MongoDB
connectDB();


let humidity = 0;
let brightness = 0;

// Tableau pour stocker les données historiques
let historicalData = [];

// Fonction pour ajouter des données historiques
function addHistoricalData(humidity, brightness) {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // Format YYYY-MM-DD
  const time = now.toTimeString().split(" ")[0]; // Format HH:MM:SS

  historicalData.push({
    date,
    time,
    humidity,
    brightness,
  });
}


// Fonction pour calculer les moyennes à des heures spécifiques
function calculateAverages(date, targetTimes) {
  const dailyData = historicalData.filter((entry) => entry.date === date);
  const averages = {};
  let totalHumidity = 0;
  let totalBrightness = 0;
  let count = 0;

  targetTimes.forEach((time) => {
    const filteredData = dailyData.filter((entry) =>
      entry.time.startsWith(time)
    );
    if (filteredData.length > 0) {
      const avgHumidity =
        filteredData.reduce((sum, entry) => sum + entry.humidity, 0) /
        filteredData.length;
      const avgBrightness =
        filteredData.reduce((sum, entry) => sum + entry.brightness, 0) /
        filteredData.length;
      averages[time] = { humidity: avgHumidity, brightness: avgBrightness };

      totalHumidity += avgHumidity;
      totalBrightness += avgBrightness;
      count++;
    } else {
      averages[time] = { humidity: 0, brightness: 0 };
    }
  });

  const overallAverage = {
    humidity: count > 0 ? totalHumidity / count : 0,
    brightness: count > 0 ? totalBrightness / count : 0,
  };

  return { averages, overallAverage };
}

async function automateWatering() {
  try {
    const now = new Date();

    // Récupérer les programmes actifs
    const activePrograms = await ProgrammeArrosage.find({
      etat: true,
      dateDebut: { $lte: now },
      dateFin: { $gte: now },
    }).populate('idPlante');

    for (const program of activePrograms) {
      const plante = await Plante.findById(program.idPlante);
      console.log(`Arrosage de la plante ${plante.nom} programmée entre ${program.dateDebut} et ${program.dateFin}.`);

      if (plante.typeArrosage === 'période') {
        const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        if (plante.heuresArrosage.includes(currentHour)) {
          // Activer la pompe
          await axios.post("http://192.168.1.28:5000/control-pump", { command: "ON" });

          // Désactiver la pompe après une durée déterminée (par exemple, 1 heure)
          setTimeout(async () => {
            await axios.post("http://192.168.1.28:5000/control-pump", { command: "OFF" });
          }, 1 * 60 * 60 * 1000); // 1 heure
        }
      } else if (plante.typeArrosage === 'humidité') {
        if (humidity < plante.humidite) {
          await axios.post("http://192.168.1.28:5000/control-pump", { command: "ON" });
        } else {
          await axios.post("http://192.168.1.28:5000/control-pump", { command: "OFF" });
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'automatisation de l'arrosage :", error);
  }
}

// Appeler automateWatering toutes les minutes
setInterval(automateWatering, 60 * 1000);

// Endpoint GET pour renvoyer les données actuelles
app.get("/api/sensor-data", (req, res) => {
  console.log("GET request received for sensor data");
  res.json({ humidity, brightness });
});

// Endpoint POST pour recevoir les données envoyées directement par l'appareil via WiFi
app.post("/api/data", async (req, res) => {
  const { hum: h, lum: b } = req.body;

  if (typeof h !== "number" || typeof b !== "number") {
    return res.status(400).json({ error: "Données invalides" });
  }

  humidity = h;
  brightness = b;
  console.log(
    `POST request: Données reçues => Humidité: ${humidity}, Luminosité: ${brightness}`
  );


  addHistoricalData(humidity, brightness);
  io.emit("sensor-data", { humidity, brightness });

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const targetTimes = ["18:25", "18:26", "18:27"];
  const { averages, overallAverage } = calculateAverages(date, targetTimes);

  await AverageService.saveAverages(date, averages, overallAverage);

  res.status(200).json({ message: "Données reçues" });
});

// Endpoint POST pour contrôler la pompe
app.post("/api/control-pump", async (req, res) => {
  const { command } = req.body.command;

  console.log("command: " + command);

  if (command !== 'ON' && command !== 'OFF') {
    return res.status(400).json({ error: "Commande invalide" });
  }

  try {
    const response = await axios.post("http://192.168.1.28:5000/control-pump", { command });
    res.status(200).json({ message: response.data.message });
  } catch (error) {
    console.error("Erreur lors du contrôle de la pompe:", error);
    res.status(500).json({ error: "Erreur lors du contrôle de la pompe" });
  }
});


server.listen(3002, () => {
  console.log("Server is running on port 3002");
})

