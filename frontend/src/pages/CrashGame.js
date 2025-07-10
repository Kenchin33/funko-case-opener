import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';

const CrashGame = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);

      fetch('https://funko-case-opener.onrender.com/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token },
      })
        .then(res => {
          if (!res.ok) throw new Error('Не авторизований');
          return res.json();
        })
        .then(data => {
          setBalance(data.balance ?? 0);
        })
        .catch(() => {
          setIsLoggedIn(false);
          setBalance(null);
          localStorage.removeItem('token');
        });
    }
  }, []);

  return (
    <div className="case-page">
      <div className="crash-header">
        <button className="btn btn-outline back-button" onClick={() => navigate('/')}>← Назад</button>

        <div className="user-menu">
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="profile-icon"
              title="Профіль"
              style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', color: 'white', fontWeight: '600' }}
            >
              <span className="balance-text">{balance !== null ? balance + ' UAH' : '...'}</span>
              <FaUserCircle size={36} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-outline">Реєстрація</Link>
              <Link to="/login" className="btn btn-primary">Авторизація</Link>
            </>
          )}
        </div>
      </div>

      <h2 className="case-title">Гра "Літачок"</h2>
      <p className="crash-description">
        Постав одну зі своїх фігурок і спробуй забрати виграш до того, як літачок зникне!
      </p>

      <div className="crash-placeholder">
        🚀 Літачок скоро злетить...
      </div>
    </div>
  );
};

export default CrashGame;
