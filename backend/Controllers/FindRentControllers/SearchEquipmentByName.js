import EquipmentModel from '../../Models/EquipmentModel.js'; // Импорт модели снаряжения

export const searchEquipmentByName = async (req, res) => {
    try {
        const { namePrefix } = req.params; // Получаем начальные символы названия снаряжения из запроса

        // Проверяем, что передан параметр namePrefix
        if (!namePrefix || namePrefix.length === 0) {
            return res.status(400).json({
                error: 'Name prefix is required'
            });
        }

        // Создаем регулярное выражение для поиска по начальным символам (без учета регистра)
        const regex = new RegExp(`^${namePrefix}`, 'i');

        // Ищем снаряжение, название которого начинается с указанных символов
        const equipment = await EquipmentModel.find({ name: regex });

        // Если не найдено подходящее снаряжение
        if (equipment.length === 0) {
            return res.status(200).json({
                message: 'No equipment found matching the given name prefix'
            });
        }

        // Возвращаем найденное снаряжение
        res.status(200).json({
            message: 'Equipment fetched successfully',
            equipment
        });
    } catch (error) {
        console.error('Error fetching equipment by name prefix:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};
