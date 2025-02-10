const Average = require("../models/AverageModel"); // Assurez-vous que le chemin est correct

const AverageService = {
  async saveAverages(date, averages, overallAverage) {
    try {
      const existingAverage = await Average.findOne({ date });
      if (existingAverage) {
        existingAverage.averages = averages;
        existingAverage.overallAverage = overallAverage;
        await existingAverage.save();
      } else {
        await Average.create({ date, averages, overallAverage });
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des moyennes :", error);
    }
  },

  async getAverages(date) {
    try {
      const average = await Average.findOne({ date });
      return average;
    } catch (error) {
      console.error("Erreur lors de la récupération des moyennes :", error);
      return null;
    }
  },
};

module.exports = AverageService;
