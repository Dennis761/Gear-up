import EquipmentModel from '../../Models/EquipmentModel.js'
import UserModel from '../../Models/UserModel.js'
import { validationResult } from 'express-validator'
import { getAsync, setAsync } from '../../Services/redisClient.js'; // Импорт методов Redis
import mongoose from 'mongoose'

function parsePrice(priceString) {
    return parseFloat(priceString.replace(/[^\d.-]/g, ''));
}

export const createEquipmentRent = async (req, res) => {
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

        const newEquipment = new EquipmentModel({
            name: name,
            description: description,
            region: region,
            price: parsedPrice,
            sportCategory: sportCategory,
            imageUrl: imageUrl,
            creator: userId,
        });
        console.log('newEquipment', newEquipment)
        const equipment = await newEquipment.save();

        user.applicantsListings.equipment.push({
            equipment: equipment._id,
            applicants: []
        })
        
        await user.save();

        return res.status(201).json({
            equipment,
            message: 'Equipment successfully rented out'
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

// Показать сданное в аренду оборудование
export const showRentedOutMyEquipment = async (req, res) => {
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

        const rentedEquipment = user.equipmentListings;

        if (!rentedEquipment || rentedEquipment.length === 0) {
            return res.status(200).json({
                foundEquipments: [],
                message: 'No equipment rented out'
            });
        }

        const equipment = await Promise.all(
            rentedEquipment.map(async (equip) => {
                return await EquipmentModel.findById(equip.equipment);
            })
        );

        return res.status(200).json({
            foundEquipments: equipment,
            message: 'Your rented equipment'
        });
    } catch (error) {
        console.error('Error fetching rented equipment:', error);
        return res.status(500).json({
            error: 'Server error'
        });
    }
};

export const getEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id, 'id')
        console.log('Bye')
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid equipment ID3',
            });
        }

        const equipment = await EquipmentModel.findById(id);

        if (!equipment) {
            return res.status(404).json({
                error: 'Equipment not found',
            });
        }

        return res.status(200).json({
            equipment,
            message: 'Equipment found successfully',
        });
    } catch (error) {
        console.error('Error fetching equipment by ID:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.',
        });
    }
};

export const getAllEquipment = async (req, res) => {
    try {
        const allEquipment = await EquipmentModel.find();

        if (allEquipment.length === 0) {
            return res.status(404).json({
                message: 'No equipment found',
            });
        }

        return res.status(200).json({
            equipment: allEquipment,
            message: 'List of all equipment',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error',
        });
    }
};

// Получить мои листинги оборудования
export const getMyEquipmentListings = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({
                error: 'User ID not specified'
            });
        }

        if (cachedData) {
            return res.status(200).json({
                equipment: JSON.parse(cachedData),
                message: 'Your equipment listings (from cache)'
            });
        }

        // Если в кэше нет данных, получаем их из базы данных
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const myEquipmentListings = user.equipmentListings;

        const equipment = await Promise.all(
            myEquipmentListings.map(async (equip) => {
                return await EquipmentModel.findById(equip.equipment);
            })
        );

        return res.status(200).json({
            equipment,
            message: 'Your equipment listings'
        });
    } catch (error) {
        console.error('Error fetching equipment listings:', error); 
        return res.status(500).json({
            error: 'Server error'
        });
    }
};

// export const searchEquipmentByName = async (req, res) => {
//     try {
//         const { name } = req.query;

//         if (!name) {
//             return res.status(400).json({
//                 error: 'Name parameter is required for search',
//             });
//         }

//         const equipmentList = await EquipmentModel.find({
//             name: { $regex: name, $options: 'i' }, // Поиск по имени, регистронезависимый
//         });

//         if (!equipmentList.length) {
//             return res.status(404).json({
//                 message: 'No equipment found with this name',
//             });
//         }

//         return res.status(200).json({
//             equipmentList,
//             message: 'Equipment found matching the name',
//         });
//     } catch (error) {
//         console.error('Error searching equipment by name:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.',
//         });
//     }
// };

// export const filterAndSearchEquipment = async (req, res) => {
//     try {
//         const { name, creator, region, minPrice, maxPrice } = req.query;

