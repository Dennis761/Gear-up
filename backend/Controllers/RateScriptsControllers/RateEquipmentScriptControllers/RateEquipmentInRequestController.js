import UserModel from "../../../Models/UserModel.js";
import EquipmentModel from "../../../Models/EquipmentModel.js";

export const RateEquipmentRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { equipmentId, stars } = req.body;

        // Проверяем значение звёзд
        if (stars < 1 || stars > 5) {
            return res.status(400).json({
                error: 'Рейтинг должен быть от 1 до 5 звезд',
            });
        }

        // Находим оборудование по ID
        const equipment = await EquipmentModel.findById(equipmentId);

        if (!equipment) {
            return res.status(404).json({
                error: 'Оборудование не найдено',
            });
        }

        // Получаем создателя оборудования
        const creator = await UserModel.findById(equipment.creator);

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

        // Проверяем, если пользователь уже оценивал это оборудование
        const existingRatingIndex = equipment.rating.ratersList.findIndex(r => r.raterId.toString() === userId);

        if (existingRatingIndex !== -1) {
            // Если пользователь уже оценивал, обновляем количество звёзд
            equipment.rating.ratersList[existingRatingIndex].stars = stars;
        } else {
            // Если нет, добавляем нового оценщика
            equipment.rating.ratersList.push({ raterId: userId, stars });
        }

        // Пересчитываем общее количество звёзд и средний рейтинг
        equipment.rating.allStars = equipment.rating.ratersList.reduce((sum, r) => sum + r.stars, 0);
        equipment.rating.averageStars = equipment.rating.allStars / equipment.rating.ratersList.length;

        // Добавляем информацию об оцененном снаряжении в раздел ratedEquipment пользователя
        const ratedEquipmentIndex = creator.ratedRents.ratedEquipment.findIndex(re => re.ratedEquipmentId.toString() === equipmentId && re.raterId.toString() === userId);

        if (ratedEquipmentIndex !== -1) {
            // Если запись уже существует, обновляем количество звёзд
            creator.ratedRents.ratedEquipment[ratedEquipmentIndex].stars = stars;
        } else {
            // Если записи нет, добавляем новую
            creator.ratedRents.ratedEquipment.push({
                raterId: userId,
                ratedEquipmentId: equipmentId,
                stars,
            });
        }

        // Обновляем количество звёзд у создателя оборудования
        const newAverage = equipment.rating.averageStars;
        creator.stars.equipmentStars = ((creator.stars.equipmentStars * creator.myBlogs.length) + newAverage) / (creator.myBlogs.length + 1);
        
        // Сохраняем обновлённые документы
        await equipment.save();
        await creator.save();

        return res.status(200).json({
            message: 'Рейтинг оборудования обновлён и добавлен в профиль пользователя',
            averageStars: equipment.rating.averageStars,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Ошибка сервера',
        });
    }
};


// import UserModel from "../../../Models/UserModel";
// import EquipmentModel from "../../../Models/EquipmentModel";

// export const RateEquipmentRequest = async (req, res) => {
//     try {
//         const userId = req.userId;
//         const { equipmentId, stars } = req.body;

//         // Проверяем значение звёзд
//         if (stars < 1 || stars > 5) {
//             return res.status(400).json({
//                 error: 'Рейтинг должен быть от 1 до 5 звезд',
//             });
//         }

//         // Находим оборудование по ID
//         const equipment = await EquipmentModel.findById(equipmentId);

//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Оборудование не найдено',
//             });
//         }

//         const creator = await equipment.populate('creatorId')

//         if (!creator) {
//             return res.status(404).json({
//                 error: 'Пользователь не найден',
//             });
//         }

//         // Находим пользователя по ID
//         const user = await UserModel.findById(userId);

//         if (!user) {
//             return res.status(404).json({
//                 error: 'Пользователь не найден',
//             });
//         }

//         // Проверяем, если пользователь уже оценивал это оборудование
//         const existingRatingIndex = equipment.rating.ratersList.findIndex(r => r.raterId.toString() === userId);

