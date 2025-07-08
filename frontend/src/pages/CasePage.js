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

    const res = await fetch(`http://localhost:5000/api/cases/${id}/open`, {
      method: 'POST',
    });
    const data = await res.json();

    setTimeout(() => {
      setResultFigure(data);
      setRolling(false);
      setShowResult(true);
    }, 3500);
  };

  return (
    <div className="case-page">
      <button className="back-button" onClick={() => navigate('/')}>← На головну</button>

      {caseData ? (
        <>
          <h2 className="case-title">{caseData.name}</h2>
          <img src={caseData.image} alt={caseData.name} className="case-cover" />
          <button onClick={openCase} disabled={rolling} className="btn btn-primary open-btn">
            {rolling ? 'Відкривається...' : 'Відкрити кейс'}
          </button>

          <div className="reel-container">
            <div className={`reel ${rolling ? 'rolling' : ''}`} ref={reelRef}>
              {[...Array(20)].flatMap(() =>
                caseData.figures.map((fig, i) => (
                  <img key={i + Math.random()} src={fig.image} alt={fig.name} className="reel-item" />
                ))
              )}
            </div>
          </div>

          {!rolling && !resultFigure && (
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
                <p><strong>{resultFigure.name}</strong> — {resultFigure.rarity}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>Завантаження...</p>
      )}
    </div>
  );
};

export default CasePage;
