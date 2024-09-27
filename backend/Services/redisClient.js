// // Services/redisClient.js
// import redis from 'redis';
// import util from 'util';

// // Создание клиента Redis
// const redisClient = redis.createClient({
//     url: 'redis://localhost:6379', // URL для подключения к Redis
// });

// // Обработка событий клиента Redis
// redisClient.on('error', (err) => {
//     console.error('Redis error:', err);
// });

// redisClient.on('connect', () => {
//     console.log('Connected to Redis');
// });

// // Асинхронное подключение к Redis
// async function connectRedis() {
//     try {
//         if (!redisClient.isOpen) {
//             await redisClient.connect();
//             console.log('Redis client connected');
//         }
//     } catch (err) {
//         console.error('Error connecting to Redis:', err);
//     }
// }

// // Промисификация методов get и set
// const getAsync = async (key) => {
//     await connectRedis(); // Убедитесь, что клиент подключен перед выполнением команды
//     return util.promisify(redisClient.get).bind(redisClient)(key);
// };

// const setAsync = async (key, value, expiration) => {
//     await connectRedis(); // Убедитесь, что клиент подключен перед выполнением команды
//     return util.promisify(redisClient.set).bind(redisClient)(key, value, 'EX', expiration);
// };

// export { redisClient, getAsync, setAsync };
// Services/redisClient.js

import { createClient } from 'redis';

// Создание клиента Redis
const redisClient = createClient({
    url: 'redis://localhost:6379',
});

// Обработка событий клиента Redis
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

// Подключение к Redis
await redisClient.connect();

// Асинхронные методы get и set
const getAsync = async (key) => {
    return await redisClient.get(key);
};

const setAsync = async (key, value, expiration) => {
    return await redisClient.set(key, value, {
        EX: expiration,
    });
};

export { redisClient, getAsync, setAsync };

