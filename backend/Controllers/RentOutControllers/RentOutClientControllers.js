import ClientModel from '../../Models/ClientModel.js'
import UserModel from '../../Models/UserModel.js'
import { validationResult } from 'express-validator'
import { getAsync, setAsync } from '../../Services/redisClient.js'; // Импорт методов Redis
import mongoose from 'mongoose'

function parsePrice(priceString) {
    return parseFloat(priceString.replace(/[^\d.-]/g, ''));
}

export const createClientRent = async (req, res) => {
    try {
        console.log('Hi')
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Validation failed'
            });
        }

        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({
                error: 'User ID not specified'
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const { name, description, region, price, sportCategory, imageUrl } = req.body;
        if (!name || !region || !price || !description || !imageUrl || !sportCategory) {
            return res.status(400).json({
                error: 'Missing required fields: name, region, price, sport category or imageURL'
            });
        }

        const parsedPrice = parsePrice(price);
        if (isNaN(parsedPrice)) {
            return res.status(400).json({
                error: 'Invalid price format. Price must be a valid number.'
            });
        }
 
        const newClient = new ClientModel({
            name: name,
            description: description,
            region: region,
            price: parsedPrice,
            sportCategory: sportCategory,
            imageUrl: imageUrl,
            creator: userId,
        });
        console.log('newClient', newClient)
        const client = await newClient.save();

        user.applicantsListings.client.push({
            client: client._id,
            applicants: []
        });

        await user.save();

        return res.status(201).json({
            client,
            message: 'Client successfully rented out'
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

// Показать сданного в аренду клиента
export const showRentedOutMyClient = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'User ID not specified'
            });
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const rentedClient = user.clientListings;

        if (!rentedClient || rentedClient.length === 0) {
            return res.status(200).json({
                foundClients: [],
                message: 'No client rented out'
            });
        }

        const client = await Promise.all(
            rentedClient.map(async (clientItem) => {
                return await ClientModel.findById(clientItem.client);
            })
        );

        return res.status(200).json({
            foundClients: client,
            message: 'Your rented client'
        });
    } catch (error) {
        console.error('Error fetching rented client:', error);
        return res.status(500).json({
            error: 'Server error'
        });
    }
};

export const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id, 'id');
        console.log('Bye');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid client ID',
            });
        }

        const client = await ClientModel.findById(id);

        if (!client) {
            return res.status(404).json({
                error: 'Client not found',
            });
        }

        return res.status(200).json({
            client,
            message: 'Client found successfully',
        });
    } catch (error) {
        console.error('Error fetching client by ID:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.',
        });
    }
};

export const getAllClients = async (req, res) => {
    try {
        const allClients = await ClientModel.find();

        if (allClients.length === 0) {
            return res.status(404).json({
                message: 'No clients found',
            });
        }

        return res.status(200).json({
            clients: allClients,
            message: 'List of all clients',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error',
        });
    }
};

// Получить мои листинги клиентов
export const getMyClientListings = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({
                error: 'User ID not specified'
            });
        }

        const cachedData = await getAsync(userId);

        if (cachedData) {
            return res.status(200).json({
                clients: JSON.parse(cachedData),
                message: 'Your client listings (from cache)'
            });
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const myClientListings = user.clientListings;

        const clients = await Promise.all(
            myClientListings.map(async (clientItem) => {
                return await ClientModel.findById(clientItem.client);
            })
        );

        return res.status(200).json({
            clients,
            message: 'Your client listings'
        });
    } catch (error) {
        console.error('Error fetching client listings:', error); 
        return res.status(500).json({
            error: 'Server error'
        });
    }
};

export const deleteRentedOutMyClient = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'User ID not specified'
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid client ID'
            });
        }

        const clientId = new mongoose.Types.ObjectId(id);

        const findClient = await ClientModel.findById(clientId);

        if (!findClient) {
            return res.status(404).json({
                error: 'Client not found'
            });
        }

        const findUser = await UserModel.findById(userId);

        if (!findUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const clientExists = findUser.clientListings.some(
            (listing) => listing.client.equals(clientId)
        );

        if (!clientExists) {
            return res.status(404).json({
                error: 'Client does not exist in user list'
            });
        }

        findUser.clientListings = findUser.clientListings.filter(
            (rentedClient) => !rentedClient.client.equals(clientId)
        );

        findUser.rentalHistory = findUser.rentalHistory.filter(
            (rental) => !rental.client.equals(clientId)
        );

        await findUser.save();

        await ClientModel.findByIdAndDelete(clientId);

        res.status(200).json({
            removedId: id,
            message: 'Client successfully removed and references deleted from other users'
        });
    } catch (error) {
        console.error('Error in deleting client:', error);
        return res.status(500).json({
            error: 'Server error: ' + error.message
        });
    }
};


// import ClientModel from '../Models/ClientModel.js'
// import UserModel from '../Models/UserModel.js'
// import { validationResult } from 'express-validator'
// import { getAsync, setAsync } from '../Services/redisClient.js'; // Импорт методов Redis
// import mongoose from 'mongoose'

