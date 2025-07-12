import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const Exchange = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);
  const [sortOrderLeft, setSortOrderLeft] = useState(null);
  const [sortOrderRight, setSortOrderRight] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);

      fetch('https://funko-case-opener.onrender.com/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token },
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
    } else {
      setIsLoggedIn(false);
      setBalance(null);
    }
  }, []);

  return (
    <div className="home-container">
      <button className="btn btn-outline back-button" onClick={() => navigate('/')}>← На головну</button>
      <header className="header">
        <div className="logo" onClick={() => navigate('/')}>
          <h1>Фанко Казіно</h1>
        </div>
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
      </header>

      <main>
        <h2 style={{ textAlign: 'center', color: 'white', marginTop: '20px' }}>Сторінка обміну</h2>

        <div className="exchange-area">
          {/* Лівий блок — інвентар */}
          <div className="inventory-panel">
            <div className="inventory-header">
              <h3>Ваш інвентар</h3>
              <button
                className="btn btn-sort"
                onClick={() =>
                  setSortOrderLeft(prev =>
                    prev === null ? 'asc' : prev === 'asc' ? 'desc' : null
                  )
                }
              >
                {sortOrderLeft === 'asc' && 'Сортувати за ↓'}
                {sortOrderLeft === 'desc' && 'Скасувати сортування'}
                {sortOrderLeft === null && 'Сортувати за ↑'}
              </button>
            </div>
            <div className="inventory-grid">
              <div className="figure-card placeholder-card">
                <p style={{ textAlign: 'center', padding: '40px 10px' }}>Фігурки з інвентаря ще не завантажені</p>
              </div>
            </div>
          </div>

          {/* Правий блок — фігурки з бази */}
          <div className="exchange-panel">
            <div className="inventory-header">
              <h3>Усі фігурки</h3>
              <button
                className="btn btn-sort"
                onClick={() =>
                  setSortOrderRight(prev =>
                    prev === null ? 'asc' : prev === 'asc' ? 'desc' : null
                  )
                }
              >
                {sortOrderRight === 'asc' && 'Сортувати за ↓'}
                {sortOrderRight === 'desc' && 'Скасувати сортування'}
                {sortOrderRight === null && 'Сортувати за ↑'}
              </button>
            </div>
            <div className="inventory-grid">
              <div className="figure-card placeholder-card">
                <p style={{ textAlign: 'center', padding: '40px 10px' }}>Фігурки з бази ще не завантажені</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Exchange;