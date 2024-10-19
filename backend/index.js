import express from 'express';
import connectDB from './db.js';
import configureMiddleware from './Middlewares/ConfigureMiddleware.js';
import configureRoutes from './Routes/root.js';
import dotenv from 'dotenv';

const app = express();

const PORT = process.env.PORT || 4444;

dotenv.config();

// Подключение к базе данных
connectDB();

// Настройка middleware
configureMiddleware(app);

// Настройка маршрутов
configureRoutes(app);

app.get('/', (req, res) => {
    res.send('Hello world!');
});

// Запуск сервера
app.listen(PORT, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Server running on PORT:${PORT}`);
    }
});
