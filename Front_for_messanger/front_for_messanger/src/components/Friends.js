import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import FriendSearch from './FriendSearch';
import SearchResults from './SearchResults';
import { fetchFriendRequests, fetchFriends } from '../redux/friendsSlice';
import './Friends.css';
import './Spinner.css';

const Friends = () => {
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.friends.friendsList);
  const myRequests = useSelector((state) => state.friends.myRequests);
  const requestsToMe = useSelector((state) => state.friends.requestsToMe);
  const [searchResults, setSearchResults] = useState([]);
  const [showRequestsToMe, setShowRequestsToMe] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [loading, setLoading] = useState(false); // Состояние загрузки

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleAddFriend = async (receiverId) => {
    setLoading(true); // Начинаем загрузку
    try {
      const senderId = 0; // Замените на реальный ID отправителя
      await axios.post(
        'http://localhost:8080/add_friend',
        {
          sender_id: senderId,
          receiver_id: receiverId,
        },
        {
          withCredentials: true,
        }
      );
      console.log('Запрос на добавление в друзья отправлен!');
      dispatch(fetchFriendRequests());
      dispatch(fetchFriends());
    } catch (error) {
      console.error('Ошибка при добавлении в друзья:', error);
    } finally {
      setLoading(false); // Заканчиваем загрузку
    }
  };

  const handleCreateChat = async (friendId) => {
    setLoading(true); // Начинаем загрузку
    try {
      const response = await axios.post(
        `http://localhost:8080/create_chat`,
        null,
        {
          params: { second_user_id: friendId },
          withCredentials: true,
        }
      );

      const { chat_id, status } = response.data;
      console.log(chat_id, status);
      if (status === 'Chat allready created') {
        console.log(`Чат уже существует: ${chat_id}`);
        window.location.href = `/chat/${chat_id}`;
      } else {
        console.log(`Создан новый чат: ${chat_id}`);
        window.location.href = `/chat/${chat_id}`;
      }
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
    } finally {
      setLoading(false); // Заканчиваем загрузку
    }
  };

  const handleRequestResponse = async (req_id, isAccepted) => {
    setLoading(true); // Начинаем загрузку
    try {
      await axios.post('http://localhost:8080/accept_friend_request', {
        req_id,
        isAsepted: isAccepted,
      }, {
        withCredentials: true,
      });
      dispatch(fetchFriendRequests());
      dispatch(fetchFriends());
    } catch (error) {
      console.error("Ошибка при обработке запроса:", error);
    } finally {
      setLoading(false); // Заканчиваем загрузку
    }
  };

  return (
    <div className="friends-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}

      <div className="column requests-column">
        <h2>Запросы в друзья</h2>
        <div>
          <p onClick={() => setShowRequestsToMe(!showRequestsToMe)} className="toggle">
            Запросы ко мне ({requestsToMe.length})
          </p>
          {showRequestsToMe && (
            <div className="request-list">
              {requestsToMe.map((request) => (
                <div key={request.id} className="request-card">
                  <p>{request.username}</p>
                  <button className="message-button" onClick={() => handleRequestResponse(request.req_id, true)}>Принять</button>
                  <button className="message-button" onClick={() => handleRequestResponse(request.req_id, false)}>Отклонить</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p onClick={() => setShowMyRequests(!showMyRequests)} className="toggle">
            Мои запросы ({myRequests.length})
          </p>
          {showMyRequests && (
            <div className="request-list">
              {myRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <p>{request.username}</p>
                  <button className="message-button" onClick={() => handleRequestResponse(request.req_id, false)}>Отменить запрос</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="column friends-column">
        <h2>Мои друзья</h2>
        <div className="friends-list">
          {friends.map((friend) => (
            <div key={friend.id} className="friend-card">
              <img
                src={friend.pic_path ? `http://localhost:8080/${friend.pic_path}` : 'http://localhost:8080/static/avatars/default-image.png'}
                alt="avatar"
                className="friend-avatar"
              />
              <span>{friend.username}</span>
              <span>{`${friend.first_name || ''} ${friend.sec_name || ''} ${friend.last_name || ''}`.trim()}</span>
              <button className="message-button" onClick={() => handleCreateChat(friend.id)}>Написать</button>
            </div>
          ))}
        </div>
      </div>

      <div className="column search-column">
        <FriendSearch onSearchResults={handleSearchResults} />
        <SearchResults users={searchResults} onAddFriend={handleAddFriend} />
      </div>
    </div>
  );
};

export default Friends;
