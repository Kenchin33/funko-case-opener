import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './style.css';

const EXCLUDED_ID = "686f9c79b62dd7c2154d21e9";
const ITEMS_PER_PAGE = 18;

const Exchange = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [allFigures, setAllFigures] = useState([]);
  const [sortOrderLeft, setSortOrderLeft] = useState(null);
  const [sortOrderRight, setSortOrderRight] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const errorTimeoutRef = useRef(null);

  const [selectedInventoryIds, setSelectedInventoryIds] = useState(new Set());
  const [selectedFiguresRight, setSelectedFiguresRight] = useState(new Set());

  const [inventoryPage, setInventoryPage] = useState(1);
  const [figuresPage, setFiguresPage] = useState(1);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

const showErrorMessage = (msg) => {
  if (errorTimeoutRef.current) {
    clearTimeout(errorTimeoutRef.current);
  }
  setErrorMsg(msg);
  setShowError(false);
  setTimeout(() => setShowError(true), 10);
  errorTimeoutRef.current = setTimeout(() => setShowError(false), 2010);
};

const getFigureById = (id) => allFigures.find(fig => fig._id === id) || {};


  useEffect(() => {
    if (!token) return;

    fetch('https://funko-case-opener.onrender.com/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(res => {
        if (!res.ok) throw new Error('Не авторизований');
        return res.json();
      })
      .then(data => {
        setIsLoggedIn(true);
        setBalance(data.balance ?? 0);
        setInventory(data.inventory ?? []);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setBalance(null);
        setInventory([]);
        localStorage.removeItem('token');
      });
  }, [token]);

  useEffect(() => {
    fetch('https://funko-case-opener.onrender.com/api/figures')
      .then(res => res.json())
      .then(data => setAllFigures(data))
      .catch(err => console.error('Помилка завантаження фігурок:', err));
  }, []);

  useEffect(() => setInventoryPage(1), [sortOrderLeft]);
  useEffect(() => setFiguresPage(1), [sortOrderRight, selectedInventoryIds]);

  const getSortedInventory = () => {
    if (!sortOrderLeft) return inventory;
    return [...inventory].sort((a, b) => {
      const figA = getFigureById(a.figure);
      const figB = getFigureById(b.figure);
      const priceA = figA.price ?? 0;
      const priceB = figB.price ?? 0;
      return sortOrderLeft === 'asc' ? priceA - priceB : priceB - priceA;
    });
  };
  

  const getSortedAllFigures = () => {
    const filtered = allFigures.filter(fig =>
      fig._id !== EXCLUDED_ID &&
      selectedInventoryIds.size > 0 &&
      fig.price <= selectedSumInventory
    );
    if (!sortOrderRight) return filtered;
    return [...filtered].sort((a, b) =>
      sortOrderRight === 'asc' ? a.price - b.price : b.price - a.price
    );
  };

  const getPagedInventory = () => {
    const sorted = getSortedInventory();
    const start = (inventoryPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  };

  const getPagedAllFigures = () => {
    const sorted = getSortedAllFigures();
    const start = (figuresPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  };

  const toggleSelectInventory = (id) => {
    setSelectedInventoryIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };

  const toggleSelectFigureRight = (id) => {
    const figure = allFigures.find(f => f._id === id);
    if (!figure) return;
  
    const isAlreadySelected = selectedFiguresRight.has(id);
    const newSum = isAlreadySelected
      ? selectedSumRight - figure.price
      : selectedSumRight + figure.price;
  
    if (newSum > selectedSumInventory) {
      showErrorMessage('Сума фігурок перевищує обрану з інвентаря.');
      return;
    }
  
    setSelectedFiguresRight(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };  

  const selectedSumInventory = [...selectedInventoryIds].reduce((sum, id) => {
    const item = inventory.find(i => i._id === id);
    return sum + (item?.price ?? 0);
  }, 0);

  const selectedSumRight = [...selectedFiguresRight].reduce((sum, id) => {
    const item = allFigures.find(f => f._id === id);
    return sum + (item?.price ?? 0);
  }, 0);


  const handleExchange = async () => {
    if (!token || !isLoggedIn) return;
  
    try {
      // 1. Отримати нові фігурки для додавання
      const newFigures = allFigures.filter(f => selectedFiguresRight.has(f._id));
  
      // 2. Створити нові об'єкти інвентаря (аналогічні до тих, що зберігаються у User)
      const newInventoryEntries = newFigures.map(fig => ({
        figure: fig._id,
        caseName: 'Обмін',
        caseId: null,
        price: fig.price,
        date: new Date(),
      }));
  
      // 3. Створити новий масив інвентаря без обраних
      const updatedInventory = inventory.filter(item => !selectedInventoryIds.has(item._id));
  
      // 4. Додати нові фігурки до інвентаря
      const finalInventory = [...updatedInventory, ...newInventoryEntries];
  
      // 5. Отримати userId з токена
      function parseJwt(token) {
        try {
          return JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join('')));
        } catch (e) {
          return null;
        }
      }
      const decoded = parseJwt(token);
      const userId = decoded?.userId;

      if (!userId) {
        console.error("User ID не знайдено у токені");
        showErrorMessage("Помилка: не вдалося отримати ID користувача");
        return;
      }
  
      console.log("Відправляю inventory:", finalInventory);
      // 6. Запит на оновлення інвентаря
      const res = await fetch(`https://funko-case-opener.onrender.com/api/auth/${userId}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ inventory: finalInventory }),
      });

      console.log("PATCH статус:", res.status);
      const text = await res.text();
      console.log("PATCH відповідь:", text);
  
      if (!res.ok) throw new Error('Помилка під час обміну');
  
      const data = await res.json();
      setInventory(data.user.inventory);
      setSelectedInventoryIds(new Set());
      setSelectedFiguresRight(new Set());
      setFiguresPage(1);
      setInventoryPage(1);
      showErrorMessage('Успішний обмін 🎉');
    } catch (err) {
      console.error(err);
      showErrorMessage('Не вдалося здійснити обмін.');
    }
  };
  


  return (
    <div className="home-container">
      <header className="header">
        <button className="btn btn-outline back-button" onClick={() => navigate('/')}>← На головну</button>
        <div className="logo" onClick={() => navigate('/')}>
          <h1 style={{ textAlign: 'center', color: 'white'}}>Обмін</h1>
        </div>
        <div className="user-menu">
          {isLoggedIn ? (
            <Link to="/profile" className="profile-icon" title="Профіль"
              style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', color: 'white', fontWeight: '600' }}>
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
      {selectedSumInventory > 0 && selectedSumInventory === selectedSumRight && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <button className="btn btn-primary" onClick={handleExchange}>Обміняти фігурки</button>
            </div>
        )}
        <div className="exchange-area">
          {/* Інвентар */}
          <div className="inventory-panel-exchange">
            <div className="inventory-header" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10
            }}>
              <h3 style={{ margin: 0 }}>Ваш інвентар</h3>
              <div style={{
                flex: '1 1 auto', textAlign: 'center', fontWeight: '600',
                color: 'orange', fontSize: '1.2rem', userSelect: 'none', minWidth: 140,
              }}>
                {selectedInventoryIds.size === 1 && `Ціна: ${selectedSumInventory}$`}
                {selectedInventoryIds.size > 1 && `Загальна сума: ${selectedSumInventory}$`}
              </div>
              <button className="btn btn-sort" onClick={() =>
                setSortOrderLeft(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null)
              }>
                {sortOrderLeft === 'asc' ? 'Сортувати за ↓' :
                  sortOrderLeft === 'desc' ? 'Скасувати сортування' : 'Сортувати за ↑'}
              </button>
            </div>

            <div className="inventory-grid">
              {inventory.length === 0 ? (
                <div className="figure-card placeholder-card">
                  <p style={{ textAlign: 'center', padding: '40px 10px' }}>У вас ще немає фігурок</p>
                </div>
              ) : (
                getPagedInventory().map(entry => {
                  const figure = getFigureById(entry.figure);
                  const isSelected = selectedInventoryIds.has(entry._id);
                  return (
                    <div key={entry._id} className={`figure-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSelectInventory(entry._id)} style={{ cursor: 'pointer' }}>
                      <img src={figure.image} alt={figure.name} />
                      <p>{figure.name}</p>
                      <p className={`rarity ${figure.rarity}`}>{figure.rarity}</p>
                      <p>{entry.price}$</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Пагінація інвентарю */}
            {Math.ceil(getSortedInventory().length / ITEMS_PER_PAGE) > 1 && (
              <div className="pagination-controls">
                <button className="btn" disabled={inventoryPage === 1}
                  onClick={() => setInventoryPage(p => p - 1)}>← Назад</button>
                <span style={{ color: 'white' }}>
                  Сторінка {inventoryPage} з {Math.ceil(getSortedInventory().length / ITEMS_PER_PAGE)}
                </span>
                <button className="btn" disabled={inventoryPage >= Math.ceil(getSortedInventory().length / ITEMS_PER_PAGE)}
                  onClick={() => setInventoryPage(p => p + 1)}>Далі →</button>
              </div>
            )}
          </div>

          {/* Всі фігурки */}
          <div className="exchange-panel">
            <div className="inventory-header" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10
            }}>
              <h3 style={{ margin: 0 }}>Усі фігурки</h3>
              <div style={{
                flex: '1 1 auto', textAlign: 'center', fontWeight: '600',
                color: 'orange', fontSize: '1.2rem', userSelect: 'none', minWidth: 140,
              }}>
                {selectedFiguresRight.size === 1 && `Ціна: ${selectedSumRight}$`}
                {selectedFiguresRight.size > 1 && `Загальна сума: ${selectedSumRight}$`}
              </div>
              <button className="btn btn-sort" onClick={() =>
                setSortOrderRight(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null)
              }>
                {sortOrderRight === 'asc' ? 'Сортувати за ↓' :
                  sortOrderRight === 'desc' ? 'Скасувати сортування' : 'Сортувати за ↑'}
              </button>
            </div>

            <div className="inventory-grid">
              {selectedInventoryIds.size === 0 ? (
                <div className="figure-card placeholder-card">
                  <p style={{ textAlign: 'center', padding: '40px 10px' }}>Спочатку виберіть фігурку(и) з інвентаря</p>
                </div>
              ) : getSortedAllFigures().length === 0 ? (
                <div className="figure-card placeholder-card">
                  <p style={{ textAlign: 'center', padding: '40px 10px' }}>Немає фігурок дешевших або рівних за сумою</p>
                </div>
              ) : (
                getPagedAllFigures().map(figure => {
                  const isSelected = selectedFiguresRight.has(figure._id);
                  return (
                    <div key={figure._id} className={`figure-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSelectFigureRight(figure._id)} style={{ cursor: 'pointer' }}>
                      <img src={figure.image} alt={figure.name} />
                      <p>{figure.name}</p>
                      <p className={`rarity ${figure.rarity}`}>{figure.rarity}</p>
                      <p>{figure.price}$</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Пагінація правого блоку */}
            {selectedInventoryIds.size > 0 && getSortedAllFigures().length > ITEMS_PER_PAGE && (
              <div className="pagination-controls">
                <button className="btn" disabled={figuresPage === 1}
                  onClick={() => setFiguresPage(p => p - 1)}>← Назад</button>
                <span style={{ color: 'white' }}>
                  Сторінка {figuresPage} з {Math.ceil(getSortedAllFigures().length / ITEMS_PER_PAGE)}
                </span>
                <button className="btn"
                  disabled={figuresPage >= Math.ceil(getSortedAllFigures().length / ITEMS_PER_PAGE)}
                  onClick={() => setFiguresPage(p => p + 1)}>Далі →</button>
              </div>
            )}
          </div>
        </div>
        {showError && (
            <div className="error-message-exchange" role="alert" aria-live="assertive">{errorMsg}</div>
        )}
      </main>
    </div>
  );
};

export default Exchange;