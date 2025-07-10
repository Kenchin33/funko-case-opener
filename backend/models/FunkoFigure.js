const mongoose = require('mongoose');

const funkoFigureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rarity: {
    type: String,
    enum: ['Common', 'Exclusive', 'Epic', 'Legendary', 'Grail', 'Signed'],
    required: true,
  },
  description: { type: String },
  image: { type: String, required: true }, // URL або шлях до фото
});

module.exports = mongoose.model('FunkoFigure', funkoFigureSchema);
