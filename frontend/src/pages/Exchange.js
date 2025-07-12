import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const EXCLUDED_ID = "686f9c79b62dd7c2154d21e9";

const Exchange = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [allFigures, setAllFigures] = useState([]);
  const [sortOrderLeft, setSortOrderLeft] = useState(null);
  const [sortOrderRight, setSortOrderRight] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    fetch('https://funko-case-opener.onrender.com/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(res => {
        if (!res.ok) throw new Error('Не авторизований');
        return res.json();
      })
      .then(data => {
        setIsLoggedIn(true);
        setBalance(data.balance ?? 0);
        setInventory(data.inventory ?? []);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setBalance(null);
        setInventory([]);
        localStorage.removeItem('token');
      });
  }, [token]);

  useEffect(() => {
    fetch('https://funko-case-opener.onrender.com/api/figures')
      .then(res => res.json())
      .then(data => setAllFigures(data))
      .catch(err => console.error('Помилка завантаження фігурок:', err));
  }, []);

  const getSortedInventory = () => {
    if (!sortOrderLeft) return inventory;
    return [...inventory].sort((a, b) =>
      sortOrderLeft === 'asc'
        ? a.figure.price - b.figure.price
        : b.figure.price - a.figure.price
    );
  };

  const getSortedAllFigures = () => {

    const filteredFigures = allFigures.filter(fig => fig._id !== EXCLUDED_ID);

    if (!sortOrderRight) return filteredFigures;
    return [...filteredFigures].sort((a, b) =>
      sortOrderRight === 'asc' ? a.price - b.price : b.price - a.price
    );
  };

  return (
    <div className="home-container">
      <header className="header">
        <button className="btn btn-outline back-button" onClick={() => navigate('/')}>← На головну</button>
        <div className="logo" onClick={() => navigate('/')}>
          <h1>Фанко Казіно</h1>
        </div>
        <div className="user-menu">
          {isLoggedIn ? (
            <Link to="/profile" className="profile-icon" title="Профіль"
              style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', color: 'white', fontWeight: '600' }}>
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
          <div className="inventory-panel-exchange">
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
              {inventory.length === 0 ? (
                <div className="figure-card placeholder-card">
                  <p style={{ textAlign: 'center', padding: '40px 10px' }}>У вас ще немає фігурок</p>
                </div>
              ) : (
                getSortedInventory().map((entry, idx) => {
                  const figure = entry.figure || {};
                  return (
                    <div key={idx} className="figure-card">
                      <img src={figure.image} alt={figure.name} />
                      <p>{figure.name}</p>
                      <p className={`rarity ${figure.rarity}`}>{figure.rarity}</p>
                      <p>{entry.price}$</p>
                    </div>
                  );
                })
              )}
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
              {allFigures.length === 0 ? (
                <div className="figure-card placeholder-card">
                  <p style={{ textAlign: 'center', padding: '40px 10px' }}>Немає доступних фігурок</p>
                </div>
              ) : (
                getSortedAllFigures().map((figure, idx) => (
                  <div key={idx} className="figure-card">
                    <img src={figure.image} alt={figure.name} />
                    <p>{figure.name}</p>
                    <p className={`rarity ${figure.rarity}`}>{figure.rarity}</p>
                    <p>{figure.price}$</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Exchange;