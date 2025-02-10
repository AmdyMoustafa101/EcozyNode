const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Clé secrète pour signer les tokens (stockez-la dans un fichier .env en production)
const SECRET_KEY = "secrète_unique";

const router = express.Router();

// Configuration de multer pour l'upload des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/"); // Dossier où les fichiers seront stockés
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Vérifier l'extension du fichier
    const fileTypes = /jpeg|jpg|png/;
    const extName = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);

    if (mimeType && extName) {
      return cb(null, true);
    }
    cb("Seules les images (jpeg, jpg, png) sont autorisées.");
  },
});

//  Route pour créer un utilisateur avec upload d'image
router.post("/users", upload.single("photo"), async (req, res) => {
  try {
    const { nom, prenom, carteRFID, telephone, role } = req.body;

    // Générer un code secret unique
    const codeSecret = await User.generateUniqueCodeSecret();

    // Récupérer le chemin de l'image si elle existe
    const photo = req.file ? req.file.path : null;

    // Création de l'utilisateur
    const newUser = new User({
      nom,
      prenom,
      photo,
      codeSecret,
      carteRFID,
      telephone,
      role: role || "user", // Si le rôle n'est pas spécifié, il prend la valeur par défaut 'user'
    });

    await newUser.save();

    // Renvoyer le codeSecret dans la réponse
    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: newUser,
      codeSecret: newUser.codeSecret, // Ajouter explicitement le codeSecret
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création de l’utilisateur", error });
  }
});

//  Route pour récupérer tous les utilisateurs
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Récupérer uniquement les utilisateurs non archivés
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error,
    });
  }
});

//  Route pour récupérer un utilisateur par son ID
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId); // Récupérer uniquement les utilisateurs non archivés

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération de l'utilisateur",
      error,
    });
  }
});

//  Route pour mettre à jour un utilisateur
router.patch("/users/:id", upload.single("photo"), async (req, res) => {
  try {
    const userId = req.params.id;
    const { nom, prenom, telephone, role } = req.body;

    // Récupérer l'utilisateur existant
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Mettre à jour les champs de l'utilisateur
    user.nom = nom || user.nom;
    user.prenom = prenom || user.prenom;
    user.telephone = telephone || user.telephone;
    user.role = role || user.role;

    // Mettre à jour la photo si une nouvelle photo est fournie
    if (req.file) {
      user.photo = req.file.path;
    }

    // Sauvegarder les modifications
    const updatedUser = await user.save();

    res.status(200).json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour de l’utilisateur",
      error,
    });
  }
});

// Route pour désassigner la carte d'un utilisateur
router.post("/users/:id/remove-card", async (req, res) => {
  try {
    const userId = req.params.id;

    // Récupérer l'utilisateur existant
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Supprimer la carte RFID
    user.carteRFID = null;

    // Sauvegarder les modifications
    const updatedUser = await user.save();

    res.status(200).json({
      message: "Carte désassignée avec succès",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la désassignation de la carte",
      error,
    });
  }
});

// Route pour archiver ou désarchiver un utilisateur
router.patch("/users/:id/archive", async (req, res) => {
  try {
    const userId = req.params.id;
    const { archived } = req.body; // `archived` peut être true ou false

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { archived },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      message: `Utilisateur ${archived ? "archivé" : "désarchivé"} avec succès`,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: `Erreur lors de ${
        archived ? "l'archivage" : "le désarchivage"
      } de l’utilisateur`,
      error,
    });
  }
});

// Route pour désassigner la carte d'un utilisateur
router.post("/users/:id/remove-card", async (req, res) => {
  try {
    const userId = req.params.id;

    // Récupérer l'utilisateur existant
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Supprimer la carte RFID
    user.carteRFID = null;

    // Sauvegarder les modifications
    const updatedUser = await user.save();

    res.status(200).json({
      message: "Carte désassignée avec succès",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la désassignation de la carte",
      error,
    });
  }
});

router.post("/assign-rfid", async (req, res) => {
  const { userId, carteRFID } = req.body;

  if (!userId || !carteRFID) {
    return res.status(400).json({ message: "Données manquantes" });
  }

  try {
    const existingUser = await User.findOne({ carteRFID });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({
        message: "Cette carte RFID est déjà assignée à un autre utilisateur",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    user.carteRFID = carteRFID;
    await user.save();

    res.status(200).json({ message: "Carte RFID associée avec succès", user });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'association de la carte RFID",
      error: error.message,
    });
  }
});

//Router pour la connectionrouter.post('/login', async (req, res) => {

router.post("/login", async (req, res) => {
  try {
    const { codeSecret, carteRFID } = req.body;
    let user;

    // Vérifier si l'utilisateur existe avec le codeSecret ou l'UID de la carte RFID
    if (codeSecret) {
      user = await User.findOne({ codeSecret });
    } else if (carteRFID) {
      user = await User.findOne({ carteRFID });
    } else {
      return res
        .status(400)
        .json({ message: "Code secret ou carte RFID requis" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "Utilisateur non trouvé ou identifiants invalides" });
    }

    // Vérifier si l'utilisateur est archivé
    if (user.archived) {
      return res.status(403).json({ message: "Utilisateur archivé" });
    }

    // Créer un token pour l'utilisateur
    const token = jwt.sign(
      { id: user._id, codeSecret: user.codeSecret }, // Payload
      SECRET_KEY, // Clé secrète
      { expiresIn: "1h" } // Expiration (exemple : 1 heure)
    );

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        photo: user.photo,
        telephone: user.telephone,
        codeSecret: user.codeSecret,
        carteRFID: user.carteRFID
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la connexion", error });
  }
});

module.exports = router;
