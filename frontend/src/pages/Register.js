import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

const Register = () => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage('Успішно зареєстровано!');
      setTimeout(() => navigate('/'), 1000);
    } else {
      setMessage(data.message || 'Помилка реєстрації');
    }
  };

  return (
    <div className="register-page">
      <button className="btn btn-outline back-button" onClick={() => navigate('/')}>
        ← На головну
      </button>

      <form className="register-form" onSubmit={handleRegister}>
        <h2>Реєстрація</h2>

        <label>Нікнейм</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />

        <label>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary">Зареєструватись</button>

        {message && <p className="register-message">{message}</p>}
      </form>
    </div>
  );
};

export default Register;