const mongoose = require("mongoose");

const AverageSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Date au format YYYY-MM-DD
  averages: {
    "18:25": { humidity: Number, brightness: Number },
    "18:26": { humidity: Number, brightness: Number },
    "18:27": { humidity: Number, brightness: Number },
  },
  overallAverage: { humidity: Number, brightness: Number }, // Nouveau champ pour la moyenne globale
});

module.exports = mongoose.model("Average", AverageSchema);
