require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const mongoUri = process.env.MONGO_URI;

const app = express();
const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const figuresRoutes = require('./routes/figures');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes.router);  // Зверни увагу на .router
app.use('/api/cases', casesRoutes);
app.use('/api/figures', figuresRoutes);

app.get('/', (req, res) => {
  res.send('Funko Case Opener API');
});

console.log('MONGO_URI:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));