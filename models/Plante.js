const mongoose = require('mongoose');

// Définir le schéma de la collection "plante"
const planteSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
  },
  besoinEau: {
    type: Number,
    required: true,
  },
  typeArrosage: {
    type: String,
    required: true,
    enum: ['humidité', 'période'], // Seulement deux valeurs possibles
  },
  humidite: {
    type: Number,
    default: null,
    validate: {
      validator: function (value) {
        // humidite est obligatoire si typeArrosage est 'humidité'
        return this.typeArrosage === 'humidité' ? value !== null : true;
      },
      message: 'Le champ "humidite" est obligatoire lorsque le type d\'arrosage est "humidité".',
    },
  },
  periode: {
    type: Number,
    default: null,
    validate: {
      validator: function (value) {
        // periode est obligatoire si typeArrosage est 'période'
        return this.typeArrosage === 'période' ? value !== null : true;
      },
      message: 'Le champ "periode" est obligatoire lorsque le type d\'arrosage est "période".',
    },
  },
  heuresArrosage: {
    type: [String], // Tableau d'heures (ex: ["08:00", "14:00", "20:00"])
    default: null,
    validate: {
      validator: function (value) {
        // heuresArrosage est obligatoire si typeArrosage est 'période'
        if (this.typeArrosage === 'période') {
          return value !== null && value.length === this.periode;
        }
        return true;
      },
      message: 'Le champ "heuresArrosage" doit contenir exactement le nombre d\'heures spécifié dans "periode".',
    },
  },
  etat: {
    type: Boolean,
    default: false, // Par défaut, la plante est inactive
  },
});

// Créer le modèle "Plante"
const Plante = mongoose.model('Plante', planteSchema);

module.exports = Plante;