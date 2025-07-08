import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://funko-case-opener.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data);
      } catch (err) {
        console.error('Помилка завантаження профілю:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const goHome = () => {
    navigate('/');
  };

  if (!userData) return <div className="profile-page">Завантаження...</div>;

  return (
    <div className="profile-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Кнопка на головну */}
      <button onClick={goHome} className="btn back-button">← На головну</button>

      {/* Хедер профілю з іконкою */}
      <div className="profile-header" style={{ flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FaUserCircle size={36} />
          <h2>{userData.nickname}</h2>
        </div>
        <p className="balance-text" style={{ fontSize: '1.4rem', marginTop: '10px' }}>
          Баланс: <strong>{userData.balance}₴</strong>
        </p>
      </div>

      {/* Історія відкритих фігурок */}
      <div style={{ flexGrow: 1 }}>
        <h3 style={{ textAlign: 'center', marginTop: '40px' }}>Історія відкритих фігурок:</h3>

        {userData.openedFigures.length === 0 ? (
          <p style={{ textAlign: 'center' }}>Фігурки ще не випадали.</p>
        ) : (
          <div className="won-figures-grid">
            {userData.openedFigures.map((entry, index) => {
              const figure = entry.figure || {};
              return (
                <div key={index} className="figure-card">
                  <img src={figure.image || '/unknown.png'} alt={figure.name || 'Невідома фігурка'} />
                  <p>{figure.name || 'Невідома фігурка'}</p>
                  <p className={`rarity ${figure.rarity || ''}`}>{figure.rarity || ''}</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>{entry.price ?? '–'}$</p>
                  <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    {entry.caseId ? (
                      <Link to={`/case/${entry.caseId}`} className="case-link">{entry.caseName || 'Невідомий кейс'}</Link>
                    ) : (
                      entry.caseName || 'Невідомий кейс'
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Кнопка виходу внизу */}
      <button onClick={handleLogout} className="btn btn-primary logout-button" style={{ marginTop: 'auto' }}>
        Вийти з акаунту
      </button>
    </div>
  );
};

export default ProfilePage;