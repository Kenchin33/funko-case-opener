import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Повідомлення зверху
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false); // false - зелений, true - червоний

  // Модалка дій (продати / забрати)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFigureIndex, setSelectedFigureIndex] = useState(null);

  // Дані форми заявки
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    branchNumber: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://funko-case-opener.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(res.data);
    } catch (err) {
      console.error('Помилка завантаження профілю:', err);
      setMessage('Помилка завантаження профілю');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const goHome = () => {
    navigate('/');
  };

  const openModal = (index) => {
    setSelectedFigureIndex(index);
    setFormData({ fullName: '', phone: '', city: '', branchNumber: '' });
    setMessage(null);
    setIsError(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFigureIndex(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSell = async () => {
    if (selectedFigureIndex === null || !userData) return;

    try {
      const token = localStorage.getItem('token');
      const figureEntry = userData.inventory[selectedFigureIndex];
      if (!figureEntry) return;

      const sellPrice = (figureEntry.price || 0) * 0.75 * 42;

      const newInventory = [...userData.inventory];
      newInventory.splice(selectedFigureIndex, 1);

      const trimmedInventory = newInventory.map(item => ({
        _id: item._id,
        figure: item.figure._id,
        caseName: item.caseName,
        caseId: item.caseId,
        price: item.price,
        date: item.date,
      }));

      const newBalance = userData.balance + sellPrice;

      await axios.patch(`https://funko-case-opener.onrender.com/api/auth/${userData._id}/inventory`, 
        { inventory: trimmedInventory }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.patch(`https://funko-case-opener.onrender.com/api/auth/${userData._id}/balance`, 
        { balance: newBalance },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData(prev => ({ ...prev, inventory: newInventory, balance: newBalance }));
      setMessage(`Фігурку продано за ${Math.round(sellPrice)}₴`);
      setIsError(false);
      closeModal();
    } catch (error) {
      console.error('Помилка при продажі:', error);
      setMessage('Помилка при продажі фігурки');
      setIsError(true);
    }
  };

  const handlePickupSubmit = async () => {
    if (!formData.fullName || !formData.phone || !formData.city || !formData.branchNumber) {
      setMessage('Будь ласка, заповніть усі поля');
      setIsError(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (selectedFigureIndex === null) return;

      const selectedFigure = userData.inventory[selectedFigureIndex];
      if (!selectedFigure) return;

      const newInventory = [...userData.inventory];
      newInventory.splice(selectedFigureIndex, 1);

      await axios.patch(`https://funko-case-opener.onrender.com/api/auth/${userData._id}/inventory`,
        { inventory: newInventory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData(prev => ({ ...prev, inventory: newInventory }));
      setMessage('Заявка на відправку отримана');
      setIsError(false);
      closeModal();
    } catch (error) {
      console.error('Помилка при оформленні заявки:', error);
      setMessage('Помилка при оформленні заявки');
      setIsError(true);
    }
  };

  if (loading) return <div className="profile-page">Завантаження...</div>;
  if (!userData) return <div className="profile-page">Помилка завантаження даних</div>;

  const selectedFigure = selectedFigureIndex !== null ? userData.inventory[selectedFigureIndex] : null;
  const sellPrice = selectedFigure ? (selectedFigure.price || 0) * 0.75 * 42 : 0;

  return (
    <div className="profile-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <button onClick={goHome} className="btn back-button">← На головну</button>

      <div className="profile-header" style={{ flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FaUserCircle size={36} />
          <h2>{userData.nickname}</h2>
        </div>
        <p className="balance-text" style={{ fontSize: '1.4rem', marginTop: '10px' }}>
          Баланс: <strong>{userData.balance}₴</strong>
        </p>
      </div>

      {/* Повідомлення зверху */}
      {message && (
        <div className={isError ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <div style={{ flexGrow: 1 }}>
        <h3 style={{ textAlign: 'center', marginTop: '40px' }}>Інвентар:</h3>

        {userData.inventory.length === 0 ? (
          <p style={{ textAlign: 'center' }}>Інвентар порожній.</p>
        ) : (
          <div className="won-figures-grid">
            {userData.inventory.map((entry, index) => {
              const figure = entry.figure || {};
              return (
                <div key={entry._id || index} className="figure-card">
                  <img src={figure.image || '/unknown.png'} alt={figure.name || 'Невідома фігурка'} />
                  <p>{figure.name || 'Невідома фігурка'}</p>
                  <p className={`rarity ${figure.rarity || ''}`}>{figure.rarity || ''}</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>{entry.price ?? '–'}₴</p>
                  <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    {entry.caseId ? (
                      <Link to={`/case/${entry.caseId}`} className="case-link">{entry.caseName || 'Невідомий кейс'}</Link>
                    ) : (
                      entry.caseName || 'Невідомий кейс'
                    )}
                  </p>
                  <div className="figure-buttons">
                    <button onClick={() => openModal(index)} className="btn btn-primary">
                      Продати / Забрати
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button onClick={handleLogout} className="btn btn-primary logout-button" style={{ marginTop: 'auto' }}>
        Вийти з акаунту
      </button>

      {/* Модалка */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Фігурка: {selectedFigure?.figure?.name || 'Невідома'}</h3>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button
                onClick={handleSell}
                className="btn btn-sell"
                style={{ marginRight: '10px', backgroundColor: 'orange', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'red')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'orange')}
              >
                Продати за {Math.round(sellPrice)}₴
              </button>
            </div>

            <div>
              {['fullName', 'phone', 'city', 'branchNumber'].map(field => (
                <input
                  key={field}
                  type="text"
                  name={field}
                  placeholder={{
                    fullName: 'ПІБ',
                    phone: 'Номер телефону',
                    city: 'Місто',
                    branchNumber: '№ відділення',
                  }[field]}
                  value={formData[field]}
                  onChange={handleFormChange}
                  className="modal-input"
                  style={{
                    backgroundColor: 'black',
                    border: '2px solid orange',
                    color: 'white',
                    padding: '8px',
                    marginBottom: '10px',
                    borderRadius: '5px',
                    width: '100%',
                    boxSizing: 'border-box',
                    fontSize: '1rem',
                  }}
                />
              ))}

              <button
                onClick={handlePickupSubmit}
                className="btn btn-pickup-submit"
                style={{
                  marginTop: '10px',
                  backgroundColor: 'orange',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  width: '100%',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'red')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'orange')}
              >
                Підтвердити заявку
              </button>
            </div>

            <button
              onClick={closeModal}
              className="btn btn-close-modal"
              style={{ marginTop: '15px', padding: '6px 12px', cursor: 'pointer' }}
            >
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;