import React from 'react';
import { useNavigate } from 'react-router-dom';

const CrashGame = () => {
  const navigate = useNavigate();

  return (
    <div className="case-page">
      <button className="back-button" onClick={() => navigate('/')}>← Назад на Головну</button>
      <h2 className="case-title">Гра "Літачок"</h2>
      <p className="crash-description">
        Постав одну зі своїх фігурок і спробуй забрати виграш до того, як гра закінчиться!
      </p>

      <div className="crash-placeholder">
        Гра скоро почнеться
      </div>
    </div>
  );
};

export default CrashGame;
