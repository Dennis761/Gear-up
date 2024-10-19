import UserModel from "../../../Models/UserModel.js";
import ClientModel from "../../../Models/ClientModel.js";

export const RateClientRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { clientId, stars } = req.body;

        // Проверяем значение звёзд
        if (stars < 1 || stars > 5) {
            return res.status(400).json({
                error: 'Рейтинг должен быть от 1 до 5 звезд',
            });
        }

        // Находим клиента по ID
        const client = await ClientModel.findById(clientId);

        if (!client) {
            return res.status(404).json({
                error: 'Клиент не найден',
            });
        }

        // Получаем создателя клиента
        const creator = await UserModel.findById(client.creator);

        if (!creator) {
            return res.status(404).json({
                error: 'Пользователь не найден',
            });
        }

        // Находим пользователя, оставляющего рейтинг
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'Пользователь не найден',
            });
        }

        // Проверяем, если пользователь уже оценивал этого клиента
        const existingRatingIndex = client.rating.ratersList.findIndex(r => r.raterId.toString() === userId);

        if (existingRatingIndex !== -1) {
            // Если пользователь уже оценивал, обновляем количество звёзд
            client.rating.ratersList[existingRatingIndex].stars = stars;
        } else {
            // Если нет, добавляем нового оценщика
            client.rating.ratersList.push({ raterId: userId, stars });
        }

        // Пересчитываем общее количество звёзд и средний рейтинг
        client.rating.allStars = client.rating.ratersList.reduce((sum, r) => sum + r.stars, 0);
        client.rating.averageStars = client.rating.allStars / client.rating.ratersList.length;

        // Добавляем информацию об оцененном клиенте в раздел ratedClient пользователя
        const ratedClientIndex = creator.ratedRents.ratedClient.findIndex(rc => rc.ratedClientId.toString() === clientId && rc.raterId.toString() === userId);

        if (ratedClientIndex !== -1) {
            // Если запись уже существует, обновляем количество звёзд
            creator.ratedRents.ratedClient[ratedClientIndex].stars = stars;
        } else {
            // Если записи нет, добавляем новую
            creator.ratedRents.ratedClient.push({
                raterId: userId,
                ratedClientId: clientId,
                stars,
            });
        }

        // Обновляем количество звёзд у создателя клиента
        const newAverage = client.rating.averageStars;
        creator.stars.clientStars = ((creator.stars.clientStars * creator.myBlogs.length) + newAverage) / (creator.myBlogs.length + 1);
        
        // Сохраняем обновлённые документы
        await client.save();
        await creator.save();

        return res.status(200).json({
            message: 'Рейтинг клиента обновлён и добавлен в профиль пользователя',
            averageStars: client.rating.averageStars,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Ошибка сервера',
        });
    }
};
