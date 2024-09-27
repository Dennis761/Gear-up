import GuideModel from '../Models/GuideModel.js'
import UserModel from '../Models/UserModel.js'
import { validationResult } from 'express-validator'
import mongoose from 'mongoose'
import { getAsync, setAsync } from '../Services/redisClient.js'; // Импорт методов Redis

export const rentOutMyGuide = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
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

        // Проверка на наличие всех необходимых полей
        if (!name || !region || !price || !imageUrl) {
            return res.status(400).json({
                error: 'Missing required fields: name, region, price, or imageURL'
            });
        }

        const newGuide = new GuideModel({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            region: req.body.region,
            experience: req.body.price,
            contact: req.body.contact,
            imageUrl: req.body.imageUrl,
            creator: userId,
        });

        const guide = await newGuide.save();

        user.guideListings.push(guide._id);

        await user.save();

        return res.status(201).json({
            guide,
            message: 'Guide successfully rented out'
        });
    } catch (error) {
        console.error(error); // Логируем ошибку для отладки
        return res.status(500).json({
            error: 'Server error'
        });
    }
};

export const showRentedOutMyGuide = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'User ID not specified'
            });
        }

        const findUser = await UserModel.findById(userId)
            .populate({
                path: 'guideListings',
                model: 'Guide'
            })
            .populate({
                path: 'myRendedGuide.guide',
                model: 'Guide'
            })
            .populate({
                path: 'myRendedGuide.rentedBy',
                model: 'User'
            });

        if (!findUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Проверяем наличие guideListings
        const foundGuides = findUser.guideListings;

        if (!foundGuides || foundGuides.length === 0) {
            return res.status(200).json({
                foundGuides: [],
                message: 'No guide found'
            });
        }

        res.status(200).json({
            foundGuides,
            message: 'Your guide'
        });
    } catch (error) {
        console.error(error); // Логируем ошибку для отладки
        return res.status(500).json({
            error: 'Server error'
        });
    }
};

export const getAllGuides = async (req, res) => {
    try {
        const cacheKey = 'all_guides';
        
        const cachedData = await getAsync(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                guides: JSON.parse(cachedData),
                message: 'List of all guides (from cache)',
            });
        }

        const allGuides = await GuideModel.find();

        if (allGuides.length === 0) {
            return res.status(404).json({
                message: 'No guide found',
            });
        }

        await setAsync(cacheKey, JSON.stringify(allGuides), 'EX', 3600);

        return res.status(200).json({
            guides: allGuides,
            message: 'List of all guides',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error',
        });
    }
};

export const getMyGuideListings = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({
                error: 'User ID not specified'
            });
        }

        const user = await UserModel.findById(userId).populate('guideListings');

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const myGuideListings = user.guideListings;

        return res.status(200).json({
            guides: myGuideListings,
            message: 'Your guide listings'
        });
    } catch (error) {
        console.error(error); // Логируем ошибку для отладки
        return res.status(500).json({
            error: 'Server error'
        });
    }
};

export const deleteRentedOutMyGuide = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'User ID not specified'
            });
        }

        const { id } = req.params;

        const findGuide = await GuideModel.findById(id);

        if (!findGuide) {
            return res.status(404).json({
                error: 'Guide not found'
            });
        }

        const findUser = await UserModel.findById(userId);

        if (!findUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Поиск индекса гида в массиве guideListings
        const productIndex = findUser.guideListings.indexOf(id);

        if (productIndex === -1) {
            return res.status(404).json({
                error: 'Guide does not exist in user list'
            });
        }

        // Удаление записи об аренде гида из myRendedGuide
        findUser.myRendedGuide = findUser.myRendedGuide.filter(
            (rentedGuide) => String(rentedGuide.guide) !== String(id)
        );

        // Удаление гида из guideListings
        findUser.guideListings.splice(productIndex, 1);

        // Сохранение изменений в пользователе
        await findUser.save();

        // Удаление информации о гиде у всех других пользователей
        await UserModel.updateMany(
            { 
                $or: [
                    { 'myRendedGuide.guide': id },
                ]
            },
            {
                $pull: {
                    myRendedGuide: { guide: id },
                    rentalHistory: { guide: id }
                }
            }
        );

        // Удаление гида из базы данных
        await GuideModel.findByIdAndDelete(id);

        res.status(200).json({
            removedId: id,
            message: 'Guide successfully removed and references deleted from other users'
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};



// import GuideModel from '../Models/GuideModel.js'
// import UserModel from '../Models/UserModel.js'
// import { validationResult } from 'express-validator'
// import mongoose from 'mongoose'

// export const BecomeAGuide = async (req, res) => {
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

//         const newGuide = new GuideModel({
//             _id: new mongoose.Types.ObjectId(),
//             name: req.body.name,
//             region: req.body.region,
//             experience: req.body.price,
//             contact: req.body.contact,
//             imageUrl: req.body.,
//             creator: userId,
//         });

//         const guide = await newGuide.save();

//         user.guideListings.push(guide._id);

//         await user.save();

//         return res.status(201).json(guide);
//     } catch (error) {
//         return res.status(500).json({
//             error: error.message
//         });
//     }
// };

// export const ShowGuides = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const findUser = await UserModel.findById(userId);
        
//         if (!findUser) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         const findGuidePromises = findUser.guideListings.map( id => GuideModel.findById(id));

//         if(!findGuidePromises){
//             return res.status(404).json({
//                 error: 'Guide not found'
//             });
//         }

//         const guides = await Promise.all(findGuidePromises);

//         res.status(200).json({
//             guides,
//             message: 'Your guides suggestion'
//         });
//     } catch (error) {
//         return res.status(500).json({
//             error: 'Server not found'
//         });
//     }
// }

// export const DeleteGuide = async (req, res) => {
//     try {
//         const userId = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 error: 'User ID not specified'
//             });
//         }

//         const { id } = req.params;

//         const findGuide = await GuideModel.findById(id);

//         if (!findGuide) {
//             return res.status(404).json({
//                 error: 'Guide not found'
//             });
//         }

//         const findUser = await UserModel.findById(userId);

//         if (!findUser) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         const productIndex = findUser.guideListings.indexOf(id);

//         if (productIndex === -1) {
//             return res.status(404).json({
//                 error: 'Guide does not exist in user products'
//             });
//         }
 
//         // await UserModel.updateMany(
//         //     { "rated.product": id },
//         //     { $pull: { rated: { product: id } } });

//         // await UserModel.updateMany(
//         //     { "saved.product": id }, 
//         //     { $pull: { saved: { product: id } } });

//         findUser.guideListings.splice(productIndex, 1);

//         await findUser.save();

//         await GuideModel.findByIdAndDelete(id);

//         res.status(200).json({
//             removedId: id,
//             message: 'Guide successfully removed'
//         });
//     } catch (error) {
//         return res.status(500).json({
//             error: error.message
//         });
//     }
// };