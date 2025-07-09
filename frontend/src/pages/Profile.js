import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Стан для показу повідомлення (success або error)
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setIsError] = useState(false); // false - зелений, true - червоний

  // Стан для модалки "Дія" (продати / забрати)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFigureIndex, setSelectedFigureIndex] = useState(null);

  // Для заявки "Забрати"
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
      setErrorMessage('Помилка завантаження профілю');
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

  // Відкриття модалки дій (продати або забрати)
  const openModal = (index) => {
    setSelectedFigureIndex(index);
    setFormData({
      fullName: '',
      phone: '',
      city: '',
      branchNumber: '',
    });
    setErrorMessage(null);
    setIsError(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFigureIndex(null);
    setErrorMessage(null);
  };

  // Обробка зміни у формі заявки
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Продаж фігурки
  const handleSell = async () => {
    if (selectedFigureIndex === null || !userData) return;

    try {
      const token = localStorage.getItem('token');
      const figureEntry = userData.inventory[selectedFigureIndex];
      if (!figureEntry) return;

      const sellPrice = (figureEntry.price || 0) * 0.75 * 42;

      // Видаляємо фігурку з інвентарю
      const newInventory = [...userData.inventory];
      newInventory.splice(selectedFigureIndex, 1);

      // Мінімальні дані для відправки
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
      setErrorMessage(`Фігурку продано за ${Math.round(sellPrice)}₴`);
      setIsError(false);
      closeModal();
    } catch (error) {
      console.error('Помилка при продажі:', error);
      setErrorMessage('Помилка при продажі фігурки');
      setIsError(true);
    }
  };

  // Підтвердження заявки "Забрати"
  const handlePickupSubmit = async () => {
    if (!formData.fullName || !formData.phone || !formData.city || !formData.branchNumber) {
      setErrorMessage('Будь ласка, заповніть усі поля');
      setIsError(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (selectedFigureIndex === null) return;

      const selectedFigure = userData.inventory[selectedFigureIndex];
      if (!selectedFigure) return;

      // Поки просто видалимо фігурку як "заявку"
      const newInventory = [...userData.inventory];
      newInventory.splice(selectedFigureIndex, 1);

      await axios.patch(`https://funko-case-opener.onrender.com/api/auth/${userData._id}/inventory`,
        { inventory: newInventory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData(prev => ({ ...prev, inventory: newInventory }));
      setErrorMessage('Заявка на відправку отримана');
      setIsError(false);
      closeModal();
    } catch (error) {
      console.error('Помилка при оформленні заявки:', error);
      setErrorMessage('Помилка при оформленні заявки');
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

      {/* Повідомлення про помилку або успіх */}
      {errorMessage && (
        <div
          style={{
            textAlign: 'center',
            color: isError ? 'red' : 'green',
            marginBottom: '20px',
            fontWeight: 'bold',
          }}
        >
          {errorMessage}
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

      {/* Модалка з кнопками Продати та Забрати */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Фігурка: {selectedFigure?.figure?.name || 'Невідома'}</h3>

            {/* Якщо вибрана фігурка, показуємо кнопки */}
            <div style={{ marginBottom: '20px' }}>
              <button onClick={handleSell} className="btn btn-sell" style={{ marginRight: '10px' }}>
                Продати за {Math.round(sellPrice)}₴
              </button>
            </div>

            {/* Форма заявки "Забрати" */}
            <div>
              <input
                type="text"
                name="fullName"
                placeholder="ПІБ"
                value={formData.fullName}
                onChange={handleFormChange}
                className="modal-input"
              />
              <input
                type="text"
                name="phone"
                placeholder="Номер телефону"
                value={formData.phone}
                onChange={handleFormChange}
                className="modal-input"
              />
              <input
                type="text"
                name="city"
                placeholder="Місто"
                value={formData.city}
                onChange={handleFormChange}
                className="modal-input"
              />
              <input
                type="text"
                name="branchNumber"
                placeholder="№ відділення"
                value={formData.branchNumber}
                onChange={handleFormChange}
                className="modal-input"
              />
              <button onClick={handlePickupSubmit} className="btn btn-pickup-submit" style={{ marginTop: '10px' }}>
                Підтвердити заявку
              </button>
            </div>

            <button onClick={closeModal} className="btn btn-close-modal" style={{ marginTop: '15px' }}>
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;