import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Header.css';
import ProfileCard from './ProfileCard';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchFriends, fetchFriendRequests } from '../redux/friendsSlice';

const Header = ({ isLoggedIn, userInfo, setIsLoggedIn, setUserInfo }) => {
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [activeButton, setActiveButton] = useState('');
    const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
    const profileCardRef = useRef(null); // Создаем ref для карточки
    const navigate = useNavigate();
    const dispatch = useDispatch();


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileCardRef.current && !profileCardRef.current.contains(event.target)) {
                setShowUserMenu(false); // Скрываем карточку при клике вне её области
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const handleButtonClick = (buttonName) => {
        setActiveButton(buttonName);
        navigate(`/${buttonName.toLowerCase()}`); // Переход на соответствующий маршрут
    };

    const handleLoginClick = () => {
        setShowLoginForm(true);
        setShowRegisterForm(false);
        setShowForgotPasswordForm(false);
    };

    const handleRegisterClick = () => {
        setShowRegisterForm(true);
        setShowLoginForm(false);
        setShowForgotPasswordForm(false);
    };

    const handleForgotPasswordClick = () => {
        setShowForgotPasswordForm(true);
        setShowLoginForm(false);
        setShowRegisterForm(false); // Скрыть форму регистрации
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8080/auth/jwt/logout', {}, {
                withCredentials: true // Учитываем JWT при логауте
            });
            // Успешный выход из системы
            setIsLoggedIn(false);
            setUserInfo(null); // Очищаем данные о пользователе
            sessionStorage.removeItem('userInfo');
            navigate('/');
        } catch (error) {
            console.error("Ошибка при выходе из системы:", error);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            // Логин пользователя
            await axios.post('http://localhost:8080/auth/jwt/login',
                `username=${email}&password=${password}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                withCredentials: true // Указываем отправку куки
            });

            // После успешного логина получаем информацию о пользователе
            const userResponse = await axios.get('http://localhost:8080/protected-route', {
                withCredentials: true // Проверка состояния сессии

            });
            // Сохраняем информацию о пользователе
            if (userResponse.status === 200) {
                dispatch(fetchFriends());
                dispatch(fetchFriendRequests());
                setUserInfo(userResponse.data);
                setIsLoggedIn(true);
                sessionStorage.setItem('userInfo', JSON.stringify(userResponse.data));
                setShowLoginForm(false); // Закрываем форму логина
            }
        } catch (error) {
            console.error("Ошибка при входе или получении информации о пользователе:", error);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const username = e.target.username.value;

        try {
            await axios.post('http://localhost:8080/auth/register',
                { email, password, username }, {
                headers: { 'Content-Type': 'application/json' }
            });

            // Успешная регистрация, переключаемся на форму логина
            setShowLoginForm(true);
            setShowRegisterForm(false);
        } catch (error) {
            console.error("Ошибка при регистрации:", error);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/forgot-password',
                { email: forgotPasswordEmail }, {
                headers: { 'Content-Type': 'application/json' }
            });

            // Сообщение об успешной отправке
            setForgotPasswordMessage("Инструкция по сбросу пароля отправлена на ваш email.");
            setForgotPasswordEmail('');

            // Автоматически возвращаем на форму логина через 3 секунды
            setTimeout(() => {
                setShowForgotPasswordForm(false);
                setForgotPasswordMessage('');
                setShowLoginForm(true);
            }, 3000);
        } catch (error) {
            console.error("Ошибка при отправке email для сброса пароля:", error);
            setForgotPasswordMessage("Ошибка при отправке email. Попробуйте снова.");
        }
    };

    return (
        <header className="header">
            <div className="logo">
                <h1>Лого</h1>
            </div>
            {isLoggedIn && (
                <div className="nav-buttons">
                    <button
                        className={`nav-btn ${activeButton === 'Friends' ? 'active' : ''}`}
                        onClick={() => handleButtonClick('Friends')}
                    >
                        Друзья
                    </button>
                    <button
                        className={`nav-btn ${activeButton === 'Chats' ? 'active' : ''}`}
                        onClick={() => handleButtonClick('Chats')}
                    >
                        Чаты
                    </button>
                    <button
                        className={`nav-btn ${activeButton === 'Profile' ? 'active' : ''}`}
                        onClick={() => handleButtonClick('Profile')}
                    >
                        Профиль
                    </button>
                </div>
            )}
            <div className="user-area">
                {isLoggedIn && userInfo ? (
                    <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
                        <img
                            src={userInfo.pic_path ? `http://localhost:8080/${userInfo.pic_path}` : 'http://localhost:8080/static/avatars/default-image.png'}
                            alt="avatar"
                            className="avatar"
                        />
                        <span className="username">{userInfo.username}</span>

                        <div className={`profile-card-container ${showUserMenu ? 'visible' : ''}`} onMouseEnter={() => setShowUserMenu(true)}
                            onMouseLeave={() => setShowUserMenu(false)}>
                            <ProfileCard
                                avatar={userInfo.pic_path ? `http://localhost:8080/${userInfo.pic_path}` : 'http://localhost:8080/static/avatars/default-image.png'}
                                username={userInfo.username}
                                firstName={userInfo.first_name}
                                middleName={userInfo.sec_name}
                                lastName={userInfo.last_name}
                                onLogout={handleLogout}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="auth-buttons">
                        <button className="login-btn" onClick={handleLoginClick}>Войти</button>
                        {showLoginForm && (
                            <form className="login-form" onSubmit={handleLoginSubmit}>
                                <input type="email" name="email" placeholder="Email" required />
                                <input type="password" name="password" placeholder="Пароль" required />
                                <button type="submit" className="submit-btn">Войти</button>
                                <p>Ещё не зарегистрированы? <span className="register-link" onClick={handleRegisterClick}>Зарегистрироваться</span></p>
                                <span className="register-link" onClick={handleForgotPasswordClick}>Забыли пароль?</span>
                            </form>
                        )}
                        {showRegisterForm && (
                            <form className="register-form" onSubmit={handleRegisterSubmit}>
                                <input type="text" name="username" placeholder="Имя пользователя" required />
                                <input type="email" name="email" placeholder="Email" required />
                                <input type="password" name="password" placeholder="Пароль" required />
                                <button type="submit" className="submit-btn">Зарегистрироваться</button>
                                <p>Уже есть аккаунт? <span className="login-link" onClick={handleLoginClick}>Войти</span></p>
                            </form>
                        )}
                        {showForgotPasswordForm && (
                            <form className="password-change-form" onSubmit={handleForgotPasswordSubmit}>
                                <input
                                    type="email"
                                    value={forgotPasswordEmail}
                                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                    placeholder="Введите ваш email"
                                    required
                                />
                                <button type="submit" className="submit-btn">Отправить</button>
                                {forgotPasswordMessage && <p className="password-change-message">{forgotPasswordMessage}</p>}
                            </form>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
