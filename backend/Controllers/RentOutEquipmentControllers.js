import EquipmentModel from '../Models/EquipmentModel.js'
import UserModel from '../Models/UserModel.js'
import { validationResult } from 'express-validator'
import { getAsync, setAsync } from '../Services/redisClient.js'; // Импорт методов Redis
import mongoose from 'mongoose'

function parsePrice(priceString) {
    return parseFloat(priceString.replace(/[^\d.-]/g, ''));
}

export const rentOutMyEquipment = async (req, res) => {
    try {
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

        const { name, region, price, imageUrl } = req.body;
        if (!name || !region || !price || !imageUrl) {
            return res.status(400).json({
                error: 'Missing required fields: name, region, price, or imageURL'
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
            region: region,
            price: parsedPrice,
            imageUrl: imageUrl,
            creator: userId,
        });

        const equipment = await newEquipment.save();

        user.equipmentListings.push({
            equipment: equipment._id,
            user: [{
                rentedBy: null,
                startDate: null,
                endDate: null
            }]
        });

        await user.save();

        // Обновляем кэш общего списка оборудования
        const allEquipmentKey = 'all_equipment';
        const cachedAllEquipment = await getAsync(allEquipmentKey);
        if (cachedAllEquipment) {
            const updatedAllEquipment = JSON.parse(cachedAllEquipment);
            updatedAllEquipment.push(equipment);
            await setAsync(allEquipmentKey, JSON.stringify(updatedAllEquipment), 1800);
        }

        // Обновляем кэш списка оборудования пользователя (все товары пользователя)
        const userEquipmentListingsKey = `user_${userId}_equipment_listings`;
        const cachedUserEquipmentListings = await getAsync(userEquipmentListingsKey);
        if (cachedUserEquipmentListings) {
            const updatedUserEquipmentListings = JSON.parse(cachedUserEquipmentListings);
            updatedUserEquipmentListings.push(equipment);
            await setAsync(userEquipmentListingsKey, JSON.stringify(updatedUserEquipmentListings), 1800);
        }

        // Обновляем кэш снаряжений, которые сданы в аренду (арендованные)
        const userRentedEquipmentKey = `user_${userId}_rented_equipment`;
        const cachedRentedEquipment = await getAsync(userRentedEquipmentKey);
        if (cachedRentedEquipment) {
            const updatedRentedEquipment = JSON.parse(cachedRentedEquipment);
            // Поскольку это новое оборудование еще не арендовано, добавлять его в кэш не нужно
        }

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

        const cacheKey = `user_${userId}_rented_equipment`;
        const cachedData = await getAsync(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                foundEquipments: JSON.parse(cachedData),
                message: 'Your rented equipment (from cache)'
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

        // Сохранение данных в кэш с указанием времени жизни (например, 30 минут)
        await setAsync(cacheKey, JSON.stringify(equipment), 1800);

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

        // const cacheKey = `equipment_${id}`;
        // const cachedEquipment = await getAsync(cacheKey);

        // if (cachedEquipment) {
        //     return res.status(200).json({
        //         equipment: JSON.parse(cachedEquipment),
        //         message: 'Equipment retrieved from cache',
        //     });
        // }

        const equipment = await EquipmentModel.findById(id);

        if (!equipment) {
            return res.status(404).json({
                error: 'Equipment not found',
            });
        }

        // Сохранение данных в Redis на 30 минут
        // await setAsync(cacheKey, JSON.stringify(equipment), 1800);

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

// Получить все оборудование
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

        // Попробуем получить данные из кэша
        const cacheKey = `user_${userId}_equipment_listings`;
        const cachedData = await getAsync(cacheKey);

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

        // Сохраняем в кэш на 30 минут
        await setAsync(cacheKey, JSON.stringify(equipment), 1800);

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

export const searchEquipmentByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({
                error: 'Name parameter is required for search',
            });
        }

        const cacheKey = `search_equipment_${name}`;
        const cachedEquipmentList = await getAsync(cacheKey);

        if (cachedEquipmentList) {
            return res.status(200).json({
                equipmentList: JSON.parse(cachedEquipmentList),
                message: 'Equipment retrieved from cache',
            });
        }

        const equipmentList = await EquipmentModel.find({
            name: { $regex: name, $options: 'i' }, // Поиск по имени, регистронезависимый
        });

        if (!equipmentList.length) {
            return res.status(404).json({
                message: 'No equipment found with this name',
            });
        }

        // Сохранение данных в Redis на 30 минут
        await setAsync(cacheKey, JSON.stringify(equipmentList), 1800);

        return res.status(200).json({
            equipmentList,
            message: 'Equipment found matching the name',
        });
    } catch (error) {
        console.error('Error searching equipment by name:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.',
        });
    }
};

