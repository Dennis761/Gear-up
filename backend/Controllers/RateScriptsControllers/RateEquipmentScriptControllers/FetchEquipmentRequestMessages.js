import UserModel from "../../../Models/UserModel.js";
import EquipmentModel from "../../../Models/EquipmentModel.js";

export const fetchEquipmentRequestMessages = async (req, res) => {
    try {
        const userId = req.userId;

        // Ищем пользователя по ID
        const findUser = await UserModel.findById(userId).populate({
            path: 'unreadRentalRatingRequests.ratedId',
            model: function (doc) {
                return doc.ratedModel;
            }
        });

        if (!findUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Получаем все запросы для оборудования
        const equipmentRequests = findUser.unreadRentalRatingRequests.filter(request => request.ratedModel === 'Equipment');

        return res.status(200).json({
            equipmentRequests,
            message: 'List of all equipment requests',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error',
        });
    }
};
