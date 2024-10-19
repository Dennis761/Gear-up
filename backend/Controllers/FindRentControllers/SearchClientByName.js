import ClientModel from '../../Models/ClientModel.js'; // Импорт модели клиента

export const searchClientByName = async (req, res) => {
    try {
        const { namePrefix } = req.params; // Получаем начальные символы имени клиента из запроса

        // Проверяем, что передан параметр namePrefix
        if (!namePrefix || namePrefix.length === 0) {
            return res.status(400).json({
                error: 'Name prefix is required'
            });
        }

        // Создаем регулярное выражение для поиска по начальным символам (без учета регистра)
        const regex = new RegExp(`^${namePrefix}`, 'i');

        // Ищем клиента, имя которого начинается с указанных символов
        const clients = await ClientModel.find({ name: regex });

        // Если не найдено подходящих клиентов
        if (clients.length === 0) {
            return res.status(200).json({
                message: 'No clients found matching the given name prefix'
            });
        }

        // Возвращаем найденных клиентов
        res.status(200).json({
            message: 'Clients fetched successfully',
            clients
        });
    } catch (error) {
        console.error('Error fetching clients by name prefix:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};
