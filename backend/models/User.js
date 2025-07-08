const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  openedFigures: [
    {
      figure: { type: mongoose.Schema.Types.ObjectId, ref: 'FunkoFigure' },
      caseName: String,
      caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },  // Додано
      price: Number,
      date: { type: Date, default: Date.now }
    }
  ],  
  balance: { type: Number, default: 1000 }, // 💰 нове поле
});

module.exports = mongoose.model('User', userSchema);