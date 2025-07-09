import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const CasePage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [resultFigure, setResultFigure] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showChanceInfo, setShowChanceInfo] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const errorTimeoutRef = useRef(null);

  const reelRef = useRef(null);
  const reelContainerRef = useRef(null);
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const winAudioRef = useRef(null);

  // Кольори рідкості
  const rarityColors = {
    Common: 'white',
    Exclusive: '#ff1900',
    Epic: '#9f07db',
    Legendary: '#4cb7ff',
    Grail: 'gold',
  };

  // Для керування анімацією
  const [infiniteRun, setInfiniteRun] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(20); // сек

  // Показ повідомлення помилки з анімацією
  const showErrorMessage = (msg) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorMsg(msg);
    setShowError(false);
    setTimeout(() => setShowError(true), 10);
    errorTimeoutRef.current = setTimeout(() => setShowError(false), 2010);
  };

  // Завантаження даних кейса
  useEffect(() => {
    fetch(`https://funko-case-opener.onrender.com/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data);
        setResultFigure(null);
        setShowResult(false);
      })
      .catch(console.error);
  }, [id]);

  // Авторизація і баланс
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
        .then(data => setBalance(data.balance ?? 0))
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

  // Відкриття кейса
  const openCase = async () => {
    if (!caseData) return;
    if (rolling) return;

    if (!isLoggedIn) {
      showErrorMessage('Будь ласка, увійдіть до системи, щоб відкрити кейс.');
      return;
    }

    if (balance < caseData.price) {
      showErrorMessage('Недостатньо коштів на балансі для відкриття кейсу.');
      return;
    }

    setRolling(true);
    setResultFigure(null);
    setShowResult(false);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    setInfiniteRun(true); // Запускаємо інфінітну анімацію прокрутки

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://funko-case-opener.onrender.com/api/cases/${id}/open`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Помилка відкриття кейсу');
      }

      const data = await res.json();

      setBalance(prev => prev - caseData.price);

      // Затримка для показу інфінітної прокрутки мінімум 3 сек
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Зупинка анімації і плавне позиціювання на виграшній фігурці
      setInfiniteRun(false);

      // Обчислюємо позицію виграшної фігурки у першому наборі
      const figures = caseData.figures;
      const winningIndex = figures.findIndex(f => f._id === data._id);
      if (winningIndex === -1) {
        // Якщо не знайшли, просто показуємо результат
        setResultFigure(data);
        setRolling(false);
        setShowResult(true);
        if (audioRef.current) audioRef.current.pause();
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          winAudioRef.current.play();
        }
        return;
      }

      // Ширина одного елемента + відступ
      const reelEl = reelRef.current;
      const containerEl = reelContainerRef.current;
      if (!reelEl || !containerEl) return;

      const reelItem = reelEl.querySelector('.reel-item');
      if (!reelItem) return;

      const itemStyle = window.getComputedStyle(reelItem);
      const itemWidth = reelItem.offsetWidth + parseInt(itemStyle.marginLeft) + parseInt(itemStyle.marginRight);

      const containerWidth = containerEl.offsetWidth;

      // Розрахунок offset: 
      // позиція = -(індекс виграшної * ширина елемента) + (половина ширини контейнера - половина ширини елемента)
      // щоб виграшна фігурка була по центру контейнера
      const offset = -(winningIndex * itemWidth) + (containerWidth / 2) - (itemWidth / 2);

      // Плавно анімувати трансформ стрічки до потрібного offset
      reelEl.style.transition = 'transform 2s ease-out';
      reelEl.style.transform = `translateX(${offset}px)`;

      // Коли анімація закінчиться, показуємо результат і зупиняємо звуки
      const onTransitionEnd = () => {
        reelEl.style.transition = '';
        setResultFigure(data);
        setRolling(false);
        setShowResult(true);

        if (audioRef.current) audioRef.current.pause();
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          winAudioRef.current.play();
        }

        reelEl.removeEventListener('transitionend', onTransitionEnd);
      };

      reelEl.addEventListener('transitionend', onTransitionEnd);

    } catch (err) {
      showErrorMessage(err.message);
      setRolling(false);
      setInfiniteRun(false);
    }
  };

  // Шанси випадіння (з дефолтом)
  const chances = caseData?.rarityChances && Object.keys(caseData.rarityChances).length > 0
    ? caseData.rarityChances
    : {
      Common: 60,
      Exclusive: 20,
      Epic: 10,
      Legendary: 8,
      Grail: 2,
    };

  // Подвійний масив для інфінітної прокрутки
  const figures = caseData?.figures || [];
  const doubleFigures = [...figures, ...figures];

  return (
    <div className="case-page">
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

      {caseData ? (
        <>
          <h2 className="case-title">{caseData.name}</h2>
          <img src={caseData.image} alt={caseData.name} className="case-cover" />

          <div className="open-case-container">
            <button onClick={openCase} disabled={rolling} className="btn btn-primary open-btn">
              {rolling ? 'Відкривається...' : 'Відкрити кейс'}
            </button>

            <span
              className="info-icon"
              onMouseEnter={() => setShowChanceInfo(true)}
              onMouseLeave={() => setShowChanceInfo(false)}
              tabIndex={0}
              onFocus={() => setShowChanceInfo(true)}
              onBlur={() => setShowChanceInfo(false)}
              aria-label="Інформація про шанси випадіння"
              role="button"
            >
              i
            </span>

            {showChanceInfo && (
              <div className="chance-info-popup">
                <h4>Шанси випадіння рідкостей</h4>
                <ul>
                  {Object.entries(chances).map(([rarity, chance]) => (
                    <li key={rarity} style={{ color: rarityColors[rarity] || 'white' }}>
                      {rarity}: {chance}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="reel-arrow" />
          <div className="reel-container" ref={reelContainerRef}>
            <div
              className={`reel ${infiniteRun ? 'infinite' : ''}`}
              style={{ animationDuration: `${animationDuration}s` }}
              ref={reelRef}
            >
              {doubleFigures.map((fig, idx) => (
                <img
                  key={idx}
                  src={fig.image}
                  alt={fig.name}
                  className="reel-item"
                  draggable={false}
                />
              ))}
            </div>
          </div>

          {!rolling && !showResult && (
            <div className="figures-preview">
              <h3>Можуть випасти:</h3>
              <div className="figures-grid">
                {caseData.figures.map(fig => (
                  <div key={fig._id} className="figure-card">
                    <img src={fig.image} alt={fig.name} />
                    <p>{fig.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultFigure && showResult && (
            <div className="result-popup-overlay">
              <div className="result-popup">
                <button className="popup-close" onClick={() => setShowResult(false)}>✖</button>
                <h3>Випала фігурка!</h3>
                <img src={resultFigure.image} alt={resultFigure.name} />
                <p className="popup-name">
                  <strong>{resultFigure.name}</strong> —{' '}
                  <span className={`rarity ${resultFigure.rarity}`}>{resultFigure.rarity}</span>
                </p>
                <p className="popup-price"><strong>{resultFigure.price} UAH</strong></p>
              </div>
            </div>
          )}

          {showError && (
            <div className="error-popup animate-fade-in">
              {errorMsg}
            </div>
          )}

          <audio ref={audioRef} src="/audio/opening.wav" />
          <audio ref={winAudioRef} src="/audio/win.wav" />
        </>
      ) : (
        <p>Завантаження даних кейсу...</p>
      )}
    </div>
  );
};

export default CasePage;