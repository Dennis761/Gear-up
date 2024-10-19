import UserModel from '../../Models/UserModel.js'
import EquipmentModel from '../../Models/EquipmentModel.js'
import { validationResult } from 'express-validator'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getAsync, setAsync, redisClient } from '../../Services/redisClient.js'; // Импорт методов Redis

const userSecretCode = process.env.JWT_SECRET || 'user-secret-code'
// export const getProfile = async (req, res) => {
//     try {
//         const userToken = req.query.userToken;

//         // Декодирование токена пользователя
//         const decodedId = jwt.verify(userToken, JWT_SECRET);
//         if (!decodedId) {
//             console.log('Invalid user token');
//             return res.status(400).json({ error: 'Invalid user token' });
//         }

//         const userId = decodedId._id;
//         const cacheKey = `user_profile_${userId}`;

//         console.log(`Checking cache for key: ${cacheKey}`);

//         // Проверка наличия данных профиля в кэше
//         const cachedData = await getAsync(cacheKey);

//         if (cachedData) {
//             console.log('Data found in Redis:', JSON.parse(cachedData));
//             return res.status(200).json({ userInfo: JSON.parse(cachedData) });
//         }

//         console.log('No data in Redis, fetching from DB.');

//         // Если данных нет в кэше, выполняем запрос к базе данных
//         const user = await UserModel.findById(userId);
//         if (!user) {
//             console.log('User not found in DB');
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const { name, about, email, phoneNumber, region, photo, passwordHash, stars } = user;
//         const userInfo = { name, about, email, phoneNumber, region, photo, password: passwordHash, stars };

//         console.log('Fetched user info:', userInfo);

//         // Сохранение данных профиля в кэше с истечением через 30 минут (1800 секунд)
//         try {
//             console.log('Attempting to set data in Redis');
//             await setAsync(cacheKey, JSON.stringify(userInfo), 1800);
//             console.log('Data successfully set in Redis');
//         } catch (error) {
//             console.error('Error setting data in Redis:', error);
//         }

//         return res.status(200).json({ userInfo });
//     } catch (error) {
//         console.error('Error in getProfile:', error);
//         return res.status(500).json({ message: 'Server error' });
//     }
// };


export const getUserProfile = async (req, res) => {
    try {
        // const userToken = req.params.userToken;

        // // Расшифровка токена пользователя
        // let decodedId;
        // try {
        //     decodedId = jwt.verify(userToken, userSecretCode);
        // } catch (error) {
        //     console.error('Невалидный или истекший токен:', error.message);
        //     return res.status(400).json({ error: 'Невалидный или истекший токен' });
        // }

        // if (!decodedId) {
        //     console.error('Невалидный токен пользователя');
        //     return res.status(400).json({ error: 'Невалидный токен пользователя' });
        // }

        // const userId = decodedId._id;
        const userId = req.userId
        console.log('Hi')
        // console.log('Получение данных пользователя из БД.');

        // Получение данных пользователя
        const user = await UserModel.findById(userId);
        if (!user) {
            console.error('Пользователь не найден в БД с ID:', userId);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Подготовка информации о пользователе для ответа
        const { name, about, email, phoneNumber, region, photo, stars } = user;
        const userInfo = {
            name,
            about,
            email,
            phoneNumber,
            region,
            photo,
            stars,
        };

        // console.log('Получена информация о пользователе:', userInfo);
        return res.status(200).json({ userInfo });
    } catch (error) {
        console.error('Ошибка в getUserProfile:', error.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};


export const editProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({
                error: 'User ID not specified'
            });
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const { name, about, email, phoneNumber, region, photo, oldPassword, password } = req.body;

        const updates = {};

        if (name) updates.name = name;
        if (about) updates.about = about;
        if (email) updates.email = email;
        if (phoneNumber) updates.phoneNumber = phoneNumber;
        if (region) updates.region = region;
        if (photo) updates.photo = photo;

        if (password && oldPassword) {
            const isAvailable = await bcrypt.compare(oldPassword, user.passwordHash);
            if (isAvailable) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(password, salt);
                updates.passwordHash = hash;
            } else {
                return res.status(400).json({
                    errors: [{ msg: 'Old password is incorrect', path: "oldpassword" }]
                });
            }
        }

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: userId },
            { $set: updates },
            { new: true }
        );

        await user.save();

        if (!updatedUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Обновление кеша после изменения профиля
        // const cacheKey = `user_profile_${userId}`;
        // try {
        //     await setAsync(cacheKey, JSON.stringify(updatedUser), 1800); // Обновление кеша с новыми данными
        //     console.log('Updated cache with new profile data');
        // } catch (error) {
        //     console.error('Failed to update cache:', error);
        // }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};
