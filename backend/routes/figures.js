const express = require('express');
const FunkoFigure = require('../models/FunkoFigure');
const router = express.Router();

// Отримати всі фігурки
router.get('/', async (req, res) => {
  try {
    const figures = await FunkoFigure.find();
    res.json(figures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Додати нову фігурку
router.post('/', async (req, res) => {
  try {
    const { name, price, rarity, description, image } = req.body;
    const newFigure = new FunkoFigure({ name, price, rarity, description, image });
    await newFigure.save();
    res.status(201).json(newFigure);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