export const filterAndSearchEquipment = async (req, res) => {
    try {
        const { name, creator, region, minPrice, maxPrice } = req.query;

        // Создаем ключ для кэша, основываясь на переданных фильтрах
        const cacheKey = `filter_search_equipment_${name || 'all'}_${creator || ''}_${region || ''}_${minPrice || ''}_${maxPrice || ''}`;
        const cachedEquipmentList = await getAsync(cacheKey);

        if (cachedEquipmentList) {
            return res.status(200).json({
                equipmentList: JSON.parse(cachedEquipmentList),
                message: 'Filtered and searched equipment retrieved from cache',
            });
        }

        // Формируем условия для поиска
        const searchQuery = {};

        // Если указан запрос на имя, добавляем его в условия поиска
        if (name) {
            searchQuery.name = { $regex: name, $options: 'i' }; // Регистронезависимый поиск по имени
        }

        // Выполняем первичный поиск по имени (если указан)
        let equipmentList = await EquipmentModel.find(searchQuery);

        // Если запрос на имя пустой, ищем все товары
        if (!name) {
            equipmentList = await EquipmentModel.find();
        }

        // Если товары найдены, применяем фильтры

        // Фильтрация по имени создателя (если указано)
        if (creator) {
            const creatorUser = await UserModel.findOne({ name: { $regex: creator, $options: 'i' } });
            if (creatorUser) {
                equipmentList = equipmentList.filter((equipment) => equipment.creator.equals(creatorUser._id));
            } else {
                return res.status(404).json({
                    message: 'No equipment found for this creator',
                });
            }
        }

        // Фильтрация по региону (если указан)
        if (region) {
            equipmentList = equipmentList.filter((equipment) =>
                equipment.region.match(new RegExp(region, 'i'))
            );
        }

        // Фильтрация по цене (если указаны минимальная и/или максимальная цена)
        if (minPrice || maxPrice) {
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Infinity;

            equipmentList = equipmentList.filter((equipment) =>
                equipment.price >= min && equipment.price <= max
            );
        }

        // Если нет подходящих товаров после фильтрации
        if (!equipmentList.length) {
            return res.status(404).json({
                message: 'No equipment found matching the filter criteria',
            });
        }

        // Сохраняем результат фильтрации в кэш Redis на 30 минут
        await setAsync(cacheKey, JSON.stringify(equipmentList), 1800);

        return res.status(200).json({
            equipmentList,
            message: 'Filtered and searched equipment retrieved successfully',
        });
    } catch (error) {
        console.error('Error filtering and searching equipment:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.',
        });
    }
};

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
        const allEquipmentKey = 'all_equipment';
        const cachedAllEquipment = await getAsync(allEquipmentKey);
        if (cachedAllEquipment) {
            const updatedAllEquipment = JSON.parse(cachedAllEquipment).filter(
                (item) => !item._id.equals(equipmentId)
            );
            await setAsync(allEquipmentKey, JSON.stringify(updatedAllEquipment), 1800);
        }

        // Обновляем кэш списка товаров пользователя
        const userEquipmentListingsKey = `user_${userId}_equipment_listings`;
        const cachedUserEquipmentListings = await getAsync(userEquipmentListingsKey);
        if (cachedUserEquipmentListings) {
            const updatedUserEquipmentListings = JSON.parse(cachedUserEquipmentListings).filter(
                (item) => !item._id.equals(equipmentId)
            );
            await setAsync(userEquipmentListingsKey, JSON.stringify(updatedUserEquipmentListings), 1800);
        }

        // Обновляем кэш арендованных товаров пользователя
        const userRentedEquipmentKey = `user_${userId}_rented_equipment`;
        const cachedRentedEquipment = await getAsync(userRentedEquipmentKey);
        if (cachedRentedEquipment) {
            const updatedRentedEquipment = JSON.parse(cachedRentedEquipment).filter(
                (item) => !item._id.equals(equipmentId)
            );
            await setAsync(userRentedEquipmentKey, JSON.stringify(updatedRentedEquipment), 1800);
        }

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


