const express = require('express');
const Case = require('../models/Case');
const FunkoFigure = require('../models/FunkoFigure');
const router = express.Router();

// Отримати всі кейси
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find();
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

    if (caseItem.figures.length === 0) {
      return res.status(400).json({ message: 'У кейсі немає фігурок' });
    }

    // Випадковий вибір фігурки (простий рандом)
    const randomIndex = Math.floor(Math.random() * caseItem.figures.length);
    const selectedFigure = caseItem.figures[randomIndex];

    res.json(selectedFigure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
