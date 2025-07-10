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
  const [selectedFigureIndex, setSelectedFigureIndex] = useState(null);
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
          // Масив інвентарю з populated figure
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

  const handleSelectFigure = (index) => {
    setSelectedFigureIndex(index);
  };

  const handlePlaceBet = () => {
    if (selectedFigureIndex === null) {
      setError('Оберіть фігурку для ставки');
      return;
    }
    setError(null);
    const selectedFigure = inventory[selectedFigureIndex];
    // Тут можна додати логіку старту гри з вибраною фігуркою
    alert(`Поставлено фігурку: ${selectedFigure.figure.name}`);
  };

  return (
    <div className="case-page">
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
        Постав одну зі своїх фігурок і спробуй забрати виграш до того, як літачок зникне!
      </p>

      {loadingInventory && <p>Завантаження інвентарю...</p>}

      {isLoggedIn && !loadingInventory && (
        <>
          {inventory.length === 0 ? (
            <p>У вас немає фігурок в інвентарі для ставки.</p>
          ) : (
            <div className="inventory-grid">
              {inventory.map((entry, index) => {
                const figure = entry.figure || {};
                const isSelected = index === selectedFigureIndex;
                return (
                  <div
                    key={entry._id || index}
                    className={`figure-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectFigure(index)}
                    style={{ cursor: 'pointer' }}
                    title={`Фігурка: ${figure.name}`}
                  >
                    <img src={figure.image || '/unknown.png'} alt={figure.name || 'Невідома фігурка'} />
                    <p>{figure.name || 'Невідома фігурка'}</p>
                    <p className={`rarity ${figure.rarity || ''}`}>{figure.rarity || ''}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>{entry.price ?? '–'}₴</p>
                  </div>
                );
              })}
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button
            onClick={handlePlaceBet}
            className="btn btn-primary"
            disabled={selectedFigureIndex === null}
            style={{ marginTop: '20px' }}
          >
            Поставити фігурку
          </button>
        </>
      )}

      {!isLoggedIn && (
        <div className="crash-placeholder">
          🚀 Літачок скоро злетить...
        </div>
      )}
    </div>
  );
};

export default CrashGame;