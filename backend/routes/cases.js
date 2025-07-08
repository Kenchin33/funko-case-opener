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

    // Визначаємо, які рідкості реально присутні у фігурках кейса
    const presentRarities = new Set(figures.map((f) => f.rarity));

    // Отримуємо шанси з кейсу або дефолтні
    const defaultChances = {
      Common: 60,
      Exclusive: 20,
      Epic: 10,
      Legendary: 8,
      Grail: 2,
    };

    const chancesFromCase = caseItem.rarityChances || {};
    const chances = {};

    // Побудова шансів лише для рідкостей, які реально є у кейсі
    for (const rarity of presentRarities) {
      const value = chancesFromCase.get?.(rarity) || chancesFromCase[rarity] || defaultChances[rarity] || 0;
      chances[rarity] = value;
    }

    // Валідація: сума шансів не повинна бути нульовою
    const totalChance = Object.values(chances).reduce((a, b) => a + b, 0);
    if (totalChance === 0) {
      return res.status(400).json({ message: 'Немає валідних шансів для доступних рідкостей' });
    }

    // Побудова пулу фігурок з урахуванням шансів
    const weightedPool = [];

    figures.forEach((fig) => {
      const weight = chances[fig.rarity] || 0;
      for (let i = 0; i < weight; i++) {
        weightedPool.push(fig);
      }
    });

    if (weightedPool.length === 0) {
      return res.status(400).json({ message: 'Не знайдено жодної фігурки з валідними шансами' });
    }

    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const selectedFigure = weightedPool[randomIndex];

    res.json(selectedFigure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;
