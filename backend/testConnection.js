const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

async function testConnection() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Підключення до MongoDB встановлено!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Помилка підключення:', error.message);
  }
}

testConnection();