// export const rentOutMyClient = async (req, res) => {
//     try {
//         const errors = validationResult(req);

//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 errors: errors.array()
//             });
//         }

//         const userId = req.userId;

//         if (!userId) {
//             return res.status(400).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const user = await UserModel.findById(userId);

//         if (!user) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         const { name, region, price, imageUrl } = req.body;

//         // Проверка на наличие всех необходимых полей
//         if (!name || !region || !price || !imageUrl) {
//             return res.status(400).json({
//                 error: 'Missing required fields: name, region, price, or imageURL'
//             });
//         }

//         const newClient = new ClientModel({
//             _id: new mongoose.Types.ObjectId(),
//             name: req.body.name,
//             description: req.body.description,
//             region: req.body.region,
//             email: req.body.email,
//             imageUrl: req.body.imageUrl,
//             creator: userId,
//         });

//         const client = await newClient.save();

//         user.clientListings.push(client._id);

//         await user.save();

//         return res.status(201).json({
//             client,
//             message: 'Client successfully rented out'
//         });
//     } catch (error) {
//         console.error(error); // Логируем ошибку для отладки
//         return res.status(500).json({
//             error: 'Server error'
//         });
//     }
// };

// export const showRentedOutMyClient = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const findUser = await UserModel.findById(userId)
//             .populate({
//                 path: 'clientListings',
//                 model: 'Client'
//             })
//             .populate({
//                 path: 'myRendedClient.client',
//                 model: 'Client'
//             })
//             .populate({
//                 path: 'myRendedClient.rentedBy',
//                 model: 'User'
//             });

//         if (!findUser) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         // Проверяем наличие clientListings
//         const foundClients = findUser.clientListings;

//         if (!foundClients || foundClients.length === 0) {
//             return res.status(200).json({
//                 foundClients: [],
//                 message: 'No client found'
//             });
//         }

//         res.status(200).json({
//             foundClients,
//             message: 'Your client'
//         });
//     } catch (error) {
//         console.error(error); // Логируем ошибку для отладки
//         return res.status(500).json({
//             error: 'Server error'
//         });
//     }
// };

// export const getAllClients = async (req, res) => {
//     try {
//         const cacheKey = 'all_clients';
//         const cachedData = await getAsync(cacheKey);

//         if (cachedData) {
//             return res.status(200).json({
//                 clients: JSON.parse(cachedData),
//                 message: 'List of all clients (from cache)',
//             });
//         }

//         const allClients = await ClientModel.find();

//         if (allClients.length === 0) {
//             return res.status(404).json({
//                 message: 'No clients found',
//             });
//         }

//         await setAsync(cacheKey, JSON.stringify(allClients), 'EX', 1800);

//         return res.status(200).json({
//             clients: allClients,
//             message: 'List of all clients',
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             error: 'Server error',
//         });
//     }
// };

// export const getMyClientListings = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(400).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const user = await UserModel.findById(userId).populate('clientListings');

//         if (!user) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         const myClientListings = user.clientListings;

//         return res.status(200).json({
//             clients: myClientListings,
//             message: 'Your client listings'
//         });
//     } catch (error) {
//         console.error(error); // Логируем ошибку для отладки
//         return res.status(500).json({
//             error: 'Server error'
//         });
//     }
// };

// export const deleteRentedOutMyClient = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const { id } = req.params;

//         const findClient = await ClientModel.findById(id);

//         if (!findClient) {
//             return res.status(404).json({
//                 error: 'Client not found'
//             });
//         }

//         const findUser = await UserModel.findById(userId);

//         if (!findUser) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         // Поиск индекса клиента в массиве clientListings
//         const productIndex = findUser.clientListings.indexOf(id);

//         if (productIndex === -1) {
//             return res.status(404).json({
//                 error: 'Client does not exist in user list'
//             });
//         }

//         // Удаление записи об аренде клиента из myRendedClient
//         findUser.myRendedClient = findUser.myRendedClient.filter(
//             (rentedClient) => String(rentedClient.client) !== String(id)
//         );

//         // Удаление клиента из clientListings
//         findUser.clientListings.splice(productIndex, 1);

//         // Сохранение изменений в пользователе
//         await findUser.save();

//         // Удаление информации о клиенте у всех других пользователей
//         await UserModel.updateMany(
//             { 
//                 $or: [
//                     { 'myRendedClient.client': id },
//                 ]
//             },
//             {
//                 $pull: {
//                     myRendedClient: { client: id },
//                     rentalHistory: { client: id }
//                 }
//             }
//         );

//         // Удаление клиента из базы данных
//         await ClientModel.findByIdAndDelete(id);

//         res.status(200).json({
//             removedId: id,
//             message: 'Client successfully removed and references deleted from other users'
//         });
//     } catch (error) {
//         return res.status(500).json({
//             error: error.message
//         });
//     }
// };

