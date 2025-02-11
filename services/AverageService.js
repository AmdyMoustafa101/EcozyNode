const Average = require("../models/Average");

async function saveAverages(date, averages, overallAverage, historicalData) {
  try {
    // Vérifier si une entrée existe déjà pour cette date
    let averageEntry = await Average.findOne({ date });

    if (!averageEntry) {
      // Créer une nouvelle entrée
      averageEntry = new Average({
        date,
        averages,
        overallAverage,
        historicalData,
      });
    } else {
      // Mettre à jour l'entrée existante
      averageEntry.averages = averages;
      averageEntry.overallAverage = overallAverage;
      averageEntry.historicalData = historicalData;
    }

    await averageEntry.save();
    console.log("Moyennes et données historiques enregistrées avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des moyennes :", error);
  }
}

async function getAverages(date) {
  try {
    const averageEntry = await Average.findOne({ date });
    if (averageEntry) {
      return averageEntry.overallAverage;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des moyennes :", error);
    return null;
  }
}

module.exports = { saveAverages, getAverages };
