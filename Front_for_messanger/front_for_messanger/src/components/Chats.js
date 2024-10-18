import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Chats.css';
import './Spinner.css';

const Chats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true); // Состояние загрузки

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get('http://localhost:8080/my_chats', {
          withCredentials: true,
        });
        setChats(response.data.chats); // Устанавливаем состояние чатов
      } catch (error) {
        console.error('Ошибка при получении чатов:', error);
      } finally {
        setLoading(false); // Устанавливаем состояние загрузки в false в любом случае
      }
    };

    fetchChats();
  }, []);
  const getFileName = (filePath) => {
    // Разделяем путь по символам __$__ и возвращаем последний элемент
    const parts = filePath.split('__$__');
    return parts[parts.length - 1];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    ); // Индикатор загрузки
  }

  return (
    <div className="chats-container">
      <h2>Мои Чаты</h2>
      {chats === undefined ? ( // Проверяем, есть ли чаты
        <div className="no-chats-message">
          У вас пока нет чатов. Начните общаться с друзьями!
        </div>
      ) : (
        <div className="chats-list">
          {chats.map((chat) => (
            <Link
              key={chat.chat_id}
              to={{
                pathname: `/chat/${chat.chat_id}`,
                state: { username: chat.username } // Передаем ник собеседника
              }}
              className="chat-item"
            >
              <div className="chat-username">{chat.username}</div>
              <div className="chat-last-message">{getFileName(chat.last_message) || 'Нет сообщений'}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chats;
