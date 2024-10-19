import UserModel from "../../../Models/UserModel.js";
import ClientModel from "../../../Models/ClientModel.js";

export const fetchClientRequestMessages = async (req, res) => {
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

        // Получаем все запросы для клиентов
        const clientRequests = findUser.unreadRentalRatingRequests.filter(request => request.ratedModel === 'Client');

        return res.status(200).json({
            clientRequests,
            message: 'List of all client requests',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error',
        });
    }
};
