const mongoose = require('mongoose');

const programmationSchema = new mongoose.Schema({
  plantId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  firstTime: { type: String, required: true },
  secondTime: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
                                                              
const Programmation = mongoose.model('Programmation', programmationSchema);

module.exports = Programmation;