// import EquipmentModel from '../Models/EquipmentModel.js'
// import UserModel from '../Models/UserModel.js'
// import { validationResult } from 'express-validator'
// import { getAsync, setAsync } from '../Services/redisClient.js'; // Импорт методов Redis
// import mongoose from 'mongoose'

// function parsePrice(priceString) {
//     return parseFloat(priceString.replace(/[^\d.-]/g, ''));
// }

// export const sendRequestForRent = async (req, res) => {
//     try {
//         const { equipmentId, message } = req.body; // Получаем ID снаряжения и сообщение из запроса
//         const userId = req.userId; // ID текущего пользователя

//         // Проверка наличия необходимых данных
//         if (!equipmentId || !message || !userId) {
//             return res.status(400).json({
//                 error: 'Missing required fields: equipmentId, message, or userId'
//             });
//         }

//         // Проверка корректности ObjectId
//         if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
//             return res.status(400).json({
//                 error: 'Invalid equipment ID'
//             });
//         }

//         // Ищем оборудование напрямую через EquipmentModel
//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         // Находим владельца оборудования через модель пользователя
//         const owner = await UserModel.findById(equipment.creator);
//         if (!owner) {
//             return res.status(404).json({
//                 error: 'Owner of the equipment not found'
//             });
//         }

//         // Находим запись для этого оборудования в applicantsListings
//         const equipmentListing = owner.applicantsListings.equipment.find(listing =>
//             listing.equipment === equipmentId
//         );

//         if (!equipmentListing) {
//             return res.status(404).json({
//                 error: 'Equipment listing not found for this owner'
//             });
//         }

//         // Проверяем, не отправлял ли этот пользователь заявку ранее
//         const existingRequest = equipmentListing.applicants.find(app =>
//             app.applicant === userId
//         );

//         if (existingRequest) {
//             return res.status(400).json({
//                 error: 'You have already sent a request for this equipment'
//             });
//         }

//         // Добавляем заявку в массив applicants для данного оборудования
//         equipmentListing.applicants.push({
//             applicant: userId,
//             message: message
//         });

//         // Сохраняем изменения в владельце
//         await owner.save();

//         res.status(200).json({
//             message: 'Request for rent sent successfully',
//             applicants: equipmentListing.applicants
//         });
//     } catch (error) {
//         console.error('Error sending request for rent:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.'
//         });
//     }
// };

// export const approveToRent = async (req, res) => {
//     try {
//         const { equipmentId, applicantId } = req.body;
//         const userId = req.userId;

//         // Проверяем наличие необходимых полей
//         if (!userId || !equipmentId || !applicantId) {
//             return res.status(400).json({
//                 error: 'Missing required fields: userId, equipmentId, or applicantId'
//             });
//         }

//         // Ищем оборудование напрямую
//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         // Проверяем, что текущий пользователь является владельцем оборудования
//         if (!equipment.creator === userId) {
//             return res.status(403).json({
//                 error: 'You are not the owner of this equipment'
//             });
//         }

//         // Ищем заявку от нужного заявителя
//         const applicant = equipment.applicantsListings.equipment.find(app =>
//             app.applicants.some(ap => ap.applicant === applicantId)
//         );

