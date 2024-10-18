import React, { useState } from 'react';
import axios from 'axios';
import './FriendSearch.css';

const FriendSearch = ({ onSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [noResults, setNoResults] = useState(false); // для вывода сообщения при отсутствии пользователей

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // Если поле пустое, просто возврат
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8080/search_users?username=${searchQuery}`, {
        withCredentials: true,
      });
      if (response.data.length === 0) {
        setNoResults(true); // Если пользователей нет, показываем сообщение
      } else {
        setNoResults(false); // Если пользователи есть, скрываем сообщение
        onSearchResults(response.data); // Передаем результаты
      }
    } catch (error) {
      console.error('Ошибка при поиске пользователей:', error);
    }
  };

  return (
    <div className="container">
      <div className="search-container">
        <input
          className="input"
          type="text"
          placeholder="Введите имя пользователя"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg viewBox="0 0 24 24" className="search__icon" onClick={handleSearch}>
          <g>
            <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
          </g>
        </svg>
      </div>
      {noResults && <p className="no-results">Пользователи не найдены</p>}
    </div>
  );
};

export default FriendSearch;
