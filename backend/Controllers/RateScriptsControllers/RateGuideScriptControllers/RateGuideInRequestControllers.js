import UserModel from "../../../Models/UserModel.js";
import GuideModel from "../../../Models/GuideModel.js";

export const RateGuideRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { guideId, stars } = req.body;

        // Проверяем значение звёзд
        if (stars < 1 || stars > 5) {
            return res.status(400).json({
                error: 'Рейтинг должен быть от 1 до 5 звезд',
            });
        }

        // Находим гида по ID
        const guide = await GuideModel.findById(guideId);

        if (!guide) {
            return res.status(404).json({
                error: 'Гид не найден',
            });
        }

        // Получаем создателя гида
        const creator = await UserModel.findById(guide.creator);

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

        // Проверяем, если пользователь уже оценивал этого гида
        const existingRatingIndex = guide.rating.ratersList.findIndex(r => r.raterId.toString() === userId);

        if (existingRatingIndex !== -1) {
            // Если пользователь уже оценивал, обновляем количество звёзд
            guide.rating.ratersList[existingRatingIndex].stars = stars;
        } else {
            // Если нет, добавляем нового оценщика
            guide.rating.ratersList.push({ raterId: userId, stars });
        }

        // Пересчитываем общее количество звёзд и средний рейтинг
        guide.rating.allStars = guide.rating.ratersList.reduce((sum, r) => sum + r.stars, 0);
        guide.rating.averageStars = guide.rating.allStars / guide.rating.ratersList.length;

        // Добавляем информацию об оцененном гиде в раздел ratedGuide пользователя
        const ratedGuideIndex = creator.ratedRents.ratedGuide.findIndex(rg => rg.ratedGuideId.toString() === guideId && rg.raterId.toString() === userId);

        if (ratedGuideIndex !== -1) {
            // Если запись уже существует, обновляем количество звёзд
            creator.ratedRents.ratedGuide[ratedGuideIndex].stars = stars;
        } else {
            // Если записи нет, добавляем новую
            creator.ratedRents.ratedGuide.push({
                raterId: userId,
                ratedGuideId: guideId,
                stars,
            });
        }

        // Обновляем количество звёзд у создателя гида
        const newAverage = guide.rating.averageStars;
        creator.stars.guideStars = ((creator.stars.guideStars * creator.myBlogs.length) + newAverage) / (creator.myBlogs.length + 1);
        
        // Сохраняем обновлённые документы
        await guide.save();
        await creator.save();

        return res.status(200).json({
            message: 'Рейтинг гида обновлён и добавлен в профиль пользователя',
            averageStars: guide.rating.averageStars,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Ошибка сервера',
        });
    }
};