//         // Создаем ключ для кэша, основываясь на переданных фильтрах
//         const cacheKey = `filter_search_equipment_${name || 'all'}_${creator || ''}_${region || ''}_${minPrice || ''}_${maxPrice || ''}`;
//         const cachedEquipmentList = await getAsync(cacheKey);

//         if (cachedEquipmentList) {
//             return res.status(200).json({
//                 equipmentList: JSON.parse(cachedEquipmentList),
//                 message: 'Filtered and searched equipment retrieved from cache',
//             });
//         }

//         // Формируем условия для поиска
//         const searchQuery = {};

//         // Если указан запрос на имя, добавляем его в условия поиска
//         if (name) {
//             searchQuery.name = { $regex: name, $options: 'i' }; // Регистронезависимый поиск по имени
//         }

//         // Выполняем первичный поиск по имени (если указан)
//         let equipmentList = await EquipmentModel.find(searchQuery);

//         // Если запрос на имя пустой, ищем все товары
//         if (!name) {
//             equipmentList = await EquipmentModel.find();
//         }

//         // Если товары найдены, применяем фильтры

//         // Фильтрация по имени создателя (если указано)
//         if (creator) {
//             const creatorUser = await UserModel.findOne({ name: { $regex: creator, $options: 'i' } });
//             if (creatorUser) {
//                 equipmentList = equipmentList.filter((equipment) => equipment.creator.equals(creatorUser._id));
//             } else {
//                 return res.status(404).json({
//                     message: 'No equipment found for this creator',
//                 });
//             }
//         }

//         // Фильтрация по региону (если указан)
//         if (region) {
//             equipmentList = equipmentList.filter((equipment) =>
//                 equipment.region.match(new RegExp(region, 'i'))
//             );
//         }

//         // Фильтрация по цене (если указаны минимальная и/или максимальная цена)
//         if (minPrice || maxPrice) {
//             const min = minPrice ? parseFloat(minPrice) : 0;
//             const max = maxPrice ? parseFloat(maxPrice) : Infinity;

//             equipmentList = equipmentList.filter((equipment) =>
//                 equipment.price >= min && equipment.price <= max
//             );
//         }

//         // Если нет подходящих товаров после фильтрации
//         if (!equipmentList.length) {
//             return res.status(404).json({
//                 message: 'No equipment found matching the filter criteria',
//             });
//         }

//         // Сохраняем результат фильтрации в кэш Redis на 30 минут
//         await setAsync(cacheKey, JSON.stringify(equipmentList), 1800);

//         return res.status(200).json({
//             equipmentList,
//             message: 'Filtered and searched equipment retrieved successfully',
//         });
//     } catch (error) {
//         console.error('Error filtering and searching equipment:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.',
//         });
//     }
// };

// Удалить сданное в аренду оборудование

export const deleteRentedOutMyEquipment = async (req, res) => {
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
                error: 'Invalid equipment ID2'
            });
        }

        const equipmentId = new mongoose.Types.ObjectId(id);

        const findEquipment = await EquipmentModel.findById(equipmentId);

        if (!findEquipment) {
            return res.status(404).json({
                error: 'Equipment not found'
            });
        }

        const findUser = await UserModel.findById(userId);

        if (!findUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const equipmentExists = findUser.equipmentListings.some(
            (listing) => listing.equipment.equals(equipmentId)
        );

        if (!equipmentExists) {
            return res.status(404).json({
                error: 'Equipment does not exist in user list'
            });
        }

        findUser.equipmentListings = findUser.equipmentListings.filter(
            (rentedEquipment) => !rentedEquipment.equipment.equals(equipmentId)
        );

        findUser.rentalHistory = findUser.rentalHistory.filter(
            (rental) => !rental.equipment.equals(equipmentId)
        );

        await findUser.save();

        await EquipmentModel.findByIdAndDelete(equipmentId);

        // Обновляем кэш общего списка товаров
       
        res.status(200).json({
            removedId: id,
            message: 'Equipment successfully removed and references deleted from other users'
        });
    } catch (error) {
        console.error('Error in deleting equipment:', error);
        return res.status(500).json({
            error: 'Server error: ' + error.message
        });
    }
};

