const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  inventory: [
    {
      figure: { type: mongoose.Schema.Types.ObjectId, ref: 'FunkoFigure' },
      caseName: String,
      caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
      price: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  balance: { type: Number, default: 1000 },
});

module.exports = mongoose.model('User', userSchema);