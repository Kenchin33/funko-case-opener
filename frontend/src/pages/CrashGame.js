import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import './style.css';


const Cloud = ({ style }) => (
    <div className="cloud" style={style}>
      <svg
        width="60"
        height="40"
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="20" cy="20" rx="20" ry="15" fill="white" />
        <ellipse cx="40" cy="20" rx="20" ry="15" fill="white" />
        <ellipse cx="30" cy="15" rx="25" ry="18" fill="white" />
      </svg>
    </div>
  );

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
  const [, setAnimationY] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const maxDuration = 30000; // 30 секунд
  const [startTime, setStartTime] = useState(null);
  const requestRef = useRef();
  const gameFieldRef = useRef();
  const gameAudioRef = useRef(null);
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const [instantCrashChance, setInstantCrashChance] = useState(0.01);
  const generatedCoefficientRef = useRef(null);

  // Визначення хмаринок з позицією по top і left, швидкістю анімації та масштабом
  const clouds = [
    { top: '10%', animationDuration: '4s', animationDelay: '0s', scale: 1, left: '100%' },
    { top: '20%', animationDuration: '4.5s', animationDelay: '0.5s', scale: 0.4, left: '100%' },
    { top: '30%', animationDuration: '3.8s', animationDelay: '0.2s', scale: 0.8, left: '100%' },
    { top: '40%', animationDuration: '4.2s', animationDelay: '0.3s', scale: 0.4, left: '100%' },
    { top: '50%', animationDuration: '4.1s', animationDelay: '0.1s', scale: 1.2, left: '100%' },
    { top: '60%', animationDuration: '4.6s', animationDelay: '0.2s', scale: 0.5, left: '100%' },
    { top: '70%', animationDuration: '3.9s', animationDelay: '0.3s', scale: 0.9, left: '100%' },
    { top: '80%', animationDuration: '4.3s', animationDelay: '0.2s', scale: 0.4, left: '100%' },
    { top: '90%', animationDuration: '4.4s', animationDelay: '0.3s', scale: 0.6, left: '100%' },
    { top: '100%', animationDuration: '4s', animationDelay: '0.2s', scale: 1, left: '100%' },
  ];  

  useEffect(() => {
    const updateFieldSize = () => {
      if (gameFieldRef.current) {
        const { offsetWidth } = gameFieldRef.current;
        setFieldSize({ width: offsetWidth, height: offsetWidth });
      }
    };

    updateFieldSize();
    window.addEventListener('resize', updateFieldSize);
    return () => window.removeEventListener('resize', updateFieldSize);
  }, [isGameRunning]);

  useEffect(() => {
    gameAudioRef.current = new Audio('/sounds/win-sound.mp3');
    gameAudioRef.current.loop = true; // щоб звук крутився циклічно
  }, []);

  const endGame = useCallback(() => {
    setIsGameRunning(false);
    cancelAnimationFrame(requestRef.current);

    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current.currentTime = 0;
    }

    if (!hasClaimed) {
      // Гравець програв — видаляємо поставлені фігурки
      const token = localStorage.getItem('token');
      const selected = Array.from(selectedIndexes);
    
      if (token && selected.length > 0) {
        axios.post(
          'https://funko-case-opener.onrender.com/api/crash/lost-bet',
          { selectedIds: selected },
          { headers: { Authorization: `Bearer ${token}` } }
        ).then((res) => {
          setInventory(res.data.inventory);
          setBalance(res.data.balance);
          setSelectedIndexes(new Set());
        }).catch((err) => {
          console.error('❌ Помилка при програші:', err);
        });
      }
    
      setGameOver(true);
    }    
  }, [hasClaimed, selectedIndexes]);

  useEffect(() => {
    if (gameOver || hasClaimed) {
      const timer = setTimeout(() => {
        setGameOver(false);
        setCoefficient(1.0);
        setStartTime(null);
        setHasClaimed(false);
        setError(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameOver, hasClaimed]);


  const animate = useCallback(() => {
    if (!isGameRunning || !startTime) return;

    requestRef.current = requestAnimationFrame(animate);
    const elapsed = Date.now() - startTime;

    if (elapsed >= maxDuration) {
      endGame();
      return;
    }

    const newCoef = parseFloat((1 + Math.pow(elapsed / 10000, 1.7)).toFixed(2));
    setCoefficient(newCoef);
    setAnimationY(elapsed / 10);

    if (newCoef >= generatedCoefficientRef.current) {
      endGame();
    }
  }, [ isGameRunning, startTime, endGame]);


  const startGame = () => {

    if (gameAudioRef.current) {
      gameAudioRef.current.currentTime = 0;
      gameAudioRef.current.play().catch(() => {}); // щоб не було помилки, якщо без звуку
    }

    setIsGameRunning(true);
    setCoefficient(1.0);
    setAnimationY(0);
    setStartTime(Date.now());
    setGameOver(false);
    setHasClaimed(false);
    setError(null);

    if (!generatedCoefficientRef.current) {
      generateCrashCoefficient();
    }
  };


  const handleClaim = async () => {
    if (!isGameRunning || hasClaimed) return;

    cancelAnimationFrame(requestRef.current);
    setIsGameRunning(false);
    setHasClaimed(true);

    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current.currentTime = 0;
    }

    const claimedCoefficient = coefficient;
  
    try {
      const token = localStorage.getItem('token');
      const selected = Array.from(selectedIndexes);

      const resp = await axios.post(
        'https://funko-case-opener.onrender.com/api/crash/claim-reward',
        { selectedIds: selected, coefficient: claimedCoefficient },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setInventory(resp.data.inventory);
      setBalance(resp.data.balance);
      setSelectedIndexes(new Set());
  
      setTimeout(() => {
        setCoefficient(1.0);
        setStartTime(null);
        setError(null);
      }, 2000);
  
    } catch (err) {
      console.error('Claim error', err);
      alert('Помилка при виплаті призу');
    }
  };  
  

  const handlePlaceBet = () => {
    if (isGameRunning || gameOver ) return;
  
    if (selectedIndexes.size === 0) {
      setError('Оберіть хоча б одну фігурку для ставки');
      return;
    }
  
    setError(null);
    startGame(); // Просто запускає гру без змін інвентаря
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
      const updated = new Set(prev);
      if (updated.has(index)) updated.delete(index);
      else updated.add(index);

      if (updated.size > 0) {
        generateCrashCoefficient();
      } else {
        generatedCoefficientRef.current = null; // скидаємо
      }

      return new Set(updated);
    });
  };

  const totalBetAmount = [...selectedIndexes].reduce((acc, idx) => {
    const price = inventory[idx]?.price ?? 0;
    return acc + price;
  }, 0);

  useEffect(() => {
    if (isGameRunning && startTime !== null) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(requestRef.current);
  }, [isGameRunning, startTime, animate]);

  const containerSize = Math.min(fieldSize.width, fieldSize.height);

  
  const getPlanePosition = () => {
    const { width, height } = fieldSize;

    if (width === 0 || height === 0) return { x: 0, y: 0 };

    if (!isGameRunning && !gameOver && !hasClaimed) {
      return { x: 0, y: containerSize - 60 };
    }

    const coefLeft = generatedCoefficientRef.current - coefficient;

    if (coefLeft < 0.02 && generatedCoefficientRef.current > 1.01) {
      // Літак вилітає швидко вправо вгору
      // Позиція дуже далеко праворуч і вгору з анімацією, припустимо
      return {
        x: width + 300,
        y: -200,
      };
    }

    const startToCenterEndCoef = 1.2;

    if (coefficient < startToCenterEndCoef) {
      const progress = (coefficient - 1) / (startToCenterEndCoef - 1);
      return {
        x: progress * (width / 2),
        y: height - progress * (height / 2) - 60,
      };
    } else if (coefficient < 2.9) {
      return {
        x: width / 2,
        y: height / 1.8 - 60,
      };
    } else if (coefficient < 3) {
      const progress = (coefficient - 2.9) / (3 - 2.9);
      return {
        x: (width / 2) + progress * (width / 2) + progress * 100,
        y: (height / 2) - progress * (height / 2) - progress * 100 - 60,
      };
    } else {
      return {
        x: width + 100,
        y: -100,
      };
    }
  };

  const PlanePosition = getPlanePosition();


  const generateCrashCoefficient = () => {
    const rand = Math.random();
  
    let coef = 1.0;
  
    if (rand < instantCrashChance) {
      coef = 1.0;
      setInstantCrashChance(0.10); // наступна гра: збільшуємо шанс інстант-крашу
      console.log('%c💥 Instant Crash! Коефіцієнт: 1.00x', 'color: red; font-weight: bold;');
    } else {
      // нормальна гра – повертаємо шанси назад, якщо вони були збільшені
      if (instantCrashChance > 0.01) {
        setInstantCrashChance(0.01);
      }
  
      const ranges = [
        { chance: 0.55, min: 1.01, max: 1.99 },
        { chance: instantCrashChance > 0.01 ? 0.20 : 0.30, min: 2.0, max: 4.99 },
        { chance: 0.10, min: 5.0, max: 9.99 },
        { chance: 0.03, min: 10.0, max: 100.0 },
        { chance: 0.01, min: 100.0, max: 500.0 }
      ];
  
      let cumulative = 0;
      const r = Math.random();
  
      for (const range of ranges) {
        cumulative += range.chance;
        if (r < cumulative) {
          coef = parseFloat(
            (range.min + Math.random() * (range.max - range.min)).toFixed(2)
          );
          break;
        }
      }
  
      console.log(`🎲 Згенерований коефіцієнт: ${coef}x`);
    }
  
    generatedCoefficientRef.current = coef;
  };
  



  return (
    <div className="crash-game-container">
      <div className="crash-header">
        <button className="btn btn-outline back-button" onClick={() => navigate('/')}>
          ← На головну
        </button>
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

      <h2 className="case-title" style={{ textAlign: 'center' }}>
        Гра "Літачок"
      </h2>

      {isLoggedIn && (
        <div className="crash-game-main" style={{ display: 'flex', gap: '20px' }}>
          {/* Інвентар */}
          <div className="inventory-panel">
            <div className="inventory-header">
              <h3>Ваш інвентар</h3>
              <div className="bet-sum">
                Сума ставки: <strong>{Math.round(totalBetAmount)}$</strong>
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
            ref={gameFieldRef}
            style={{
              position: 'relative',
              border: '1px solid #ccc',
              overflow: 'hidden',
            }}
          >
            <h3 style={{ textAlign: 'center' }}>Ігрове поле</h3>

            {(isGameRunning || gameOver || hasClaimed) && (
              <div
                className="coefficient-static"
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  marginBottom: '10px',
                  color: hasClaimed ? 'limegreen' : gameOver ? 'red' : 'white',
                  userSelect: 'none',
                }}
              >
                {coefficient}x
              </div>
            )}

            {!isGameRunning && !gameOver && (
              <button
                onClick={handlePlaceBet}
                className="btn btn-primary"
                disabled={selectedIndexes.size === 0}
                style={{ display: 'block', margin: '10px auto', zIndex: 1000 }}
              >
                Поставити обрані фігурки
              </button>
            )}

            {error && <p className="error-message">{error}</p>}

            {/* Хмаринки */}
            {clouds.map((cloud, i) => (
              <Cloud
                key={i}
                style={{
                  top: cloud.top,
                  left: cloud.left,
                  animationName: 'moveCloud',
                  animationDuration: cloud.animationDuration,
                  animationDelay: cloud.animationDelay,
                  transform: `scale(${cloud.scale})`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  position: 'absolute',
                  willChange: 'transform',
                  opacity: 0.8,
                  filter: 'drop-shadow(0 0 1px #bbb)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            ))}

            {/* Постійно відображається поле з літаком */}
            <div
              className="animation-container"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: containerSize,
                width: containerSize,
                overflow: 'visible',
              }}
            >
              {/* Пунктирна лінія по діагоналі */}
              <div className="dashed-line" />

              {/* Статичний літак до старту гри */}
              {!isGameRunning && !gameOver && (
                <div
                  className="plane"
                  style={{
                    transform: `translate(0px, ${containerSize - 60}px)`,
                  }}
                >
                  <img src="/images/plane.png" alt="plane" />
                </div>
              )}

              {/* Анімований літак під час гри */}
              {isGameRunning && (
                <div
                  className="plane"
                  style={{
                    transform: `translate(${PlanePosition.x}px, ${PlanePosition.y}px)`,
                  }}
                >
                  <img src="/images/plane1.png" alt="plane" />
                </div>
              )}
            </div>

            {/* Кнопка "Забрати виграш" */}
            {isGameRunning && (
              <button
                onClick={handleClaim}
                className="btn btn-outline"
                style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}
              >
                Забрати виграш
              </button>
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