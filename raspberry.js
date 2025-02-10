const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db"); // Importer la configuration de connexion à MongoDB
const AverageService = require("./services/averageService"); // Importer le service pour les moyennes

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

// Connexion à MongoDB
connectDB(); // Établir la connexion à MongoDB

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

// Endpoint GET pour récupérer les moyennes quotidiennes
app.get("/api/averages", async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: "Date manquante" });
  }

  const averages = await AverageService.getAverages(date);
  res.json({ date, averages: averages ? averages.averages : {} });
});

server.listen(3002, () => {
  console.log("Server is running on port 3002");
});
