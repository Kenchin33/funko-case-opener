const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  figures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FunkoFigure' }],
  category: { type: String, enum: ['standard', 'thematic', 'partner', 'all-or-nothing'], default: 'standard'},
  rarityChances: {
    type: Map,
    of: Number,
    default: {
      Common: 60,
      Exclusive: 20,
      Epic: 10,
      Legendary: 8,
      Grail: 2,
    },
  },
});

module.exports = mongoose.model('Case', caseSchema);
