import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './Chat.css'; // Подключаем стили
import './Spinner.css';
import './SendButton.css';


const Chat = () => {
    const { chatId } = useParams(); // Получаем chatId из параметров маршрута
    const [messages, setMessages] = useState([]); // Состояние для хранения сообщений
    const [messageInput, setMessageInput] = useState('');
    const [user, setUser] = useState(null); // Инициализация состояния пользователя
    const [loading, setLoading] = useState(true); // Состояние для отображения загрузки
    const [file, setFile] = useState(null); // Состояние для файла
    const [showScrollButton, setShowScrollButton] = useState(false); // Состояние для отображения кнопки
    const [selectedFile, setSelectedFile] = useState(null);
    const [page, setPage] = useState(0); // Состояние для текущей страницы
    const ws = useRef(null);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const messagesEndRef = useRef(null);
    const loadMoreRef = useRef(null);

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']; // Список допустимых расширений изображений
    const fileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar']; // Список допустимых расширений файлов

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file.name);
            setFile(file); // Устанавливаем имя выбранного файла
        }
    };

    useEffect(() => {

        if (loading || !hasMoreMessages) {
            return; // Если больше сообщений нет, не инициализируем observer
        }
        const loadMoreMessages = () => {
            setLoading(true);
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ loadMore: true })); // Отправка запроса на сервер
                setPage(prevPage => prevPage + 1); // Увеличение номера страницы
            }
            setTimeout(() => {
                setLoading(false); // Здесь можете настроить время в зависимости от вашего запроса
            }, 500);
        };
        // Настройка Intersection Observer для загрузки сообщений
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreMessages(); // Загружаем больше сообщений, когда элемент виден
            }
        }, {
            threshold: 1.0, // Запускаем, когда элемент полностью виден
        });

        // Сохраняем ссылку на текущий элемент
        const currentRef = loadMoreRef.current;

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [loadMoreRef, page, hasMoreMessages, loading]);
    // Обработчик вставки из буфера обмена
    const handlePaste = (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const pastedFile = item.getAsFile();
                if (pastedFile) {
                    setFile(pastedFile);
                    setSelectedFile(pastedFile.name);
                }
            }
        }
    };

    // Функция для автоматической прокрутки вниз
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Отслеживание прокрутки
    const handleScroll = () => {
        const isAtBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 1;
        setShowScrollButton(!isAtBottom);
    };

    const getTruncatedFileName = (fileName) => {
        const maxLength = 20; // Максимальная длина отображаемого названия
        const extension = fileName.slice(fileName.lastIndexOf('.'));
        const nameWithoutExtension = fileName.slice(0, fileName.lastIndexOf('.'));
        if (nameWithoutExtension.length > maxLength) {
            return `${nameWithoutExtension.slice(0, maxLength)}...${extension}`;
        }
        return fileName;
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFile(null) // Сбрасываем файл
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        scrollToBottom();
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [messages]);

    useEffect(() => {
        ws.current = new WebSocket(`ws://localhost:8080/ws/chat/${chatId}`);

        ws.current.onopen = () => {
            console.log('WebSocket соединение установлено');
            (async () => {
                try {
                    const response = await fetch("http://localhost:8080/current_user_get", {
                        method: "GET",
                        credentials: "include",
                    });

                    if (!response.ok) {
                        throw new Error("Не удалось получить текущего пользователя");
                    }

                    const userData = await response.json();
                    setUser(userData); // Сохраняем пользователя в состоянии
                    ws.current.send(JSON.stringify({ userId: userData }));

                    setLoading(false);

                } catch (err) {
                    console.error(err);
                }
            })();
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("Полученное сообщение:", message);
                if (message.info === "Все сообщения загружены") {
                    setHasMoreMessages(false); // Больше сообщений не будет
                    return;
                }
                setMessages((prevMessages) => [...prevMessages, message]);
            } catch (error) {
                console.error("Ошибка при обработке сообщения WebSocket:", error);
            }
        };
        ws.current.onclose = () => {
            console.log("Соединение закрыто");
        };

        ws.current.onerror = (error) => {
            console.error("Ошибка WebSocket:", error);
        };

        return () => {
            ws.current.close();
        };
    }, [chatId]);

    const sendMessage = () => {
        if (!messageInput.trim() && !file) {
            return; // Прекращаем выполнение функции, если ни текст, ни файл не указаны
        }
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = {
                text: messageInput, // Текст сообщения
            };

            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64File = event.target.result; // Получаем файл в base64
                    ws.current.send(JSON.stringify({
                        file: base64File,
                        filename: file.name,
                    }));
                };
                reader.readAsDataURL(file);
                setFile(null); // Очищаем поле файла
                setSelectedFile(null)
            } else {
                console.log("Отправка сообщения:", message);
                ws.current.send(JSON.stringify(message));
            }

            setMessageInput('');
        } else {
            console.error("WebSocket не подключен");
        }
    };

    // Сортировка сообщений
    const sortedMessages = messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const groupedMessages = sortedMessages.reduce((acc, msg) => {
        const date = new Date(msg.created_at).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(msg);
        return acc;
    }, {});
    const url = 'http://localhost:8080/'
    const downloadFile = (url, fileName) => {
        const link = document.createElement('a');
        link.href = url + fileName; // Имя файла для сохранения
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Удаляем элемент после скачивания
    };
    const getFileName = (filePath) => {
        // Разделяем путь по символам __$__ и возвращаем последний элемент
        const parts = filePath.split('__$__');
        return parts[parts.length - 1];
    };

    return (
        <div className="chat-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner">
                        <div></div><div></div><div></div><div></div><div></div><div></div>
                    </div>
                </div>
            )}
            {/* Верхняя плашка с информацией о чате */}
            <div className="chat-header">
                <h2>Чат с пользователем</h2>
                {/* Замените текст на соответствующий заголовок чата */}
            </div>
            {/* Контейнер для сообщений */}
            <div className="chat-messages">
                <div ref={loadMoreRef} style={{ height: '1px' }} />
                {Object.entries(groupedMessages).map(([date, messages]) => (
                    <div key={date}>
                        <div className="message-date">{date}</div>
                        {messages.map((msg, index) => {
                            const messageDate = new Date(msg.created_at);
                            const formattedTime = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const isSentByUser = msg.sender === user;
                            const fileExtension = msg.text?.split('.').pop().toLowerCase();

                            return (
                                <div key={index} className={`message-block ${isSentByUser ? 'sent' : 'received'}`}>
                                    <div className={`message-content ${isSentByUser ? 'sent' : 'received'}`}>
                                        <strong>{msg.sender}:</strong>
                                        {msg.is_picture && imageExtensions.includes(fileExtension) ? (
                                            <img src={`http://localhost:8080/${msg.text}`} alt="file" style={{ maxWidth: '150px', borderRadius: '20px' }} />
                                        ) : msg.is_picture && fileExtensions.includes(fileExtension) ? (
                                            <div onClick={() => downloadFile(url, msg.text)} className="file-download">
                                                <span>{getFileName(msg.text)}</span>
                                                <img src={`http://localhost:8080/static/chat_files/file-icon.png`} alt="file icon" className="file-icon" />
                                            </div>
                                        ) : (
                                            msg.text
                                        )}
                                        <div className="message-time">{formattedTime}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {selectedFile && (
                <div className="file-info-show">
                    <span className="file-name">
                        {getTruncatedFileName(selectedFile)}
                    </span>
                    <button className="remove-file-btn" onClick={handleRemoveFile}>
                        &times;
                    </button>
                </div>
            )}
            {/* Нижняя плашка для ввода сообщения */}
            <div className="chat-input">
                <label htmlFor="file-upload" className="plusButton">
                    <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <svg className="plusIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                        <g mask="url(#mask0_21_345)">
                            <path d="M13.75 23.75V16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75Z"></path>
                        </g>
                    </svg>
                </label>
                <input
                    type="text"
                    value={messageInput}
                    onPaste={handlePaste}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Введите сообщение"
                />
                <button onClick={sendMessage} className="unique-button">
                    <div className="unique-svg-wrapper-1">
                        <div className="unique-svg-wrapper">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                            >
                                <path fill="none" d="M0 0h24v24H0z"></path>
                                <path
                                    fill="currentColor"
                                    d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                                ></path>
                            </svg>
                        </div>
                    </div>
                    <span>Send</span>
                </button>
            </div>

            {showScrollButton && (
                <button className="scroll-button" onClick={scrollToBottom}>
                    ↓
                </button>
            )}
        </div>
    );
};

export default Chat;
