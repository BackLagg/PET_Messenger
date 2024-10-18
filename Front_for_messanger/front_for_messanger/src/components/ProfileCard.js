import React from 'react';
import './ProfileCard.css';

const ProfileCard = ({ avatar, username, firstName, middleName, lastName, onLogout }) => {
    return (
        <div className="profile-card">
            <img
                src={avatar}
                alt="Avatar"
                className="profile-card-avatar"
            />
            <div className="profile-card-username">{username}</div>
            <div className="profile-card-info">
                <p>{middleName}</p>
                <p>{firstName} {lastName}</p>
            </div>
            <button className="profile-card-logout-btn" onClick={onLogout}>Выйти</button>
        </div>
    );
};

export default ProfileCard;
