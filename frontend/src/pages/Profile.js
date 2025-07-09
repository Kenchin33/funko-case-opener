import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Повідомлення та анімація
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const errorTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFigureIndex, setSelectedFigureIndex] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    branchNumber: '',
  });

  const navigate = useNavigate();

  // Функції для показу повідомлень з анімацією
  const showErrorMessage = (msg) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorMsg(msg);
    setShowError(false);
    setTimeout(() => setShowError(true), 10);
    errorTimeoutRef.current = setTimeout(() => setShowError(false), 2010);
  };

  const showSuccessMessage = (msg) => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMsg(msg);
    setShowSuccess(false);
    setTimeout(() => setShowSuccess(true), 10);
    successTimeoutRef.current = setTimeout(() => setShowSuccess(false), 2010);
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchProfile = useCallBack(async () => {
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
  }, []);

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

      await axios.patch(
        `https://funko-case-opener.onrender.com/api/auth/${userData._id}/inventory`,
        { inventory: trimmedInventory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.patch(
        `https://funko-case-opener.onrender.com/api/auth/${userData._id}/balance`,
        { balance: newBalance },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData(prev => ({ ...prev, inventory: newInventory, balance: newBalance }));
      showSuccessMessage(`Фігурку продано за ${Math.round(sellPrice)}₴`);
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

      const newInventory = [...userData.inventory];
      newInventory.splice(selectedFigureIndex, 1);

      await axios.patch(
        `https://funko-case-opener.onrender.com/api/auth/${userData._id}/inventory`,
        { inventory: newInventory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData(prev => ({ ...prev, inventory: newInventory }));
      showSuccessMessage('Заявка на відправку отримана');
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
    <div className="profile-page" style={{ paddingTop: '60px', position: 'relative', minHeight: '100vh' }}>
      {/* Повідомлення */}
      {showError && (
        <div className="error-message" role="alert" aria-live="assertive">
          {errorMsg}
        </div>
      )}
      {showSuccess && (
        <div className="success-message" role="alert" aria-live="polite">
          {successMsg}
        </div>
      )}

      <button onClick={goHome} className="btn back-button">← На головну</button>

      <div className="profile-header" style={{ flexDirection: 'column', textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FaUserCircle size={36} />
          <h2>{userData.nickname}</h2>
        </div>
        <p className="balance-text" style={{ fontSize: '1.4rem', marginTop: '10px' }}>
          Баланс: <strong>{userData.balance}₴</strong>
        </p>
      </div>

      <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Інвентар:</h3>
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
                  <button onClick={() => openModal(index)} className="btn btn-primary btn-pickup">Продати / Забрати</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={handleLogout} className="btn btn-primary logout-button" style={{ marginTop: '40px' }}>
        Вийти з акаунту
      </button>

      {/* Модалка */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>
              Фігурка: {selectedFigure?.figure?.name || 'Невідома'}
            </h3>

            <button
              onClick={handleSell}
              className="btn-sell"
              type="button"
              aria-label={`Продати фігурку за ${Math.round(sellPrice)} гривень`}
            >
              Продати за {Math.round(sellPrice)}₴
            </button>

            <input
              name="fullName"
              placeholder="ПІБ"
              value={formData.fullName}
              onChange={handleFormChange}
              className="modal-input"
              autoComplete="name"
              type="text"
            />
            <input
              name="phone"
              placeholder="Номер телефону"
              value={formData.phone}
              onChange={handleFormChange}
              className="modal-input"
              autoComplete="tel"
              type="tel"
            />
            <input
              name="city"
              placeholder="Місто"
              value={formData.city}
              onChange={handleFormChange}
              className="modal-input"
              type="text"
            />
            <input
              name="branchNumber"
              placeholder="Номер відділення Нової Пошти"
              value={formData.branchNumber}
              onChange={handleFormChange}
              className="modal-input"
              type="text"
            />

            <button onClick={handlePickupSubmit} className="btn-pickup-submit" type="button">
              Підтвердити заявку
            </button>

            <button onClick={closeModal} className="btn-close-modal" type="button">
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;