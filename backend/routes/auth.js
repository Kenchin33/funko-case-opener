const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Middleware для перевірки токена
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Необхідна авторизація' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Токен не знайдено' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // додаємо дані користувача в req
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Невалідний токен' });
  }
}

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

// Отримати інформацію про користувача за токеном
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash').populate('openedFigures.figure');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Отримати користувача за id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Змінити баланс користувача
router.patch('/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;

    if (typeof balance !== 'number') {
      return res.status(400).json({ message: 'Невірне значення балансу' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { balance },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    res.json({ message: 'Баланс оновлено', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Експортуємо окремо router і middleware
module.exports = {
  router,
  authMiddleware,
};