const express = require('express');
const Case = require('../models/Case');
const FunkoFigure = require('../models/FunkoFigure');
const router = express.Router();

// Отримати всі кейси
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find().populate('figures');
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Отримати кейс за id з заповненням фігурок
router.get('/:id', async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id).populate('figures');
    if (!caseItem) return res.status(404).json({ message: 'Кейс не знайдено' });
    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Додати новий кейс
router.post('/', async (req, res) => {
  try {
    const { name, price, figures } = req.body;
    const newCase = new Case({ name, price, figures });
    await newCase.save();
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Відкрити кейс - випадкове випадання фігурки
router.post('/:id/open', async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id).populate('figures');
    if (!caseItem) return res.status(404).json({ message: 'Кейс не знайдено' });

    const figures = caseItem.figures;
    if (figures.length === 0) {
      return res.status(400).json({ message: 'У кейсі немає фігурок' });
    }

    const chances = caseItem.rarityChances || new Map();
    const weightedPool = [];

    figures.forEach((fig) => {
      const weight = chances.get(fig.rarity) || chances[fig.rarity] || 0;
      for (let i = 0; i<weight; i++) {
        weightedPool.push(fig);
      }
    });

    if (weightedPool.length === 0) {
      return res.status(400).json({ message: 'Немає фігурок з визначеними шансами'});
    }

    // Випадковий вибір фігурки (простий рандом)
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const selectedFigure = weightedPool[randomIndex];

    res.json(selectedFigure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Оновити кейс
router.put('/:id', async (req, res) => {
  try {
    const { name, price, image, figures } = req.body;

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { name, price, image, figures },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ message: 'Кейс не знайдено' });
    }

    res.json(updatedCase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
