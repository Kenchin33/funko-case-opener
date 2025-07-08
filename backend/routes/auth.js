const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Реєстрація
router.post('/register', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
      return res.status(400).json({ message: 'Нік і пароль потрібні' });
    }

    const existingUser = await User.findOne({ nickname });
    if (existingUser) {
      return res.status(400).json({ message: 'Нік вже зайнятий' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ nickname, passwordHash });
    await user.save();

    res.status(201).json({ message: 'Користувача створено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Логін
router.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    const user = await User.findOne({ nickname });
    if (!user) {
      return res.status(400).json({ message: 'Неправильний нік або пароль' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Неправильний нік або пароль' });
    }

    const token = jwt.sign({ userId: user._id, nickname: user.nickname }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;
