import GuideModel from '../../Models/GuideModel.js'; // Импорт модели гида

export const searchGuideByName = async (req, res) => {
    try {
        const { namePrefix } = req.params; // Получаем начальные символы имени гида из запроса

        // Проверяем, что передан параметр namePrefix
        if (!namePrefix || namePrefix.length === 0) {
            return res.status(400).json({
                error: 'Name prefix is required'
            });
        }

        // Создаем регулярное выражение для поиска по начальным символам (без учета регистра)
        const regex = new RegExp(`^${namePrefix}`, 'i');

        // Ищем гида, имя которого начинается с указанных символов
        const guides = await GuideModel.find({ name: regex });

        // Если не найдено подходящих гидов
        if (guides.length === 0) {
            return res.status(200).json({
                message: 'No guides found matching the given name prefix'
            });
        }

        // Возвращаем найденных гидов
        res.status(200).json({
            message: 'Guides fetched successfully',
            guides
        });
    } catch (error) {
        console.error('Error fetching guides by name prefix:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};
