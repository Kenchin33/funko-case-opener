import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import './style.css';

const CrashGame = () => {
  const navigate = useNavigate();
  const [, setLoadingInventory] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [error, setError] = useState(null);

  const [isGameRunning, setIsGameRunning] = useState(false);
  const [coefficient, setCoefficient] = useState(1.0);
  const [gameOver, setGameOver] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const requestRef = useRef();

  const maxDuration = 30000; // 30s
  const containerSize = 300;
  const diagonalLength = Math.sqrt(containerSize ** 2 + containerSize ** 2);

  const endGame = useCallback(() => {
    setIsGameRunning(false);
    cancelAnimationFrame(requestRef.current);
    if (!hasClaimed) setGameOver(true);
  }, [hasClaimed]);

  const animate = useCallback(() => {
    if (!startTime) return;
    requestRef.current = requestAnimationFrame(animate);
    const elapsed = Date.now() - startTime;
    if (elapsed >= maxDuration) {
      endGame();
      return;
    }
    const newCoef = parseFloat((1 + Math.pow(elapsed / 10000, 1.7)).toFixed(2));
    setCoefficient(newCoef);
  }, [startTime, endGame]);

  const startGame = () => {
    setIsGameRunning(true);
    setCoefficient(1.0);
    setStartTime(Date.now());
    setGameOver(false);
    setHasClaimed(false);
    setError(null);
  };

  const handleClaim = () => {
    setHasClaimed(true);
    setIsGameRunning(false);
    cancelAnimationFrame(requestRef.current);
    const winAmount = totalBetAmount * coefficient;
    alert(`Ви виграли ${Math.round(winAmount)}₴!`);
  };

  const handlePlaceBet = () => {
    if (selectedIndexes.size === 0) {
      setError('Оберіть хоча б одну фігурку для ставки');
      return;
    }
    setError(null);
    startGame();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setLoadingInventory(true);
      axios
        .get('https://funko-case-opener.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setBalance(res.data.balance ?? 0);
          setInventory(res.data.inventory || []);
          setLoadingInventory(false);
        })
        .catch(() => {
          setIsLoggedIn(false);
          setBalance(null);
          setInventory([]);
          setLoadingInventory(false);
          localStorage.removeItem('token');
        });
    }
  }, []);

  const toggleSelectFigure = (index) => {
    setSelectedIndexes((prev) => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  };

  const totalBetAmount = [...selectedIndexes].reduce((acc, idx) => {
    const price = inventory[idx]?.price ?? 0;
    return acc + price * 0.75 * 42;
  }, 0);

  useEffect(() => {
    if (isGameRunning && startTime !== null) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isGameRunning, startTime, animate]);

  const getPlanePosition = () => {
    if (!isGameRunning && !gameOver) return 0;
    const now = Date.now();
    const elapsed = now - startTime;

    if (elapsed < 15000) {
      return (elapsed / 15000) * 0.5;
    } else if (elapsed < 27000) {
      return 0.5;
    } else if (elapsed < maxDuration) {
      const extra = (elapsed - 27000) / (maxDuration - 27000);
      return 0.5 + extra;
    } else {
      return 1.5;
    }
  };

  const position = getPlanePosition();
  const planeTop = containerSize - position * containerSize - 30;
  const planeLeft = position * containerSize - 30;

  return (
    <div className="crash-game-container">
      <div className="crash-header">
        <button className="btn btn-outline back-button" onClick={() => navigate('/')}>
          ← Назад
        </button>
        <div className="user-menu">
          {isLoggedIn ? (
            <Link to="/profile" className="profile-icon" style={{ color: 'white', fontWeight: '600' }}>
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

      <h2 className="case-title" style={{ textAlign: 'center' }}>Гра "Літачок"</h2>

      {isLoggedIn && (
        <div className="crash-game-main">
          <div className="inventory-panel">
            <div className="inventory-header">
              <h3>Ваш інвентар</h3>
              <div className="bet-sum">Сума ставки: <strong>{Math.round(totalBetAmount)}₴</strong></div>
            </div>
            {inventory.length === 0 ? (
              <p>Немає фігурок</p>
            ) : (
              <div className="inventory-grid">
                {inventory.map((entry, index) => {
                  const figure = entry.figure || {};
                  const selected = selectedIndexes.has(index);
                  return (
                    <label key={index} className={`figure-card ${selected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={selected}
                        onChange={() => toggleSelectFigure(index)}
                      />
                      <img src={figure.image} alt={figure.name} />
                      <p>{figure.name}</p>
                      <p className={`rarity ${figure.rarity}`}>{figure.rarity}</p>
                      <p>{entry.price}$</p>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="game-field" style={{ width: containerSize, height: containerSize, overflow: 'visible' }}>
            <h3 style={{ textAlign: 'center' }}>Ігрове поле</h3>

            {!isGameRunning && !gameOver && (
              <button
                onClick={handlePlaceBet}
                className="btn btn-primary"
                disabled={selectedIndexes.size === 0}
                style={{ display: 'block', margin: '10px auto' }}
              >
                Поставити обрані фігурки
              </button>
            )}

            {error && <p className="error-message">{error}</p>}

            {isGameRunning && (
              <>
                <div className="animation-container" style={{ position: 'absolute', bottom: 0, left: 0 }}>
                  <div
                    className="dashed-line"
                    style={{
                      width: diagonalLength,
                      height: 2,
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      transform: 'rotate(45deg)',
                      transformOrigin: 'left bottom',
                      animation: 'dashmove 3s linear infinite',
                    }}
                  />

                  <div
                    className="plane"
                    style={{
                      position: 'absolute',
                      top: planeTop,
                      left: planeLeft,
                      transition: 'top 0.1s linear, left 0.1s linear',
                    }}
                  >
                    <img src="/images/plane.png" alt="plane" />
                    <div className="coefficient-label">{coefficient}x</div>
                  </div>
                </div>

                <button
                  onClick={handleClaim}
                  className="btn btn-outline"
                  style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}
                >
                  Забрати виграш
                </button>
              </>
            )}

            {gameOver && (
              <p style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>
                💥 Ви не встигли забрати виграш!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGame;