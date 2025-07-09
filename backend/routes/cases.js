const express = require('express');
const Case = require('../models/Case');
const User = require('../models/User');
const router = express.Router();

const { authMiddleware } = require('./auth');

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

    if (!caseItem.rarityChances) {
      caseItem.rarityChances = {
        Common: 60,
        Exclusive: 20,
        Epic: 10,
        Legendary: 8,
        Grail: 2,
      };
    }

    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Додати новий кейс
router.post('/', async (req, res) => {
  try {
    const { name, price, figures, category } = req.body;
    const newCase = new Case({ name, price, figures, category });
    await newCase.save();
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Відкрити кейс (випадкова фігурка за шансами)
router.post('/:id/open', authMiddleware, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id).populate('figures');
    if (!caseItem) return res.status(404).json({ message: 'Кейс не знайдено' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (user.balance < caseItem.price) {
      return res.status(400).json({ message: 'Недостатньо коштів на балансі' });
    }

    user.balance -= caseItem.price;
    await user.save();

    // Визначення випадкової фігурки з урахуванням шансів
    const chances = caseItem.rarityChances || {
      Common: 60,
      Exclusive: 20,
      Epic: 10,
      Legendary: 8,
      Grail: 2,
    };

    // Підрахунок сумарного вагового коефіцієнта
    const rarityWeights = {};
    let totalWeight = 0;
    for (const [rarity, chance] of Object.entries(chances)) {
      rarityWeights[rarity] = chance;
      totalWeight += chance;
    }

    // Вибираємо раритет
    const rand = Math.random() * totalWeight;
    let accum = 0;
    let chosenRarity = 'Common';
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      accum += weight;
      if (rand <= accum) {
        chosenRarity = rarity;
        break;
      }
    }

    // Фільтруємо фігурки по вибраному раритету
    const possibleFigures = caseItem.figures.filter(f => f.rarity === chosenRarity);
    if (possibleFigures.length === 0) {
      // Якщо нема фігурок цього раритету, повертаємо випадкову
      return res.json(caseItem.figures[Math.floor(Math.random() * caseItem.figures.length)]);
    }

    // Випадкова фігурка серед обраного раритету
    const chosenFigure = possibleFigures[Math.floor(Math.random() * possibleFigures.length)];

    res.json(chosenFigure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Продати фігурку (додати баланс користувачу)
router.post('/sell-figure', authMiddleware, async (req, res) => {
  try {
    const { figureId, salePrice } = req.body;
    if (!figureId || !salePrice) return res.status(400).json({ message: 'Некоректні дані' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    user.balance += salePrice;
    await user.save();

    res.json({ newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;