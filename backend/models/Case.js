const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  figures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FunkoFigure' }],
});

module.exports = mongoose.model('Case', caseSchema);
