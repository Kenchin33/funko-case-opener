import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const errorTimeoutRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFigureIndex, setSelectedFigureIndex] = useState(null);

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

  const showErrorMessage = (msg, isError = true) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorMsg(msg);
    setShowError(false);
    setTimeout(() => setShowError(true), 10);
    errorTimeoutRef.current = setTimeout(() => {
      setShowError(false);
    }, 2010);
  };

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
      showErrorMessage('Помилка завантаження профілю');
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
      showErrorMessage(`Фігурку продано за ${Math.round(sellPrice)}₴`, false);
      closeModal();
    } catch (error) {
      console.error('Помилка при продажі:', error);
      showErrorMessage('Помилка при продажі фігурки');
    }
  };

  const handlePickupSubmit = async () => {
    if (!formData.fullName || !formData.phone || !formData.city || !formData.branchNumber) {
      showErrorMessage('Будь ласка, заповніть усі поля');
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
      showErrorMessage('Заявка на відправку отримана', false);
      closeModal();
    } catch (error) {
      console.error('Помилка при оформленні заявки:', error);
      showErrorMessage('Помилка при оформленні заявки');
    }
  };

  if (loading) return <div className="profile-page">Завантаження...</div>;
  if (!userData) return <div className="profile-page">Помилка завантаження даних</div>;

  const selectedFigure = selectedFigureIndex !== null ? userData.inventory[selectedFigureIndex] : null;
  const sellPrice = selectedFigure ? (selectedFigure.price || 0) * 0.75 * 42 : 0;

  return (
    <div className="profile-page">
      {showError && (
        <div className={errorMsg.includes('помилка') || errorMsg.includes('Помилка') ? 'error-message' : 'success-message'}>
          {errorMsg}
        </div>
      )}

      <button onClick={goHome} className="btn back-button">← На головну</button>

      <div className="profile-header">
        <FaUserCircle size={36} />
        <h2>{userData.nickname}</h2>
      </div>

      <p className="balance-text">
        Баланс: <strong>{userData.balance}₴</strong>
      </p>

      <h3 style={{ textAlign: 'center' }}>Інвентар:</h3>

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
                <p style={{ fontSize: '0.85rem' }}>{entry.price ?? '–'}₴</p>
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

      <button onClick={handleLogout} className="btn btn-primary logout-button">
        Вийти з акаунту
      </button>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Фігурка: {selectedFigure?.figure?.name || 'Невідома'}</h3>

            <button onClick={handleSell} className="btn-sell">
              Продати за {Math.round(sellPrice)}₴
            </button>

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
              />
            ))}

            <button onClick={handlePickupSubmit} className="btn-pickup-submit">
              Підтвердити заявку
            </button>

            <button onClick={closeModal} className="btn-close-modal">
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;