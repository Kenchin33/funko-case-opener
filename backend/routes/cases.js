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
    console.log('req.body:', req.body);
    const { name, price, figures, category } = req.body;
    const newCase = new Case({ name, price, figures, category });
    await newCase.save();
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Відкрити кейс (з авторизацією, зніманням коштів та оновленням балансу)
router.post('/:id/open', authMiddleware, async (req, res) => {
  console.log('🎯 Відкрито кейс', req.params.id);
  try {
    const caseItem = await Case.findById(req.params.id).populate('figures');
    if (!caseItem) return res.status(404).json({ message: 'Кейс не знайдено' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (user.balance < caseItem.price) {
      return res.status(400).json({ message: 'Недостатньо коштів для відкриття кейсу' });
    }

    // Знімаємо гроші
    user.balance -= caseItem.price;
    await user.save();

    const figures = caseItem.figures;
    if (figures.length === 0) {
      return res.status(400).json({ message: 'У кейсі немає фігурок' });
    }

    // Формуємо шанс для кожної рідкості, уважно перевіряємо ключі
    const chancesFromCase = caseItem.rarityChances || {};
    const defaultChances = { Common: 60, Exclusive: 20, Epic: 10, Legendary: 8, Grail: 2 };

    // Створюємо множину рідкостей із фігурок, прибираємо зайві пробіли
    const presentRarities = new Set(figures.map(f => f.rarity?.trim()));

    // Заповнюємо об'єкт шансів для цих рідкостей
    const chances = {};
    for (const rarity of presentRarities) {
      if (chancesFromCase.hasOwnProperty(rarity)) {
        chances[rarity] = chancesFromCase[rarity];
      } else if (defaultChances.hasOwnProperty(rarity)) {
        chances[rarity] = defaultChances[rarity];
      } else {
        chances[rarity] = 0;
      }
    }

    // Лог шансів, щоб перевірити що зчитується
    console.log('⚡ Шанси з кейса:', chances);

    const weightedPool = [];

    figures.forEach(fig => {
      const rarity = fig.rarity?.trim();
      const weight = chances[rarity] ?? 0;
      console.log(`🔍 Фігурка: ${fig.name}, Рідкість: ${rarity}, Шанс: ${weight}`);

      if (weight > 0) {
        for (let i = 0; i < weight; i++) {
          weightedPool.push(fig);
        }
      }
    });

    if (weightedPool.length === 0) {
      return res.status(400).json({ message: 'Немає фігурок з валідними шансами' });
    }

    // Лог кількості фігурок у пулі (корисно для дебагу)
    const rarityCount = weightedPool.reduce((acc, fig) => {
      const r = fig.rarity?.trim() || 'Unknown';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    console.log('📦 Рідкості у фінальному пулі:', rarityCount);

    // Вибираємо випадкову фігурку
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const selectedFigure = weightedPool[randomIndex];

    // Повертаємо результат
    res.json({
      ...selectedFigure.toObject(),
      newBalance: user.balance,
    });

  } catch (err) {
    console.error('Помилка відкриття кейсу:', err);
    res.status(500).json({ message: 'Помилка сервера при відкритті кейсу' });
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

// Додати фігурку в інвентар користувача (при натисканні "залишити")
router.post('/inventory/add', authMiddleware, async (req, res) => {
  try {
    const { figureId, caseId, caseName, price } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    user.inventory.push({
      figure: figureId,
      caseId,
      caseName,
      price,
      date: new Date(),
    });

    await user.save();

    res.json({ message: 'Фігурка додана в інвентар', inventory: user.inventory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;