//         if (existingRatingIndex !== -1) {
//             // Если пользователь уже оценивал, обновляем количество звёзд
//             equipment.rating.ratersList[existingRatingIndex].stars = stars;
//         } else {
//             // Если нет, добавляем нового оценщика
//             equipment.rating.ratersList.push({ raterId: userId, stars });
//         }

//         // Пересчитываем общее количество звёзд
//         equipment.rating.allStars = equipment.rating.ratersList.reduce((sum, r) => sum + r.stars, 0);
//         equipment.rating.averageStars = equipment.rating.allStars / equipment.rating.ratersList.length;

//         // Добавляем информацию об оцененном снаряжении в раздел ratedEquipment пользователя
//         const ratedEquipmentIndex = creator.ratedRents.ratedEquipment.findIndex(re => re.ratedEquipmentId.toString() === equipmentId && re.raterId.toString() === userId);

//         if (ratedEquipmentIndex !== -1) {
//             // Если запись уже существует, обновляем количество звёзд
//             creator.ratedRents.ratedEquipment[ratedEquipmentIndex].stars = stars;
//         } else {
//             // Если записи нет, добавляем новую
//             creator.ratedRents.ratedEquipment.push({
//                 raterId: userId,
//                 ratedEquipmentId: equipmentId,
//                 stars,
//             });
//         }

//         // Сохраняем обновлённые документы
//         await equipment.save();
//         await creator.save();

//         return res.status(200).json({
//             message: 'Рейтинг оборудования обновлён и добавлен в профиль пользователя',
//             averageStars: equipment.rating.averageStars,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             error: 'Ошибка сервера',
//         });
//     }
// };


// // import UserModel from "../../../Models/UserModel";
// // import EquipmentModel from "../../../Models/EquipmentModel";

// // export const RateEquipmentRequest = async (req, res) => {
// //     try {
// //         const userId = req.userId;
// //         const { equipmentId, stars } = req.body;

// //         // Проверяем, что звезды находятся в пределах 1-5
// //         if (stars < 1 || stars > 5) {
// //             return res.status(400).json({
// //                 error: 'Rating should be between 1 and 5 stars',
// //             });
// //         }

// //         // Находим оборудование по ID
// //         const equipment = await EquipmentModel.findById(equipmentId);

// //         if (!equipment) {
// //             return res.status(404).json({
// //                 error: 'Equipment not found',
// //             });
// //         }

// //         // Находим пользователя по ID
// //         const user = await UserModel.findById(userId);

// //         if (!user) {
// //             return res.status(404).json({
// //                 error: 'User not found',
// //             });
// //         }

// //         // Проверяем, если пользователь уже оценивал это оборудование
// //         const existingRatingIndex = equipment.rating.ratersList.findIndex(r => r.raterId.toString() === userId);

// //         if (existingRatingIndex !== -1) {
// //             // Если пользователь уже оценивал, обновляем количество звезд
// //             equipment.rating.ratersList[existingRatingIndex].stars = stars;
// //         } else {
// //             // Если нет, добавляем нового оценщика
// //             equipment.rating.ratersList.push({ raterId: userId, stars });
// //         }

// //         // Пересчитываем общее количество звезд
// //         equipment.rating.allStars = equipment.rating.ratersList.reduce((sum, r) => sum + r.stars, 0);

// //         // Пересчитываем средний рейтинг
// //         equipment.rating.averageStars = equipment.rating.allStars / equipment.rating.ratersList.length;

// //         // Сохраняем обновленный документ оборудования
// //         await equipment.save();

// //         // Удаляем соответствующее сообщение из модели пользователя
// //         user.unreadRentalRatingRequests = user.unreadRentalRatingRequests.filter(request => {
// //             return !(request.ratedId.toString() === equipmentId && request.ratedModel === 'Equipment');
// //         });

// //         // Сохраняем обновленный документ пользователя
// //         await user.save();

// //         return res.status(200).json({
// //             message: 'Equipment rating updated and request removed successfully',
// //             averageStars: equipment.rating.averageStars,
// //         });
// //     } catch (error) {
// //         console.error(error);
// //         return res.status(500).json({
// //             error: 'Server error',
// //         });
// //     }
// // };
