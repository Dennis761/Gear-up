import UserModel from '../../Models/UserModel.js'; // Модель пользователя, которая содержит информацию о пользователе

export const getUserRentalHistory = async (req, res) => {
    try {
        const userId = req.userId; // Получаем userId из запроса (предположим, что это аутентифицированный пользователь)

        // Проверяем, указан ли userId
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }

        // Ищем пользователя в базе данных
        const user = await UserModel.findById(userId);

        // Если пользователь не найден, возвращаем ошибку
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Извлекаем историю аренды пользователя
        const rentalHistory = user.rentalHistory;

        // Если истории аренды нет, возвращаем пустой массив
        if (!rentalHistory || rentalHistory.length === 0) {
            return res.status(200).json({
                message: 'No rental history found for this user',
                rentalHistory: []
            });
        }

        // Возвращаем историю аренды
        res.status(200).json({
            message: 'User rental history fetched successfully',
            rentalHistory
        });
    } catch (error) {
        console.error('Error fetching user rental history:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};
