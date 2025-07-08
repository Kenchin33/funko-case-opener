import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './style.css';

const Home = () => {
  const [cases, setCases] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/cases')
      .then(res => res.json())
      .then(data => setCases(data))
      .catch(console.error);

    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')}>
          <span role="img" aria-label="casino" className="casino-logo">🎰</span>
          <h1>Фанко Казіно</h1>
        </div>
        <div className="user-menu">
          {isLoggedIn ? (
            <Link to="/profile" className="profile-icon" title="Профіль">👤</Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-outline">Реєстрація</Link>
              <Link to="/login" className="btn btn-primary">Авторизація</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <h2 className="cases-title">Кейси</h2>
        <div className="cases-list">
          {cases.length === 0 ? (
            <p>Кейси не знайдені</p>
          ) : (
            cases.map(c => (
              <Link to={`/case/${c._id}`} key={c._id} className="case-card">
                <img
                  src={c.image || 'https://via.placeholder.com/180x180?text=No+Image'}
                  alt={c.name}
                  className="case-image"
                />
                <div className="case-info">
                  <h3>{c.name}</h3>
                  <p>{c.price} UAH</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