//         if (!applicant) {
//             return res.status(404).json({
//                 error: 'Applicant not found for this equipment'
//             });
//         }

//         // Обновляем информацию об аренде, одобряем заявку
//         equipment.rentedBy = applicantId;
//         equipment.startDate = new Date();

//         // Удаляем заявку из списка заявок
//         equipment.applicantsListings.equipment = equipment.applicantsListings.equipment.filter(
//             app => !app.applicants.some(ap => ap.applicant.equals(applicantId))
//         );

//         // Сохраняем изменения
//         await equipment.save();

//         res.status(200).json({
//             message: 'Rental request approved and equipment rented out',
//             rentedBy: applicantId
//         });
//     } catch (error) {
//         console.error('Error approving rental request:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.'
//         });
//     }
// };

// export const dissaproveToRent = async (req, res) => {
//     try {
//         const { equipmentId, applicantId } = req.body;
//         const userId = req.userId;

//         // Проверяем наличие необходимых полей
//         if (!userId || !equipmentId || !applicantId) {
//             return res.status(400).json({
//                 error: 'Missing required fields: userId, equipmentId, or applicantId'
//             });
//         }

//         // Ищем оборудование напрямую
//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         // Проверяем, что текущий пользователь является владельцем оборудования
//         if (!equipment.creator === userId) {
//             return res.status(403).json({
//                 error: 'You are not the owner of this equipment'
//             });
//         }

//         // Ищем заявку от нужного заявителя
//         const applicant = equipment.applicantsListings.equipment.find(app =>
//             app.applicants.some(ap => ap.applicant.equals(applicantId))
//         );

//         if (!applicant) {
//             return res.status(404).json({
//                 error: 'Applicant not found for this equipment'
//             });
//         }

//         // Удаляем заявку из списка заявок
//         equipment.applicantsListings.equipment = equipment.applicantsListings.equipment.filter(
//             app => !app.applicants.some(ap => ap.applicant === applicantId)
//         );

//         // Сохраняем изменения
//         await equipment.save();

//         res.status(200).json({
//             message: 'Rental request disapproved and removed'
//         });
//     } catch (error) {
//         console.error('Error disapproving rental request:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.'
//         });
//     }
// };

// export const startEquipmentRent = async (req, res) => {
//     try {
//         const { equipmentId, rentedBy } = req.body; // Получаем ID оборудования и арендующего пользователя
//         const userId = req.userId;

//         // Проверяем наличие необходимых полей
//         if (!userId || !equipmentId || !rentedBy) {
//             return res.status(400).json({
//                 error: 'Missing required fields: userId, equipmentId, or rentedBy'
//             });
//         }

//         // Ищем оборудование напрямую по ID
//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         // Проверяем, что пользователь является владельцем оборудования
//         if (!equipment.creator === userId) {
//             return res.status(403).json({
//                 error: 'You are not the owner of this equipment'
//             });
//         }

//         // Проверяем, не арендовано ли оборудование
//         if (equipment.rentedBy && equipment.startDate) {
//             return res.status(400).json({
//                 error: 'Equipment is already rented'
//             });
//         }

//         // Устанавливаем дату начала аренды и арендующего пользователя
//         equipment.rentedBy = rentedBy;
//         equipment.startDate = new Date();

//         // Сохраняем изменения
//         await equipment.save();

//         res.status(200).json({
//             message: 'Equipment rent started successfully',
//             equipment
//         });
//     } catch (error) {
//         console.error('Error starting equipment rent:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.'
//         });
//     }
// };

// export const finishEquipmentRent = async (req, res) => {
//     try {
//         const { equipmentId } = req.body;
//         const userId = req.userId;

//         // Проверяем наличие необходимых полей
//         if (!userId || !equipmentId) {
//             return res.status(400).json({
//                 error: 'Missing required fields: userId or equipmentId'
//             });
//         }

