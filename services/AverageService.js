const Average = require("../models/verageModel"); // Assurez-vous que le chemin est correctsurez-vous que le chemin est correct

const AverageService = {
  async saveAverages(date, averages, overallAverage) {
    try {
      const existingAverage = await findOne({ date });
      if (existingAverage) {
        existingAverage.averages = averages;
        existingAverage.overallAverage = overallAverage;
        await existingAverage.save();
      } else {
        await create({ date, averages, overallAverage });
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des moyennes :", error);
    }
  },

  async getAverages(date) {
    try {
      const average = await findOne({ date });
      return average;
    } catch (error) {
      console.error("Erreur lors de la récupération des moyennes :", error);
      return null;
    }
  },
};

export default AverageService;
