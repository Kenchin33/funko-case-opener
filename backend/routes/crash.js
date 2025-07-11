// routes/crash.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FunkoFigure = require('../models/FunkoFigure');
const { authMiddleware } = require('./auth');

router.post('/claim-reward', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { selectedIds, coefficient } = req.body;
    const user = await User.findById(userId).populate('inventory.figure');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Обчислюємо totalWin для кожної поставленої фігурки
    let extraBalance = 0;
    const newInventoryEntries = [];

    for (const entry of user.inventory.filter((_, idx) => selectedIds.includes(idx))) {
      const winAmount = entry.price * coefficient;
      // знайти фігурку з price <= winAmount найбільшу
      const found = await FunkoFigure.findOne({ price: { $lte: winAmount } }).sort({ price: -1 });
      if (found) {
        newInventoryEntries.push({
          figure: found._id,
          price: found.price,
          caseName: entry.caseName,
          caseId: entry.caseId,
        });
        const diff = winAmount - found.price;
        if (diff > 0) extraBalance += diff * 42;
      }
    }

    // 2. Видаляємо поставлені фігурки
    // використаємо filter по індексам
    const remainingInv = user.inventory.filter((_, idx) => !selectedIds.includes(idx));

    // 3. Оновлюємо інвентар та баланс
    user.inventory = [
      ...remainingInv,
      ...newInventoryEntries
    ];
    user.balance += Math.round(extraBalance);
    await user.save();

    const populated = await User.findById(userId).populate('inventory.figure');
    res.json({ inventory: populated.inventory, balance: populated.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/lost-bet', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { selectedIds } = req.body;
      const user = await User.findById(userId).populate('inventory.figure');
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Видаляємо поставлені фігурки
      user.inventory = user.inventory.filter((_, idx) => !selectedIds.includes(idx));
  
      await user.save();
  
      const populated = await User.findById(userId).populate('inventory.figure');
      res.json({ inventory: populated.inventory, balance: populated.balance });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router;