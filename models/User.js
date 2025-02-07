const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
  },
  prenom: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    required: false,
  },
  codeSecret: {
    type: String,
    required: true,
    unique: true,
  },
  carteRFID: {
    type: String,
    required: false,
    default: null,
    unique: true,
  },
  telephone: {
    type: String,
    required: true,
    unique: true,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"], // Seules ces deux valeurs sont autorisées
    default: "user", // Par défaut, le rôle est 'user'
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  updateDate: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pour mettre à jour la date de mise à jour avant chaque sauvegarde
userSchema.pre("save", function (next) {
  this.updateDate = Date.now();
  next();
});

// Fonction pour générer un code secret unique de 4 chiffres non répétitifs
userSchema.statics.generateUniqueCodeSecret = async function () {
  let codeSecret;
  let isUnique = false;

  while (!isUnique) {
    codeSecret = Math.floor(1000 + Math.random() * 9000).toString();
    const existingUser = await this.findOne({ codeSecret });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return codeSecret;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
