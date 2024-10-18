import React from 'react';
import './Friends.css';

const SearchResults = ({ users, onAddFriend }) => {
  return (
    <div className="friends-list">
      {users.map((user) => (
        <div key={user.id} className="friend-card">
          <img src={user.pic_path ? `http://localhost:8080/${user.pic_path}` : 'http://localhost:8080/static/avatars/default-image.png'}
                alt="avatar" className="avatar" />
          <h3>{user.username}</h3>
          <div className="user-info">
            <p>{`${user.first_name} ${user.sec_name} ${user.last_name}`}</p>
          </div>
          <button className="message-button" onClick={() => onAddFriend(user.id)}>Добавить в друзья</button>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
