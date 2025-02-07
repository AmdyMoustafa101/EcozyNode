const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  type: String, // 'create', 'update', 'delete'
  entity: String, // 'user', 'plante', 'arrosage'
  entityId: String, // ID de l'entité concernée
  details: String, // Détails supplémentaires sur l'action
  timestamp: { type: Date, default: Date.now }
});

const logSchema = new mongoose.Schema({
  userId: String,
  loginTime: { type: Date, default: Date.now },
  logoutTime: Date,
  actions: [actionSchema]
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
