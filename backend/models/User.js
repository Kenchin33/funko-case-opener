const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  openedFigures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FunkoFigure' }],
});

module.exports = mongoose.model('User', userSchema);
