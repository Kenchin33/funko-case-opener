import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import './style.css';

const CrashGame = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setLoadingInventory(true);
      axios.get('https://funko-case-opener.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          setBalance(res.data.balance ?? 0);
          setInventory(res.data.inventory || []);
          setLoadingInventory(false);
        })
        .catch(err => {
          console.error('Помилка завантаження профілю:', err);
          setIsLoggedIn(false);
          setBalance(null);
          setInventory([]);
          setLoadingInventory(false);
          localStorage.removeItem('token');
        });
    }
  }, []);

  const toggleSelectFigure = (index) => {
    setSelectedIndexes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const totalBetAmount = [...selectedIndexes].reduce((acc, idx) => {
    const figureEntry = inventory[idx];
    const price = figureEntry?.price ?? 0;
    return acc + price * 0.75 * 42;
  }, 0);

  const handlePlaceBet = () => {
    if (selectedIndexes.size === 0) {
      setError('Оберіть хоча б одну фігурку для ставки');
      return;
    }
    setError(null);
    // Логіка початку гри з вибраними фігурками
    const selectedFigures = [...selectedIndexes].map(i => inventory[i].figure.name);
    alert(`Поставлено фігурки: ${selectedFigures.join(', ')}\nСума ставки: ${Math.round(totalBetAmount)}₴`);
  };

  return (
    <div className="crash-game-container">
      <div className="crash-header">
        <button className="btn btn-outline back-button" onClick={() => navigate('/')}>← Назад</button>

        <div style={{ position: 'absolute', top: 20, right: 20 }}>
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
        Постав одну або кілька своїх фігурок і спробуй забрати виграш до того, як літачок зникне!
      </p>

      {loadingInventory && <p>Завантаження інвентарю...</p>}

      {!isLoggedIn && !loadingInventory && (
        <div className="crash-placeholder">
          🚀 Літачок скоро злетить...
        </div>
      )}

      {isLoggedIn && !loadingInventory && (
        <div className="crash-game-main">
          {/* Ліва панель - Інвентар */}
          <div className="inventory-panel">
            <div className="inventory-header">
              <h3>Ваш інвентар</h3>
              <div className="bet-sum">Сума ставки: <strong>{Math.round(totalBetAmount)}₴</strong></div>
            </div>

            {inventory.length === 0 ? (
              <p>У вас немає фігурок в інвентарі.</p>
            ) : (
              <div className="inventory-grid">
                {inventory.map((entry, index) => {
                  const figure = entry.figure || {};
                  const isSelected = selectedIndexes.has(index);
                  return (
                    <label
                      key={entry._id || index}
                      className={`figure-card ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFigure(index)}
                        style={{ display: 'none' }}
                      />
                      <img src={figure.image || '/unknown.png'} alt={figure.name || 'Невідома фігурка'} />
                      <p>{figure.name || 'Невідома фігурка'}</p>
                      <p className={`rarity ${figure.rarity || ''}`}>{figure.rarity || ''}</p>
                      <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>{entry.price ?? '–'}$</p>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Права панель - Ігрове поле */}
          <div className="game-field">
            <h3>Ігрове поле</h3>
            {/* Тут можна додати графіку гри, стан, кнопки і тд */}

            {error && <p className="error-message">{error}</p>}

            <button
              onClick={handlePlaceBet}
              className="btn btn-primary"
              disabled={selectedIndexes.size === 0}
            >
              Поставити обрані фігурки
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGame;
