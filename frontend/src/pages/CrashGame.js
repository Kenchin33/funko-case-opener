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
  const [animationProgress, setAnimationProgress] = useState(0); // 0..1, позиція літака
  const [gameOver, setGameOver] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const maxDuration = 30000; // 30 секунд
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

    // Коєфіцієнт росте
    const newCoef = parseFloat((1 + Math.pow(elapsed / 10000, 1.7)).toFixed(2));
    setCoefficient(newCoef);

    // Позиція літака від 0 до 1, де 0 — низ ліворуч, 0.5 — центр, 1 — правий верхній (для виліту)
    const progress = Math.min(elapsed / maxDuration, 1);
    setAnimationProgress(progress);
  }, [startTime, endGame]);

  const startGame = () => {
    setIsGameRunning(true);
    setCoefficient(1.0);
    setAnimationProgress(0);
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

  // Вираховуємо позицію літака по діагоналі (по відсотках від розмірів блоку)
  // Літак летить від bottom-left (0%, 0%) до center (50%, 50%) на progress 0.5,
  // далі залишаємо його в центрі до кінця гри,
  // після закінчення (progress >= 1) - літак вилітає по діагоналі вправо вгору за межі блоку
  const getPlaneStyle = () => {
    const containerSize = 300; // px (висота блоку)
    // Максимальна відстань виліту за межі (від центру)
    const exitDistance = 150;

    if (animationProgress < 0.5) {
      // Рух до центру
      const progress = animationProgress / 0.5; // 0..1
      const leftPercent = progress * 50; // від 0 до 50%
      const bottomPercent = progress * 50; // від 0 до 50%
      return {
        position: 'absolute',
        left: `${leftPercent}%`,
        bottom: `${bottomPercent}%`,
        transform: 'translate(-50%, 50%)',
        transition: 'none',
      };
    } else if (animationProgress < 1) {
      // Літак стоїть у центрі (50%, 50%)
      return {
        position: 'absolute',
        left: `50%`,
        bottom: `50%`,
        transform: 'translate(-50%, 50%)',
        transition: 'none',
      };
    } else {
      // Виліт літака за межі верхнього правого кута
      const exitProgress = (animationProgress - 1); // > 0
      const leftPx = 50 / 100 * containerSize + exitProgress * exitDistance;
      const bottomPx = 50 / 100 * containerSize + exitProgress * exitDistance;
      return {
        position: 'absolute',
        left: `${leftPx}px`,
        bottom: `${bottomPx}px`,
        transform: 'translate(-50%, 50%)',
        transition: 'none',
      };
    }
  };

  // Анімована траєкторія - хвиля, що рухається вічно
  // Це SVG з анімацією шифрується CSS keyframes
  // Додаємо окремий блок над літаком з цією траєкторією

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
          {/* Відновлений стиль інвентаря */}
          <div className="inventory-panel" style={{ flex: '0 0 300px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px', backgroundColor: '#222', color: 'white', height: '380px', overflowY: 'auto' }}>
            <div className="inventory-header" style={{ marginBottom: '10px' }}>
              <h3>Ваш інвентар</h3>
              <div className="bet-sum">
                Сума ставки: <strong>{Math.round(totalBetAmount)}₴</strong>
              </div>
            </div>
            {inventory.length === 0 ? (
              <p>Немає фігурок</p>
            ) : (
              <div className="inventory-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {inventory.map((entry, index) => {
                  const figure = entry.figure || {};
                  const selected = selectedIndexes.has(index);
                  return (
                    <label
                      key={index}
                      className={`figure-card ${selected ? 'selected' : ''}`}
                      style={{
                        border: selected ? '2px solid #4cb7ff' : '1px solid #555',
                        borderRadius: '5px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: selected ? '#1a2a3a' : '#111',
                        color: 'white',
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={selected}
                        onChange={() => toggleSelectFigure(index)}
                      />
                      <img src={figure.image} alt={figure.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                      <p style={{ margin: '6px 0 0', fontWeight: '600' }}>{figure.name}</p>
                      <p className={`rarity ${figure.rarity}`} style={{ fontSize: '0.8em', color: '#aaa' }}>
                        {figure.rarity}
                      </p>
                      <p style={{ margin: '4px 0 0' }}>{entry.price}$</p>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ігрове поле */}
          <div className="game-field" style={{ flex: '1', position: 'relative', border: '1px solid #ccc', borderRadius: '8px', height: '380px', backgroundColor: '#111', overflow: 'hidden' }}>
            <h3 style={{ color: 'white', padding: '8px', textAlign: 'center' }}>Ігрове поле</h3>
            {!isGameRunning && !gameOver && (
              <button onClick={handlePlaceBet} className="btn btn-primary" disabled={selectedIndexes.size === 0} style={{ margin: '10px auto', display: 'block' }}>
                Поставити обрані фігурки
              </button>
            )}

            {error && <p className="error-message">{error}</p>}

            {isGameRunning && (
              <>
                {/* Траєкторія літака */}
                <svg
                  width="100%"
                  height="60"
                  style={{ position: 'absolute', bottom: '80px', left: 0, overflow: 'visible', userSelect: 'none' }}
                  viewBox="0 0 300 60"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="none"
                    stroke="#4cb7ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="15 10"
                    style={{ animation: 'dashmove 3s linear infinite' }}
                    d="M0 50 Q50 10 100 50 T200 50 T300 50"
                  />
                </svg>

                {/* Літак */}
                <div style={getPlaneStyle()}>
                  <img src="/images/plane.png" alt="plane" style={{ width: '60px', height: '60px' }} />
                  <div style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', marginTop: '4px' }}>{coefficient}x</div>
                </div>

                <button onClick={handleClaim} className="btn btn-outline" style={{ marginTop: '20px', position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}>
                  Забрати виграш
                </button>
              </>
            )}

            {gameOver && (
              <p style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>💥 Ви не встигли забрати виграш!</p>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes dashmove {
          to {
            stroke-dashoffset: -25;
          }
        }
      `}</style>
    </div>
  );
};

export default CrashGame;