//         // Ищем оборудование напрямую
//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         // Проверяем, что пользователь является владельцем оборудования
//         if (!equipment.creator.equals(userId)) {
//             return res.status(403).json({
//                 error: 'You are not the owner of this equipment'
//             });
//         }

//         // Проверяем, арендовано ли оборудование
//         if (!equipment.rentedBy || !equipment.startDate) {
//             return res.status(400).json({
//                 error: 'Equipment is not currently rented'
//             });
//         }

//         // Устанавливаем дату окончания аренды
//         equipment.endDate = new Date();

//         // Добавляем запись в историю аренды пользователя
//         const rentalRecord = {
//             equipment: equipment._id,
//             rentedBy: equipment.rentedBy,
//             startDate: equipment.startDate,
//             endDate: equipment.endDate
//         };

//         // Находим пользователя и добавляем историю аренды
//         await UserModel.findByIdAndUpdate(
//             equipment.rentedBy, // ID арендующего
//             { $push: { rentalHistory: rentalRecord } } // Добавляем запись об аренде
//         );

//         // Очищаем данные о текущей аренде
//         equipment.rentedBy = null;
//         equipment.startDate = null;
//         equipment.endDate = null;

//         // Сохраняем изменения
//         await equipment.save();

//         res.status(200).json({
//             message: 'Equipment rent finished successfully',
//             equipment
//         });
//     } catch (error) {
//         console.error('Error finishing equipment rent:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.'
//         });
//     }
// };

// export const rentOutMyEquipment = async (req, res) => {
//     try {
//         // Проверяем ошибки валидации (если используете express-validator)
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 errors: errors.array(),
//                 message: 'Validation failed'
//             });
//         }

//         const userId = req.userId;
//         if (!userId) {
//             return res.status(400).json({
//                 error: 'User ID not specified'
//             });
//         }

//         // Ищем пользователя по ID
//         const user = await UserModel.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         // Извлекаем данные из тела запроса
//         const { name, region, price, imageUrl } = req.body;

//         // Проверяем наличие всех необходимых полей
//         if (!name || !region || !price || !imageUrl) {
//             return res.status(400).json({
//                 error: 'Missing required fields: name, region, price, or imageURL'
//             });
//         }

//         // Преобразуем цену из строки в число
//         const parsedPrice = parsePrice(price);
//         if (isNaN(parsedPrice)) {
//             return res.status(400).json({
//                 error: 'Invalid price format. Price must be a valid number.'
//             });
//         }

//         // Создаем новый экземпляр модели Equipment
//         const newEquipment = new EquipmentModel({
//             name: name,
//             region: region,
//             price: parsedPrice,  // Преобразованная цена
//             imageUrl: imageUrl,
//             creator: userId,     // Ссылка на создателя оборудования (пользователя)
//         });
//         // console.log('newEquipment', newEquipment)
//         // Сохраняем оборудование в базе данных
//         const equipment = await newEquipment.save();

//         user.equipmentListings.push({
//             equipment: equipment._id,  // Добавляем ID оборудования
//             rentedBy: null,            // Можно оставить `null`, если оборудование пока не арендовано
//             startDate: null,           // Можно оставить `null`, если аренда не началась
//             endDate: null              // Можно оставить `null`, если аренда не завершена
//         });

//         await user.save();

//         // Возвращаем успешный ответ
//         return res.status(201).json({
//             equipment,
//             message: 'Equipment successfully rented out'
//         });

//     } catch (error) {
//         console.error('Server error:', error);
//         return res.status(500).json({
//             error: 'Server error. Please try again later.'
//         });
//     }
// };

// export const showRentedOutMyEquipment = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 error: 'User ID not specified'
//             });
//         }

//         // Поиск пользователя с использованием его ID
//         const user = await UserModel.findById(userId);
           
//         if (!user) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         // Проверяем, есть ли арендованное оборудование у пользователя
//         const rentedEquipment = user.equipmentListings;

//         if (!rentedEquipment || rentedEquipment.length === 0) {
//             return res.status(200).json({
//                 foundEquipments: [],
//                 message: 'No equipment rented out'
//             });
//         }

