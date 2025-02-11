const mongoose = require("mongoose");

const averageSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Date au format YYYY-MM-DD
  averages: {
    "16:17": { humidity: Number, brightness: Number },
    "16:18": { humidity: Number, brightness: Number },
    "16:19": { humidity: Number, brightness: Number },
  },
  overallAverage: { humidity: Number, brightness: Number }, // Nouveau champ pour la moyenne globale
});

module.exports = mongoose.model("Average", averageSchema);
