// routes/exchange.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('./auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { removeIndex, newFigureId, newPrice, caseId, caseName } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Видаляємо стару фігурку
    user.inventory.splice(removeIndex, 1);

    // Додаємо нову
    user.inventory.push({
      figure: newFigureId,
      price: newPrice,
      caseId,
      caseName
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
