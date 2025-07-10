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
  const [animationY, setAnimationY] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const maxDuration = 30000; // 30s
  const [startTime, setStartTime] = useState(null);
  const requestRef = useRef();

  const endGame = useCallback(() => {
    setIsGameRunning(false);
    cancelAnimationFrame(requestRef.current);
    if (!hasClaimed) {
      setGameOver(true);
    }
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
    setAnimationY(elapsed / 10);
  }, [startTime, endGame]);

  const startGame = () => {
    setIsGameRunning(true);
    setCoefficient(1.0);
    setAnimationY(0);
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
    alert(`Ви виграли ${Math.round(winAmount)}₴! (поки без оновлення інвентаря)`);
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
        .catch((err) => {
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
    setSelectedIndexes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
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

  // Визначаємо позицію літака по bottom з обмеженням щоб він не вилітав раніше часу
  const containerHeight = 300; // px висота блоку
  const containerWidth = 300;  // px ширина блоку

  // Максимальне сміщення літака по bottom (0..300)
  // Літак летить до середини блоку (150px) по bottom та left, далі залишається по центру, поки гра не завершена.
  // Після закінчення гри літак вилітає по діагоналі вправо вгору.
  const maxFlightBottom = containerHeight / 2; // 150 px
  const maxFlightLeft = containerWidth / 2; // 150 px
  const exitDistance = 150; // Відстань виліту за межі

  // Розрахунок позиції літака з урахуванням стану гри і анімації
  const getPlanePosition = () => {
    if (!isGameRunning && !gameOver) {
      return {
        bottom: 0,
        left: 0,
      };
    }

    // Прогрес польоту від 0 до 1
    const progress = Math.min(animationY / maxDuration * maxDuration, maxDuration) / maxDuration;

    if (progress < 0.5) {
      // Літак рухається до центру по діагоналі
      const p = progress / 0.5; // 0..1
      return {
        bottom: maxFlightBottom * p,
        left: maxFlightLeft * p,
      };
    } else if (progress < 1) {
      // Літак стоїть в центрі
      return {
        bottom: maxFlightBottom,
        left: maxFlightLeft,
      };
    } else {
      // Виліт за межі по діагоналі
      const p = (progress - 1) * 2; // виходить > 0
      return {
        bottom: maxFlightBottom + exitDistance * p,
        left: maxFlightLeft + exitDistance * p,
      };
    }
  };

  const planePos = getPlanePosition();

  return (
    <div className="crash-game-container">
      <div className="crash-header">
        <button className="btn btn-outline back-button" onClick={() => navigate('/')}>
          ← Назад
        </button>
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
              <Link to="/register" className="btn btn-outline">
                Реєстрація
              </Link>
              <Link to="/login" className="btn btn-primary">
                Авторизація
              </Link>
            </>
          )}
        </div>
      </div>

      <h2 className="case-title" style={{ textAlign: 'center' }}>
        Гра "Літачок"
      </h2>

      {isLoggedIn && (
        <div className="crash-game-main" style={{ display: 'flex', gap: '20px' }}>
          {/* Інвентар - повернуто стиль як у твому коді */}
          <div className="inventory-panel">
            <div className="inventory-header">
              <h3>Ваш інвентар</h3>
              <div className="bet-sum">
                Сума ставки: <strong>{Math.round(totalBetAmount)}₴</strong>
              </div>
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

          {/* Ігрове поле */}
          <div
            className="game-field"
            style={{
              position: 'relative',
              height: containerHeight,
              width: containerWidth,
              border: '1px solid #ccc',
              overflow: 'hidden',
            }}
          >
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
                {/* Контейнер для літака і стрічки (повернутий на 45 градусів) */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: containerHeight,
                    width: containerWidth,
                    transform: 'rotate(45deg)',
                    transformOrigin: 'bottom left',
                    overflow: 'visible',
                  }}
                >
                  {/* Рухома стрічка - пунктирна лінія, що рухається вправо */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '-200%', // починаємо далеко зліва
                      width: '400%',
                      height: '2px',
                      borderBottom: '2px dashed #4cb7ff',
                      animation: 'dashmove 3s linear infinite',
                    }}
                  />

                  {/* Літак */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: planePos.bottom,
                      left: planePos.left,
                      width: '60px',
                      height: '60px',
                      transform: 'rotate(-45deg)', // щоб літак не був повернутий разом з контейнером
                      transition: 'bottom 0.1s linear, left 0.1s linear',
                    }}
                  >
                    <img src="/images/plane.png" alt="plane" style={{ width: '60px', height: '60px' }} />
                    <div
                      style={{
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginTop: '4px',
                      }}
                    >
                      {coefficient}x
                    </div>
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

            {gameOver && <p style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>💥 Ви не встигли забрати виграш!</p>}
          </div>
        </div>
      )}
      <style>{`
        @keyframes dashmove {
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default CrashGame;