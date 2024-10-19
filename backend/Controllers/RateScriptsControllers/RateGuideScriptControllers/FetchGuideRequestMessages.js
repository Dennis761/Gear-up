import UserModel from "../../../Models/UserModel.js";
import GuideModel from "../../../Models/GuideModel.js";

export const fetchGuideRequestMessages = async (req, res) => {
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

        // Получаем все запросы для гидов
        const guideRequests = findUser.unreadRentalRatingRequests.filter(request => request.ratedModel === 'Guide');

        return res.status(200).json({
            guideRequests,
            message: 'List of all guide requests',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error',
        });
    }
};
