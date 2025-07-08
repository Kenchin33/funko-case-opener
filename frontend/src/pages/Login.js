import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const res = await fetch('https://funko-case-opener.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password }),
    });
  
    const data = await res.json();
  
    if (res.ok) {
      localStorage.setItem('token', data.token); // збережемо токен
      setMessage('Успішний вхід!');
      setTimeout(() => {
        window.location.href = '/';  // перезавантажуємо всю сторінку
      }, 1500);
    } else {
      setMessage(data.message || 'Помилка входу');
    }
  };  

  return (
    <div className="auth-page">
      <button className="btn btn-outline back-button" onClick={() => navigate('/')}>
        ← На головну
      </button>
      <h1>Вхід</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Нікнейм:
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </label>
        <label>
          Пароль:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Увійти
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Login;