//         // Правильное использование асинхронных функций с `map`
//         const equipment = await Promise.all(
//             rentedEquipment.map(async (equip) => {
//                 return await EquipmentModel.findById(equip);
//             })
//         );

//         return res.status(200).json({
//             foundEquipments: equipment,
//             message: 'Your rented equipment'
//         });
//     } catch (error) {
//         console.error('Error fetching rented equipment:', error);
//         return res.status(500).json({
//             error: 'Server error'
//         });
//     }
// };

// export const getAllEquipment = async (req, res) => {
//     try {
//         const cacheKey = 'all_equipment';
//         const cachedData = await getAsync(cacheKey);

//         if (cachedData) {
//             return res.status(200).json({
//                 equipment: JSON.parse(cachedData),
//                 message: 'List of all equipment (from cache)',
//             });
//         }

//         const allEquipment = await EquipmentModel.find();

//         if (allEquipment.length === 0) {
//             return res.status(404).json({
//                 message: 'No equipment found',
//             });
//         }

//         await setAsync(cacheKey, JSON.stringify(allEquipment), 'EX', 1800);

//         return res.status(200).json({
//             equipment: allEquipment,
//             message: 'List of all equipment',
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             error: 'Server error',
//         });
//     }
// };

// export const getMyEquipmentListings = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(400).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const user = await UserModel.findById(userId)

//         if (!user) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         const myEquipmentListings = user.equipmentListings;

//         const equipment = await Promise.all(
//             myEquipmentListings.map(async (equip) => {
//                 return await EquipmentModel.findById(equip.equipment);
//             })
//         );

//         return res.status(200).json({
//             equipment,
//             message: 'Your equipment listings'
//         });
//     } catch (error) {
//         console.error(error); // Логируем ошибку для отладки
//         return res.status(500).json({
//             error: 'Server error'
//         });
//     }
// };

// export const deleteRentedOutMyEquipment = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const { id } = req.params;
//         console.log('Delete_id', id);

//         // Check if the provided id is a valid ObjectId
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({
//                 error: 'Invalid equipment ID'
//             });
//         }

//         const equipmentId = new mongoose.Types.ObjectId(id);

//         // Find the equipment by id
//         const findEquipment = await EquipmentModel.findById(equipmentId);

//         if (!findEquipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         // Find the user by userId
//         const findUser = await UserModel.findById(userId);

//         if (!findUser) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         // Check if the equipment exists in the user's listings
//         const equipmentExists = findUser.equipmentListings.some(
//             (listing) => listing.equipment.equals(equipmentId)
//         );

//         if (!equipmentExists) {
//             return res.status(404).json({
//                 error: 'Equipment does not exist in user list'
//             });
//         }

//         // Remove the equipment from user's equipmentListings
//         findUser.equipmentListings = findUser.equipmentListings.filter(
//             (rentedEquipment) => !rentedEquipment.equipment.equals(equipmentId)
//         );

//         // Optionally, remove from rentalHistory if necessary
//         findUser.rentalHistory = findUser.rentalHistory.filter(
//             (rental) => !rental.equipment.equals(equipmentId)
//         );

//         // Save the updated user information
//         await findUser.save();

//         // Remove the equipment from other users' equipmentListings
//         await UserModel.updateMany(
//             {
//                 'equipmentListings.equipment': equipmentId
//             },
//             {
//                 $pull: {
//                     equipmentListings: { equipment: equipmentId },
//                     rentalHistory: { equipment: equipmentId } // If needed
//                 }
//             }
//         );

//         // Finally, delete the equipment from the Equipment collection
//         await EquipmentModel.findByIdAndDelete(equipmentId);

//         res.status(200).json({
//             removedId: id,
//             message: 'Equipment successfully removed and references deleted from other users'
//         });
//     } catch (error) {
//         console.error('Error in deleting equipment:', error);
//         return res.status(500).json({
//             error: 'Server error: ' + error.message
//         });
//     }
// };