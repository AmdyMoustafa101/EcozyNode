const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const ProgrammeArrosage = require('../models/ProgrammeArrosage');
const Plante = require('../models/Plante');


// Route pour créer un nouveau programme d'arrosage
router.post('/programme-arrosage', async (req, res) => {
    const { dateDebut, dateFin, idPlante } = req.body;

    try {
        // Vérifier si la plante existe et est active
        const plante = await Plante.findById(idPlante);
        if (!plante || !plante.etat) {
            return res.status(400).json({ message: 'La plante n\'existe pas ou n\'est pas active.' });
        }

        // Vérifier si la plante est déjà programmée
        const existingProgramme = await ProgrammeArrosage.findOne({ idPlante, etat: true });
        if (existingProgramme) {
            return res.status(400).json({ message: 'La plante est déjà programmée.' });
        }

        // Créer le nouveau programme d'arrosage
        const nouveauProgramme = new ProgrammeArrosage({
            dateDebut,
            dateFin,
            idPlante,
        });

        await nouveauProgramme.save();
        res.status(201).json(nouveauProgramme);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création du programme d\'arrosage.', error });
    }
});
// Route pour obtenir le programme d'arrosage en cours
router.get('/encours', async (req, res) => {
    try {
      const programmeEnCours = await ProgrammeArrosage.findOne({ etat: true });
      if (programmeEnCours) {
        res.json(programmeEnCours);
      } else {
        res.status(404).json({ message: 'Aucun programme en cours' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
    }
  });

  // Route pour mettre à jour l'état d'un programme
router.patch('/:id/etat', async (req, res) => {
    try {
      const programme = await ProgrammeArrosage.findByIdAndUpdate(req.params.id, { etat: req.body.etat }, { new: true });
      res.json(programme);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
    }
  });
  
  // Route pour mettre à jour un programme
  router.put('/:id', async (req, res) => {
    try {
      const programme = await ProgrammeArrosage.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(programme);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
    }
  });
  
  // Route pour supprimer un programme
  router.delete('/:id', async (req, res) => {
    try {
      await ProgrammeArrosage.findByIdAndDelete(req.params.id);
      res.json({ message: 'Programme supprimé' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
    }
  });

module.exports = router;