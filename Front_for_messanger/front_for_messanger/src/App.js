import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Friends from './components/Friends';
import Chats from './components/Chats';
import Profile from './components/Profile';
import Unlogin from './components/Unlogin';
import Chat from './components/Chat';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { fetchFriends, fetchFriendRequests } from './redux/friendsSlice';
import VerifyPage from './components/VerifyPage';
import ResetPassword from './components/reset_password'

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8080/protected-route', {
          withCredentials: true
        });

        if (response.status === 200 && response.data) {
          dispatch(fetchFriends());
          dispatch(fetchFriendRequests());
          const cachedUserInfo = sessionStorage.getItem('userInfo');
          if (cachedUserInfo) {
            setUserInfo(JSON.parse(cachedUserInfo));
            setIsLoggedIn(true);
          } else {
            setUserInfo(response.data);
            setIsLoggedIn(true);
            sessionStorage.setItem('userInfo', JSON.stringify(response.data));
          }
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
          sessionStorage.removeItem('userInfo');
        }
      } catch (error) {
        console.error("Ошибка проверки авторизации:", error);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkAuthStatus();
  },[dispatch]);

  return (
    <Router>
      <div className="App">
        <Header isLoggedIn={isLoggedIn} userInfo={userInfo} setIsLoggedIn={setIsLoggedIn} setUserInfo={setUserInfo} />
        <Routes>
          <Route path="/friends" element={isLoggedIn ? <Friends /> : <Navigate to="/" />} />
          <Route path="/chats" element={isLoggedIn ? <Chats /> : <Navigate to="/" />} />
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="/profile" element={isLoggedIn ? <Profile userInfo={userInfo} setUserInfo={setUserInfo}/> : <Navigate to="/" />} />
          <Route path="/" element={<Unlogin />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/api/reset" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
