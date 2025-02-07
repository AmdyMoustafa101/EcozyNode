const mongoose = require('mongoose');

const ProgrammeArrosageSchema = new mongoose.Schema({
    dateDebut: {
        type: Date,
        required: true
    },
    dateFin: {
        type: Date,
        required: true
    },
    idPlante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plante',
        required: true
    },
    etat: {
        type: Boolean,
        default: true, // Par défaut, le programme est actif
      },
});

module.exports = mongoose.model('ProgrammeArrosage', ProgrammeArrosageSchema);