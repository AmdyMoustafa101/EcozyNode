const express = require('express');
const connectDB = require('./config/db.js');
const userRoutes = require('./routes/userRoutes.js');
const planteRoutes = require('./routes/planteRoutes');
const Log = require('./models/log');
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




// Route pour enregistrer la connexion de l'utilisateur
app.post('/login', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(userId);
    const log = new Log({ userId });
    await log.save();
    res.status(200).json({ message : 'Connexion enregistrée'});
  } catch (error) {
    res.status(500).json({ error : "Erreur lors de l'enrigistrement"});
  }
});


// Route pour enregistrer les actions de l'utilisateur
app.post('/log-action', async (req, res) => {
  const { userId, type, entity, entityId, details } = req.body;
  const log = await Log.findOne({ userId, logoutTime: null });
  if (log) {
    log.actions.push({ type, entity, entityId, details });
    await log.save();
    res.status(200).json({ mesage : 'Action enregistrée'});
  } else {
    res.status(404).json({ error : 'Utilisateur non connecté'});
  }
});

//Route pour recuperer les logs
app.get('/logs', async (req, res) => {
  const logs = await Log.find({ logoutTime: { $ne: null } });
  if (logs) {
    res.status(200).json(logs);
  } else {
    res.status(404).json({ error : 'Aucun log trouvé'});
  }
});

app.get('/logs/:date', async (req, res) => {
  try {
    // Récupération de la chaîne de date depuis l'URL
    const dateParam = req.params.date;
    console.log("Recherche du log avec dateParam :", dateParam);

    // Vérifier que la chaîne de date est valide
    if (isNaN(Date.parse(dateParam))) {
      return res.status(400).json({ error: "Le format de date est invalide." });
    }

    // Conversion de la chaîne en objet Date
    const loginTime = new Date(dateParam);
    console.log("Recherche du log avec loginTime :", loginTime);

    // Recherche du log correspondant dans la collection
    const log = await Log.findOne({ loginTime });

    // Si aucun log n'est trouvé, on renvoie un 404
    if (!log) {
      return res.status(404).json({ error: 'Log non trouvé' });
    }

    // Renvoi du log trouvé
    return res.status(200).json(log);
  } catch (error) {
    console.error("Erreur lors de la recherche du log :", error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});


// Route pour enregistrer la déconnexion de l'utilisateur
app.post('/logout', async (req, res) => {
  const { userId } = req.body;
  const log = await Log.findOne({ userId, logoutTime: null });
  if (log) {
    log.logoutTime = new Date();
    await log.save();
    res.status(200).json({ mesage : 'Déconnexion enregistrée'});
  } else {
    res.status(404).json({ error : 'Utilisateur non connecté'});
  }
});



// Démarrage du serveur
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});