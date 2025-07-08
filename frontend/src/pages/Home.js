import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const Home = () => {
  const [cases, setCases] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/cases')
      .then(res => res.json())
      .then(data => setCases(data))
      .catch(console.error);

    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);

      fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error('Не авторизований');
          return res.json();
        })
        .then(data => {
          setBalance(data.balance ?? 0);
        })
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

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')}>
          <h1>Фанко Казіно</h1>
        </div>
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