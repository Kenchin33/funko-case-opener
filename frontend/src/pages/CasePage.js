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
    Signed: 'pink',
  };

  // Функція для показу повідомлення з анімацією і автоматичним приховуванням через 2 секунди
  const showErrorMessage = (msg) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    setErrorMsg(msg);
    setShowError(false); // скидаємо, щоб перезапустити анімацію
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
    // Викидаємо помилку, якщо є
    //setErrorMsg('');
    //setShowError(false);
    if (showError) setShowError(false); // сховаємо повідомлення, якщо було

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
      })

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
      console.log('Повний список фігурок у стрічці:', finalReel);

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
          <div className="reel-container">
            <div className="reel" ref={reelRef}></div>
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
                <button 
                  className="popup-close" 
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const responce = await fetch('https://funko-case-opener.onrender.com/api/cases/inventory/add', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer ' + token,
                        },
                        body: JSON.stringify({
                          figureId: resultFigure._id,
                          caseId: id,
                          caseName: caseData.name,
                          price: resultFigure.price,
                        }),
                      });

                      if (!responce.ok) {
                        const err = await responce.json();
                        throw new Error(err.message || 'Помилка збереження фігурки у інвентарі');
                      }

                      setShowResult(false);
                      showErrorMessage('Фігурка додана у інвентар');
                    } catch (err) {
                      console.error('Помилка при додавані ✖: ', err);
                      showErrorMessage(err.message);
                    }
                  }}>✖</button>
                <h3>Випала фігурка!</h3>
                <img src={resultFigure.image} alt={resultFigure.name} />
                <p className="popup-name">
                  <strong>{resultFigure.name}</strong> —{' '}
                  <span className={`rarity ${resultFigure.rarity}`}>{resultFigure.rarity}</span>
                </p>
                <p className="popup-price"><strong>{resultFigure.price}$</strong></p>

                <div className="popup-buttons">
                  <button className="btn btn-outline open-btn" onClick={async () => {
                    console.log('Натиснули кнопку продати');
                    const salePrice = Math.round(resultFigure.price * 0.75 * 42);
                    const token = localStorage.getItem('token');
                    console.log('token:', token);
                    try {
                      const res = await fetch('https://funko-case-opener.onrender.com/api/auth/me', {
                        headers: { 'Authorization': 'Bearer ' + token},
                      });
                      const user = await res.json();
                      const currentBalance = Number(user.balance);
                      if(isNaN(currentBalance)) {
                        throw new Error('Баланс користувача некоректний');
                      }
                      const newBalance = currentBalance + salePrice;
                      await fetch(`https://funko-case-opener.onrender.com/api/auth/${user._id}/balance`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer ' + token,
                        },
                        body: JSON.stringify({balance: newBalance}),
                      });
                      if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.message || 'Не вдалося оновити баланс');
                      }

                      setBalance(newBalance);
                      console.log('Баланс оновлено на:', newBalance);
                      setShowResult(false);
                      showErrorMessage(`Фігурку продано за ${salePrice} грн`);
                    } catch (err) {
                      console.error('Помилка при продажу фігурки:', err);
                      showErrorMessage('Помилка під час продажу фігурки');
                    }
                  }}>Продати за {Math.round(resultFigure.price * 0.75 * 42)} грн</button>
                  <button className="btn btn-outline open-btn" onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const responce = await fetch('https://funko-case-opener.onrender.com/api/cases/inventory/add', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer ' + token,
                        },
                        body: JSON.stringify({
                          figureId: resultFigure._id,
                          caseId: id,
                          caseName: caseData.name,
                          price: resultFigure.price,
                        }),
                      });

                      if(!responce.ok) {
                        const err = await responce.json();
                        throw new Error(err.message || 'Помилка збереження фігурки у інвентарі');
                      }

                    setShowResult(false); 
                    showErrorMessage('Фігурка додана у інвентар')
                  } catch (err) {
                    showErrorMessage(err.message);
                  }}}
                  > Залишити </button>
                </div>
              </div>
            </div>
          )}

          <audio ref={audioRef} src="/sounds/go-new-gambling.mp3" />
          <audio ref={winAudioRef} src="/sounds/win-sound.mp3" />

          {showError && (
            <div
              className={errorMsg.includes('продано') || errorMsg.includes('додана') ? 'success-message' : 'error-message'}
              role="alert"
              aria-live="assertive"
            > {errorMsg}</div>
          )}
        </>
      ) : (
        <p>Завантаження...</p>
      )}
    </div>
  );
};

export default CasePage;