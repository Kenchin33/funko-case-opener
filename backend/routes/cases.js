const express = require('express');
const Case = require('../models/Case');
const User = require('../models/User');
const router = express.Router();

const { authMiddleware } = require('./auth'); // імпорт, як об'єкт

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
    const { name, price, figures } = req.body;
    const newCase = new Case({ name, price, figures });
    await newCase.save();
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Відкрити кейс (з авторизацією, зніманням коштів та оновленням балансу)
router.post('/:id/open', authMiddleware, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id).populate('figures');
    if (!caseItem) return res.status(404).json({ message: 'Кейс не знайдено' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (user.balance < caseItem.price) {
      return res.status(400).json({ message: 'Недостатньо коштів для відкриття кейсу' });
    }

    user.balance -= caseItem.price;
    await user.save();

    const figures = caseItem.figures;
    if (figures.length === 0) {
      return res.status(400).json({ message: 'У кейсі немає фігурок' });
    }

    const presentRarities = new Set(figures.map(f => f.rarity));

    const defaultChances = {
      Common: 60,
      Exclusive: 20,
      Epic: 10,
      Legendary: 8,
      Grail: 2,
    };

    const chancesFromCase = caseItem.rarityChances || {};
    const chances = {};

    for (const rarity of presentRarities) {
      const value = chancesFromCase.get?.(rarity) || chancesFromCase[rarity] || defaultChances[rarity] || 0;
      chances[rarity] = value;
    }

    const totalChance = Object.values(chances).reduce((a, b) => a + b, 0);
    if (totalChance === 0) {
      return res.status(400).json({ message: 'Немає валідних шансів для доступних рідкостей' });
    }

    const weightedPool = [];

    figures.forEach(fig => {
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
    user.openedFigures.push({
      figure: selectedFigure._id,
      caseName: caseItem.name,
      caseId: caseItem._id,
      price: selectedFigure.price,
      date: new Date(),
    });
    await user.save();

    res.json({
      ...selectedFigure.toObject ? selectedFigure.toObject() : selectedFigure,
      newBalance: user.balance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Видалити кейс
router.delete('/:id', async (req, res) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(req.params.id);

    if (!deletedCase) {
      return res.status(404).json({ message: 'Кейс не знайдено' });
    }

    res.json({ message: 'Кейс успішно видалено', deletedCase });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Часткове оновлення кейса
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const updatedCase = await Case.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!updatedCase) {
      return res.status(404).json({ message: 'Кейс не знайдено' });
    }

    res.json(updatedCase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;