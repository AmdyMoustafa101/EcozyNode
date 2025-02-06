const express = require('express');
const connectDB = require('./config/db.js');
const userRoutes = require('./routes/userRoutes.js');
const planteRoutes = require('./routes/planteRoutes');
const programmeArrosageRoutes = require('./routes/programmeArrosageRoutes');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');




const app = express();
app.use(cors());
app.use(bodyParser.json());
// Middleware pour rendre les fichiers du dossier "uploads" accessibles
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connexion à MongoDB
connectDB();

// Middleware pour parser le JSON
app.use(express.json());

// Utilisation des routes des utilisateurs
app.use('/api', userRoutes);
// Utilisation des routes des plantes
app.use('/api', planteRoutes);
// Utilisation des routes des programmaArrosage
app.use('/api/', programmeArrosageRoutes);

// Démarrage du serveur
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});