import React, { useState } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = ({ userInfo, setUserInfo }) => {
  const [firstName, setFirstName] = useState(userInfo.first_name);
  const [secName, setSecName] = useState(userInfo.sec_name);
  const [lastName, setLastName] = useState(userInfo.last_name);
  const [picPath, setPicPath] = useState(userInfo.pic_path);
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [passwordEditing, setPasswordEditing] = useState(false); // Состояние для редактирования пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Функция для загрузки файла и предварительного просмотра
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const maxSize = 10 * 1024 * 1024; // 2MB
      const validFormats = ['image/jpeg', 'image/png', 'image/gif'];

      if (selectedFile.size > maxSize) {
        setError('Файл слишком большой. Максимальный размер: 2MB.');
        return;
      }

      if (!validFormats.includes(selectedFile.type)) {
        setError('Недопустимый формат. Допустимы только JPEG, PNG и GIF.');
        return;
      }

      setFile(selectedFile);
      setPicPath(URL.createObjectURL(selectedFile)); // Предварительный просмотр
      setError('');
    }
  };

  // Сохранение изменений
  const handleSaveChanges = async () => {
    let newPicPath = picPath;
    let newPicName = null;

    // Если загружен новый файл, создаем уникальный идентификатор и сохраняем файл
    if (file) {
      const uniqueId = Date.now();
      newPicName = `${uniqueId}-${file.name}`;
      newPicPath = `static/avatars/${newPicName}`;
      // Создаём новый файл с изменённым именем
      const newFile = new File([file], newPicName, { type: file.type });

      const formData = new FormData();
      formData.append('file', newFile); // Используем новый файл 
      // Сохраняем файл на сервере
      await axios.post('http://localhost:8080/upload', formData, {
        withCredentials: true,
      });
    }

    try {
      const response = await axios.post('http://localhost:8080/user_info_add', {
        first_name: firstName,
        sec_name: secName,
        last_name: lastName,
        pic_path: newPicPath, // Уникальное имя файла
      }, {
        withCredentials: true,
      });

      if (response.status === 200) {
        // Обновляем данные в локальном хранилище
        const updatedUserInfo = { 
          ...userInfo, 
          first_name: firstName, 
          sec_name: secName, 
          last_name: lastName, 
          pic_path: newPicPath 
        };
        sessionStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        setUserInfo(updatedUserInfo);
        // Выключаем режим редактирования
        setEditing(false);
      }
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error);
      setError('Не удалось сохранить изменения. Попробуйте еще раз.');
    }
  };

  // Отмена редактирования
  const handleCancel = () => {
    setFirstName(userInfo.first_name);
    setSecName(userInfo.sec_name);
    setLastName(userInfo.last_name);
    setPicPath(userInfo.pic_path);
    setFile(null);
    setEditing(false);
    setPasswordEditing(false); // Сбрасываем режим редактирования пароля
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setPasswordError('');
  };

  // Смена пароля
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      }, {
        withCredentials: true,
      });

      if (response.status === 200) {
        // Успешная смена пароля, сброс значений
        handleCancel();
      }
    } catch (error) {
      console.error('Ошибка при смене пароля:', error);
      setPasswordError('Не удалось сменить пароль. Попробуйте еще раз.');
    }
  };

  return (
    <div className="profile-main-container">
      <div className="profile-user-card">
        <div className="profile-avatar-section">
          <img
            src={file ? picPath : (userInfo.pic_path ? `http://localhost:8080/${userInfo.pic_path}` : 'http://localhost:8080/static/avatars/default-image.png')}
            alt="avatar"
            className="profile-avatar-img"
          />
          {editing && (
            <label className="profile-upload-btn">
              Загрузить новый аватар
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          )}
          <p className="profile-username-display">{userInfo.username}</p>
        </div>
      </div>
      
      <div className="profile-user-card">
        <div className="profile-details-section">
          <p className="profile-detail-text">
            <span className="profile-username-display">Имя:</span> {editing ? (
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="profile-edit-input"
                placeholder="Имя"
              />
            ) : (
              firstName
            )}
          </p>
          <p className="profile-detail-text">
            <span className="profile-username-display">Фамилия:</span> {editing ? (
              <input
                type="text"
                value={secName}
                onChange={(e) => setSecName(e.target.value)}
                className="profile-edit-input"
                placeholder="Фамилия"
              />
            ) : (
              secName
            )}
          </p>
          <p className="profile-detail-text">
            <span className="profile-username-display">Отчество:</span> {editing ? (
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="profile-edit-input"
                placeholder="Отчество"
              />
            ) : (
              lastName
            )}
          </p>
        </div>

        <div className="profile-edit-section">
          {editing ? (
            <>
              <button className="profile-save-btn" onClick={handleSaveChanges}>
                Сохранить изменения
              </button>
              <button className="profile-cancel-btn" onClick={handleCancel}>
                Отмена
              </button>
            </>
          ) : (
            <>
              <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                Редактировать профиль
              </button>
              <button className="profile-change-password-btn" onClick={() => setPasswordEditing(true)}>
                Сменить пароль
              </button>
            </>
          )}
        </div>

        {passwordEditing && (
          <div className="password-edit-section">
            <h3>Сменить пароль</h3>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Старый пароль"
              className="profile-edit-input"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Новый пароль"
              className="profile-edit-input"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите новый пароль"
              className="profile-edit-input"
            />
            {passwordError && <p className="profile-error-msg">{passwordError}</p>}
            <button className="profile-save-btn" onClick={handleChangePassword}>
              Сменить пароль
            </button>
            <button className="profile-cancel-btn" onClick={handleCancel}>
              Отмена
            </button>
          </div>
        )}

        {error && <p className="profile-error-msg">{error}</p>}
      </div>
    </div>
  );
};

export default Profile;
