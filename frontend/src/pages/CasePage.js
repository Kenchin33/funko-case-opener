import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './style.css';

const CasePage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [resultFigure, setResultFigure] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const reelRef = useRef(null);
  const navigate = useNavigate();

  const audioRef = useRef(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/cases/${id}`)
      .then(res => res.json())
      .then(data => setCaseData(data))
      .catch(console.error);
  }, [id]);

  const openCase = async () => {
    if (!caseData || caseData.figures.length === 0) return;

    setRolling(true);
    setResultFigure(null);
    setShowResult(false);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    const res = await fetch(`http://localhost:5000/api/cases/${id}/open`, {
      method: 'POST',
    });
    const data = await res.json();

    const reel = reelRef.current;
    let position = 0;
    const initialSpeed = 40;
    const slowDownRate = 0.98;
    let speed = initialSpeed;
    let startTime = null;
    const fullSpeedDuration = 4000;

    const animate = (timestamp) => {
      if (!reel) return;

      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < fullSpeedDuration) {
        position -= initialSpeed;
        reel.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate);
      } else {
        speed *= slowDownRate;
        position -= speed;
        reel.style.transform = `translateX(${position}px)`;
        if (speed > 0.5) {
          requestAnimationFrame(animate);
        } else {
          setResultFigure(data);
          setRolling(false);
          setShowResult(true);
  
          if (audioRef.current) {
            audioRef.current.pause();
        }
      }
    }
  };

  requestAnimationFrame(animate);
};

  return (
    <div className="case-page">
      <button className="btn btn-outline back-button" onClick={() => navigate('/')}>
  ← На головну
</button>

      {caseData ? (
        <>
          <h2 className="case-title">{caseData.name}</h2>
          <img src={caseData.image} alt={caseData.name} className="case-cover" />
          <button onClick={openCase} disabled={rolling} className="btn btn-primary open-btn">
            {rolling ? 'Відкривається...' : 'Відкрити кейс'}
          </button>

          <div className="reel-arrow"/>
          <div className="reel-container">
            <div className={`reel ${rolling ? 'rolling' : ''}`} ref={reelRef}>
              {[...Array(100)].flatMap(() =>
                caseData.figures.map((fig, i) => (
                  <img key={i + Math.random()} src={fig.image} alt={fig.name} className="reel-item" />
                ))
              )}
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
                  <strong>{resultFigure.name} — </strong>
                  <span className={`rarity ${resultFigure.rarity}`}>{resultFigure.rarity}</span>
                </p>
                <p className="popup-price">{resultFigure.price}$</p>
              </div>
            </div>
          )}

          <audio ref={audioRef} src="/sounds/go-new-gambling.mp3" />

        </>
      ) : (
        <p>Завантаження...</p>
      )}
    </div>
  );
};

export default CasePage;
