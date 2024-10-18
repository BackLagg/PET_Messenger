import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import './ResetPassword.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Получаем токен из URL
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Сравниваем пароли перед отправкой
    if (newPassword !== confirmPassword) {
      setErrorMessage("Пароли не совпадают");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token, // Отправляем токен на бэкенд
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setNewPassword("");
        setConfirmPassword("");
        setErrorMessage("");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        alert("Ошибка при сбросе пароля");
      }
    } catch (error) {
      console.error("Ошибка при сбросе пароля:", error);
    }
  };

  return (
    <div className="reset-container">
      <form className="reset-form" onSubmit={handleSubmit}>
        <h1>Сброс пароля</h1>

        <label>
          Новый пароль:
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>

        <label>
          Повторите новый пароль:
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        {/* Сообщение об ошибке в случае несовпадения паролей */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit">Сохранить новый пароль</button>
      </form>
    </div>
  );
};

export default ResetPassword;
