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
  const [animationProgress, setAnimationProgress] = useState(0); // 0-1 прогрес анімації руху літака по діагоналі
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

    // Прогрес анімації руху літака по діагоналі (0 до 0.5 — рух, 0.5-1 — літак зафіксований в центрі)
    // Рух до центру займає половину часу гри
    const progress = Math.min(elapsed / (maxDuration / 2), 1);
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

  // Обчислення позиції літака:
  // maxPositionX, maxPositionY - розміри блоку анімації
  // Літак рухається від (0%, 0%) (нижній лівий кут) до (50%, 50%) (центр блоку)
  // Після centerProgress літак залишається в центрі, а коефіцієнт росте
  // Коли гра закінчена, літак вилітає за верхній правий кут (за межі)

  // Для відображення положення літака:
  // bottom: для вертикального позиціювання (0 - низ, 100% - верх)
  // left: для горизонтального позиціювання (0 - ліво, 100% - право)

  //const maxAnimationSize = 300; // висота блоку, треба витягти з CSS або задати фіксовано

  // Параметри позиціонування літака в пікселях:
  //const blockWidthPercent = 100; // ширина блоку 100%
  const blockHeightPx = 300; // висота блоку 300px

  // Позиції у відсотках (0-50%) і пікселях (0-150px) для руху до центру:
  // При прогресі від 0 до 1 літак рухається по діагоналі (x, y)
  // Але обмежимо, що рух по діагоналі від 0 до 0.5, далі літак "застигає" в центрі (50% ширини, 150px висоти)

  // Параметри для "вилітання" літака за межі після закінчення:
  // Вилітання анімоване лінійно по горизонталі і вертикалі за межі блоку

  // Відповідно до станів:
  // якщо isGameRunning === false і hasClaimed або gameOver === true — запускаємо вилітання

  // Обчислюємо позиції:
  let planeLeftPercent;
  let planeBottomPx;

  if (isGameRunning) {
    if (animationProgress <= 1) {
      // Рух по діагоналі від 0 до 50% по ліву, від 0 до 150px по низу
      // Якщо animationProgress <= 0.5 рух до центру
      const moveProgress = Math.min(animationProgress * 2, 1); // шкалуємо 0-0.5 до 0-1
      planeLeftPercent = moveProgress * 50;
      planeBottomPx = moveProgress * (blockHeightPx / 2);
    } else {
      // Уже в центрі
      planeLeftPercent = 50;
      planeBottomPx = blockHeightPx / 2;
    }
  } else if (gameOver || hasClaimed) {
    // Вилітання за межі блоку (починаючи від центру)
    // Для плавного вилітання зробимо анімацію на 2 секунди з прогресом часу з моменту закінчення гри

    const endElapsed = startTime ? (Date.now() - (startTime + maxDuration)) : 0;
    const exitProgress = Math.min(endElapsed / 2000, 1);

    // Літак вилітає вгору вправо за межі блоку (100% + 50%) і висота блоку + 100px
    planeLeftPercent = 50 + exitProgress * 50 + exitProgress * 50; // 50% + 50% + ще 50% для більшого виліту
    planeBottomPx = blockHeightPx / 2 + exitProgress * 150; // вверх на 150px
  } else {
    // Початкова позиція - нижній лівий кут
    planeLeftPercent = 0;
    planeBottomPx = 0;
  }

  return (
    <div className="crash-game-container" style={{ height: '600px' /* щоб було видно */, width: '100%' }}>
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
              <Link to="/register" className="btn btn-outline">Реєстрація</Link>
              <Link to="/login" className="btn btn-primary">Авторизація</Link>
            </>
          )}
        </div>
      </div>

      <h2 className="case-title" style={{ textAlign: 'center' }}>
        Гра "Літачок"
      </h2>

      {isLoggedIn && (
        <div className="crash-game-main" style={{ display: 'flex', gap: '20px' }}>
          <div className="inventory-panel" style={{ flexBasis: '30%', overflowY: 'auto', maxHeight: '500px' }}>
            <div className="inventory-header">
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
                        border: selected ? '2px solid #ff4081' : '1px solid #ccc',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={selected}
                        onChange={() => toggleSelectFigure(index)}
                      />
                      <img src={figure.image} alt={figure.name} style={{ width: '100%', borderRadius: '6px' }} />
                      <p>{figure.name}</p>
                      <p className={`rarity ${figure.rarity}`}>{figure.rarity}</p>
                      <p>{entry.price}$</p>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="game-field"
            style={{
              flexBasis: '70%',
              position: 'relative',
              height: blockHeightPx,
              border: '1px solid #ccc',
              overflow: 'hidden',
              background: '#000814',
              borderRadius: '12px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px',
            }}
          >
            <h3>Ігрове поле</h3>

            {!isGameRunning && !gameOver && (
              <button
                onClick={handlePlaceBet}
                className="btn btn-primary"
                disabled={selectedIndexes.size === 0}
                style={{ marginBottom: '15px' }}
              >
                Поставити обрані фігурки
              </button>
            )}

            {error && (
              <p className="error-message" style={{ marginBottom: '15px', color: '#ff4c60' }}>
                {error}
              </p>
            )}

            {isGameRunning && (
              <>
                <div
                  className="plane-wrapper"
                  style={{
                    position: 'absolute',
                    bottom: planeBottomPx,
                    left: `${planeLeftPercent}%`,
                    transform: 'translate(-50%, 0)',
                    transition: 'bottom 0.1s linear, left 0.1s linear',
                    pointerEvents: 'none',
                  }}
                >
                  <img src="/images/plane.png" alt="plane" style={{ width: '60px', height: '60px' }} />
                  <div
                    style={{
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginTop: '4px',
                      textShadow: '0 0 5px #ff4081',
                    }}
                  >
                    {coefficient}x
                  </div>
                </div>
                <button onClick={handleClaim} className="btn btn-outline" style={{ marginTop: 'auto' }}>
                  Забрати виграш
                </button>
              </>
            )}

            {(gameOver || hasClaimed) && (
              <p style={{ color: 'red', marginTop: '20px', fontWeight: '700' }}>💥 Ви не встигли забрати виграш!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGame;
