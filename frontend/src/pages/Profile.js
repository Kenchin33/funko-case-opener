import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Стан для модалки "Забрати"
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState(null);

  // Поля форми "Забрати"
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

  // Функція для продажу фігурки
  const handleSell = async (entryIndex) => {
    if (!userData) return;
    try {
      const token = localStorage.getItem('token');

      // Визначаємо фігурку та ціну
      const figureEntry = userData.inventory[entryIndex];
      if (!figureEntry) return;

      // Видаляємо фігурку з інвентарю (треба API - будемо робити PATCH з новим інвентарем)
      const newInventory = [...userData.inventory];
      newInventory.splice(entryIndex, 1);

      // Оновлюємо баланс
      const newBalance = userData.balance + (figureEntry.price || 0);

      // Оновлення інвентарю і балансу на сервері
      await axios.patch(`https://funko-case-opener.onrender.com/api/users/${userData._id}/inventory`, 
        { inventory: newInventory }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.patch(`https://funko-case-opener.onrender.com/api/auth/${userData._id}/balance`, 
        { balance: newBalance },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Оновлюємо локальний стан
      setUserData(prev => ({ ...prev, inventory: newInventory, balance: newBalance }));

      alert(`Фігурку продано за ${figureEntry.price}₴`);
    } catch (error) {
      console.error('Помилка при продажі:', error);
      alert('Помилка при продажі фігурки');
    }
  };

  // Відкриваємо модалку "Забрати"
  const openPickupModal = (entryIndex) => {
    setSelectedFigure(userData.inventory[entryIndex]);
    setFormData({
      fullName: '',
      phone: '',
      city: '',
      branchNumber: '',
    });
    setModalOpen(true);
  };

  // Закриваємо модалку
  const closeModal = () => {
    setModalOpen(false);
    setSelectedFigure(null);
  };

  // Обробка введення у форму
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Підтвердження "Забрати"
  const handlePickupSubmit = async () => {
    // Валідація (можна розширити)
    if (!formData.fullName || !formData.phone || !formData.city || !formData.branchNumber) {
      alert('Будь ласка, заповніть усі поля');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Логіка заявки на відправку:  
      // Тут можна відправити заявку на бекенд (наприклад, в окремий ендпоінт для заявок)
      // Поки що просто видалимо фігурку з інвентарю

      const idx = userData.inventory.findIndex(i => i._id === selectedFigure._id);
      if (idx === -1) return;

      const newInventory = [...userData.inventory];
      newInventory.splice(idx, 1);

      // Оновлюємо інвентар
      await axios.patch(`https://funko-case-opener.onrender.com/api/users/${userData._id}/inventory`,
        { inventory: newInventory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData(prev => ({ ...prev, inventory: newInventory }));
      alert('Заявка на відправку отримана');

      closeModal();
    } catch (error) {
      console.error('Помилка при оформленні заявки:', error);
      alert('Помилка при оформленні заявки');
    }
  };

  if (loading) return <div className="profile-page">Завантаження...</div>;
  if (!userData) return <div className="profile-page">Помилка завантаження даних</div>;

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
                    <button onClick={() => handleSell(index)} className="btn btn-sell">Продати за {entry.price}₴</button>
                    <button onClick={() => openPickupModal(index)} className="btn btn-pickup">Забрати</button>
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

      {/* Модалка Забрати */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Забрати фігурку: {selectedFigure?.figure?.name || 'Невідома'}</h3>
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
            <button onClick={handlePickupSubmit} className="btn btn-pickup-submit">Забрати</button>
            <button onClick={closeModal} className="btn btn-close-modal">Закрити</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;