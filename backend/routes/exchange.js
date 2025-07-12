// routes/exchange.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('./auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { removeIds, newFigures } = req.body;  // отримуємо масиви з фронтенда

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Фільтруємо інвентар, видаляючи всі фігурки з _id у removeIds
    user.inventory = user.inventory.filter(item => !removeIds.includes(item._id.toString()));

    // Додаємо нові фігурки (newFigures - масив об'єктів з потрібними даними)
    newFigures.forEach(fig => {
      user.inventory.push({
        figure: fig._id,
        price: fig.price,
        caseId: fig.caseId || null,
        caseName: fig.caseName || 'Обмін',
      });
    });

    await user.save();

    const populated = await User.findById(userId).populate('inventory.figure');
    res.json({ inventory: populated.inventory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Exchange error' });
  }
});

module.exports = router;
