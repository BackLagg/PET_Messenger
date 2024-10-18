import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Spinner.css'; // Импортируем CSS для лоадера

const VerifyPage = () => {
  const [status, setStatus] = useState(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Получаем токен из URL
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const response = await axios.post('http://localhost:8080/verify', { token });
          if (response.status === 200 && response.data.success) {
            setStatus("Аккаунт успешно верифицирован!");
            setTimeout(() => navigate("/"), 3000); // Через 3 секунды перенаправляем на логин
          } else {
            setStatus("Ошибка при верификации.");
          }
        } catch (error) {
          console.error("Ошибка при верификации:", error);
          setStatus("Ошибка при верификации.");
        }
      } else {
        setStatus("Некорректный токен.");
      }
    };

    verifyUser();
  }, [token, navigate]);

  return (
    <div className="loading-container">
      <div>
        <div className="spinner">
          <div></div><div></div><div></div><div></div><div></div><div></div>
        </div>
      </div>
      {/* Под лоадером будет выводиться статус */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        {status ? <p>{status}</p> : <p>Проверка токена...</p>}
      </div>
    </div>
  );
};

export default VerifyPage;
