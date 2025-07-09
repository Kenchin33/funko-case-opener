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
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const winAudioRef = useRef(null);

  const rarityColors = {
    Common: 'white',
    Exclusive: '#ff1900',
    Epic: '#9f07db',
    Legendary: '#4cb7ff',
    Grail: 'gold',
  };

  // Показ повідомлення з анімацією і автоскриттям
  const showErrorMessage = (msg) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    setErrorMsg(msg);
    setShowError(false);
    setTimeout(() => {
      setShowError(true);
    }, 10);
    errorTimeoutRef.current = setTimeout(() => {
      setShowError(false);
    }, 2010);
  };

  useEffect(() => {
    fetch(`https://funko-case-opener.onrender.com/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data);
        fillReelWithRandom(data.figures);
      })
      .catch(console.error);
  }, [id]);

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

  const fillReelWithRandom = (figures, repeat = 100) => {
    const reel = reelRef.current;
    if (!reel || !figures || figures.length === 0) return;

    reel.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < repeat; i++) {
      const fig = figures[Math.floor(Math.random() * figures.length)];
      const img = document.createElement('img');
      img.src = fig.image;
      img.alt = fig.name;
      img.className = 'reel-item';
      fragment.appendChild(img);
    }
    reel.appendChild(fragment);
  };

  const openCase = async () => {
    if (!caseData) return;

    if (showError) setShowError(false);

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

      const reel = reelRef.current;
      const figures = caseData.figures;

      const reelItemWidth = window.innerWidth < 480 ? 70 : window.innerWidth < 768 ? 100 : 140;
      const visibleCount = Math.floor(reel.parentElement.offsetWidth / reelItemWidth);
      const centerIndex = Math.floor(visibleCount / 2);
      const repeatCount = 50;

      const randomFigures = Array.from({ length: repeatCount }, () =>
        figures[Math.floor(Math.random() * figures.length)]
      );

      const totalPrefix = randomFigures.length;
      const insertAt = window.innerWidth < 480 ? totalPrefix + centerIndex + 28 : window.innerWidth < 768 ? totalPrefix + centerIndex + 3 : totalPrefix + centerIndex;
      const winningFigure = caseData.figures.find(f => f._id === data._id) || data;
      const finalReel = [...randomFigures, winningFigure, ...randomFigures.slice(0, visibleCount)];

      const fragment = document.createDocumentFragment();
      finalReel.forEach((fig) => {
        const img = document.createElement('img');
        img.src = fig.image;
        img.alt = fig.name;
        img.className = 'reel-item';
        fragment.appendChild(img);
      });

      reel.innerHTML = '';
      reel.appendChild(fragment);

      const finalOffset = -(insertAt - centerIndex) * reelItemWidth;
      const duration = 5000;
      const start = performance.now();

      const animate = (timestamp) => {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        const currentPosition = finalOffset * easeOut;
        reel.style.transform = `translateX(${currentPosition}px)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setResultFigure(data);
          setRolling(false);
          setShowResult(true);

          if (audioRef.current) audioRef.current.pause();
          if (winAudioRef.current) {
            winAudioRef.current.currentTime = 0;
            winAudioRef.current.play();
          }
        }
      };

      requestAnimationFrame(animate);
    } catch (err) {
      showErrorMessage(err.message);
      setRolling(false);
    }
  };

  // Логіка продажу фігурки
  const sellFigure = async () => {
    if (!resultFigure) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://funko-case-opener.onrender.com/api/cases/sell-figure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          figureId: resultFigure._id,
          salePrice: resultFigure.price,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Помилка продажу фігурки');
      }

      const data = await res.json();
      setBalance(data.newBalance);
      setShowResult(false);
    } catch (err) {
      showErrorMessage(err.message);
    }
  };

  const chances = caseData?.rarityChances && Object.keys(caseData.rarityChances).length > 0
    ? caseData.rarityChances
    : {
        Common: 60,
        Exclusive: 20,
        Epic: 10,
        Legendary: 8,
        Grail: 2,
      };

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
          <img src={caseData.image} alt={caseData.name} className="case-image" />
          <p className="case-description">{caseData.description}</p>
          <p className="case-price">Ціна відкриття: <strong>{caseData.price}$</strong></p>

          <div className="case-reel-wrapper">
            <div className={`case-reel ${rolling ? 'rolling' : ''}`} ref={reelRef} />
          </div>

          <button
            className="btn btn-primary open-button"
            disabled={rolling}
            onClick={openCase}
            aria-label="Відкрити кейс"
          >
            {rolling ? 'Відкриваємо...' : 'Відкрити кейс'}
          </button>

          <button
            className="btn btn-link"
            onClick={() => setShowChanceInfo(prev => !prev)}
            aria-expanded={showChanceInfo}
            aria-controls="chanceInfo"
            style={{ marginTop: '1rem' }}
          >
            {showChanceInfo ? 'Приховати шанси випадіння' : 'Показати шанси випадіння'}
          </button>

          {showChanceInfo && (
            <div id="chanceInfo" className="chance-info">
              <ul>
                {Object.entries(chances).map(([rarity, chance]) => (
                  <li key={rarity} style={{ color: rarityColors[rarity] || 'white' }}>
                    {rarity}: {chance}%
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorMsg && (
            <div className={`error-message ${showError ? 'visible' : ''}`}>
              {errorMsg}
            </div>
          )}

          {resultFigure && showResult && (
            <div className="result-popup-overlay" role="dialog" aria-modal="true" aria-labelledby="resultTitle">
              <div className="result-popup">
                <button
                  className="popup-close"
                  onClick={() => setShowResult(false)}
                  aria-label="Закрити спливаюче вікно"
                >
                  ✖
                </button>
                <h3 id="resultTitle">Випала фігурка!</h3>
                <img src={resultFigure.image} alt={resultFigure.name} />
                <p className="popup-name">
                  <strong>{resultFigure.name}</strong> —{' '}
                  <span className={`rarity ${resultFigure.rarity}`}>{resultFigure.rarity}</span>
                </p>
                <p className="popup-price"><strong>{resultFigure.price}$</strong></p>

                <div className="result-popup-buttons">
                  <button className="btn btn-primary" onClick={sellFigure}>
                    Продати
                  </button>
                  <button className="btn btn-outline" onClick={() => setShowResult(false)}>
                    Залишити
                  </button>
                </div>
              </div>
            </div>
          )}

          <audio ref={audioRef} src="/sounds/spin.mp3" preload="auto" />
          <audio ref={winAudioRef} src="/sounds/win.mp3" preload="auto" />
        </>
      ) : (
        <p>Завантаження кейсу...</p>
      )}
    </div>
  );
};

export default CasePage;