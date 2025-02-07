const express = require('express');
const router = express.Router();
const Plante = require('../models/Plante');

// Créer une nouvelle plante
router.post('/plantes', async (req, res) => {
    try {
      const { nom, besoinEau, typeArrosage, humidite, periode, heuresArrosage } = req.body;
  
      // Convertir heuresArrosage en tableau si c'est une chaîne
      const heuresArrosageArray =
        typeof heuresArrosage === 'string' ? heuresArrosage.split(', ') : heuresArrosage;
  
      // Valider les heures d'arrosage si le type est 'période'
      if (typeArrosage === 'période' && (!heuresArrosageArray || heuresArrosageArray.length !== periode)) {
        return res.status(400).json({ message: 'Le nombre d\'heures d\'arrosage doit correspondre à la période spécifiée.' });
      }
  
      const nouvellePlante = new Plante({
        nom,
        besoinEau,
        typeArrosage,
        humidite: typeArrosage === 'humidité' ? humidite : null,
        periode: typeArrosage === 'période' ? periode : null,
        heuresArrosage: typeArrosage === 'période' ? heuresArrosageArray : null,
      });
  
      await nouvellePlante.save();
      res.status(201).json({ message: 'Plante créée avec succès', plante: nouvellePlante });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la création de la plante', error });
    }
  });

// Récupérer toutes les plantes
router.get('/plantes', async (req, res) => {
  try {
    const plantes = await Plante.find();
    res.status(200).json(plantes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des plantes', error });
  }
});

// Récupérer toutes les plantes dont l'état est true
router.get('/plantes/programme', async (req, res) => {
  try {
    const plantes = await Plante.find({ etat: true });
    res.json(plantes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une plante par son ID
router.get('/plantes/:id', async (req, res) => {
  try {
    const plante = await Plante.findById(req.params.id);
    if (!plante) {
      return res.status(404).json({ message: 'Plante non trouvée' });
    }
    res.status(200).json(plante);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la plante', error });
  }
});

// Mettre à jour une plante
router.put('/plantes/:id', async (req, res) => {
  try {
    const { nom, besoinEau, typeArrosage, humidite, periode, heuresArrosage } = req.body;

    // Convertir heuresArrosage en tableau si c'est une chaîne
    const heuresArrosageArray =
    typeof heuresArrosage === 'string' ? heuresArrosage.split(', ') : heuresArrosage;

    // Valider les heures d'arrosage si le type est 'période'
    if (typeArrosage === 'période' && (!heuresArrosageArray || heuresArrosageArray.length !== periode)) {
      return res.status(400).json({ message: 'Le nombre d\'heures d\'arrosage doit correspondre à la période spécifiée.' });
    }

    const plante = await Plante.findByIdAndUpdate(
      req.params.id,
      {
        nom,
        besoinEau,
        typeArrosage,
        humidite: typeArrosage === 'humidité' ? humidite : null,
        periode: typeArrosage === 'période' ? periode : null,
        heuresArrosage: typeArrosage === 'période' ? heuresArrosageArray : null,
      },
      { new: true }
    );

    if (!plante) {
      return res.status(404).json({ message: 'Plante non trouvée' });
    }
    res.status(200).json({ message: 'Plante mise à jour avec succès', plante });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la plante', error });
  }
});

// Supprimer une plante
router.delete('/plantes/:id', async (req, res) => {
  try {
    const plante = await Plante.findByIdAndDelete(req.params.id);
    if (!plante) {
      return res.status(404).json({ message: 'Plante non trouvée' });
    }
    res.status(200).json({ message: 'Plante supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la plante', error });
  }
});


// Route pour créer une nouvelle programmation d'arrosage
router.post('/programmation', async (req, res) => {
  const { plantId, startDate, endDate } = req.body;
  const programmation = new Programmation({ plantId, startDate, endDate });
  await programmation.save();
  res.status(200).send('Programmation d\'arrosage créée');
});


// Route pour activer une plante
router.put('/plantes/:id/activer', async (req, res) => {
  try {
    const plante = await Plante.findByIdAndUpdate(
      req.params.id,
      { etat: true },
      { new: true }
    );

    if (!plante) {
      return res.status(404).send({ message: 'Plante non trouvée' });
    }

    res.send(plante);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Route pour désactiver une plante
router.put('/plantes/:id/desactiver', async (req, res) => {
  try {
    const plante = await Plante.findByIdAndUpdate(
      req.params.id,
      { etat: false },
      { new: true }
    );

    if (!plante) {
      return res.status(404).send({ message: 'Plante non trouvée' });
    }

    res.send(plante);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;