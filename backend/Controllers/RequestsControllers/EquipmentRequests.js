import mongoose from 'mongoose';
import EquipmentModel from '../../Models/EquipmentModel.js';
import UserModel from '../../Models/UserModel.js';
import moment from 'moment-timezone';

export const sendRequestForRent = async (req, res) => {
    try {
        const { equipmentId, message } = req.body;
        const userId = req.userId;
        console.log('1:', equipmentId)
        console.log(message)
        console.log(userId)
        // Проверка на наличие всех необходимых полей
        if (!equipmentId || !message || !userId) {
            return res.status(400).json({
                error: 'Missing required fields: equipmentId, message, or userId'
            });
        }
        console.log(mongoose.Types.ObjectId.isValid(equipmentId))
        // Проверка валидности идентификатора оборудования
        if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
            return res.status(400).json({
                error: 'Invalid equipment ID'
            });
        }

        // Преобразуем userId и equipmentId к ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const equipmentObjectId = new mongoose.Types.ObjectId(equipmentId);

        // Поиск оборудования по идентификатору
        const equipment = await EquipmentModel.findById(equipmentObjectId);
        if (!equipment) {
            return res.status(404).json({
                error: 'Equipment not found'
            });
        }

        // Поиск владельца оборудования
        const owner = await UserModel.findById(equipment.creator);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the equipment not found'
            });
        }

        // Ищем запись о снаряжении у владельца
        let equipmentListing = owner.applicantsListings.equipment.find(listing =>
            listing.equipment.equals(equipmentObjectId)
        );

        if (!equipmentListing) {
            // Если записи о снаряжении нет, создаём новую запись с заявкой
            equipmentListing = {
                equipment: equipmentObjectId,
                applicants: [{
                    applicant: userObjectId,
                    message
                }]
            };
            owner.applicantsListings.equipment.push(equipmentListing);
        } else {
            // Если запись о снаряжении найдена, проверяем, есть ли заявка от пользователя
            const existingApplicant = equipmentListing.applicants.find(app =>
                app.applicant.equals(userObjectId)
            );

            console.log(existingApplicant)
            if (existingApplicant) {
                // Если заявка от пользователя уже существует, возвращаем ошибку
                return res.status(400).json({
                    error: 'You have already sent a request for this equipment'
                });
            }

            // Добавляем нового заявителя, если заявки от этого пользователя нет
            equipmentListing.applicants.push({
                applicant: userObjectId,
                message
            });
        }

        // Сохраняем изменения
        await owner.save();

        res.status(200).json({
            message: 'Request for rent sent successfully',
            applicants: equipmentListing.applicants
        });
    } catch (error) {
        console.error('Error sending request for rent:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};


// Одобрить заявку на аренду
export const approveToRent = async (req, res) => {
    try {
        const { equipmentId, applicantId } = req.body;
        const userId = req.userId; 

        if (!userId || !equipmentId || !applicantId) {
            return res.status(400).json({
                error: 'Missing required fields: userId, equipmentId, or applicantId'
            });
        }

        const equipment = await EquipmentModel.findById(equipmentId);
        if (!equipment) {
            return res.status(404).json({
                error: 'Equipment not found'
            });
        }

        if (!equipment.creator.equals(userId)) {
            return res.status(403).json({
                error: 'You are not the owner of this equipment'
            });
        }

        const owner = await UserModel.findById(equipment.creator);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the equipment not found'
            });
        }

        const equipmentListing = owner.applicantsListings.equipment.find(listing =>
            listing.equipment.equals(equipmentId)
        );

        if (!equipmentListing) {
            return res.status(404).json({
                error: 'Equipment listing not found for this owner'
            });
        }

        const applicant = equipmentListing.applicants.find(app =>
            app.applicant.equals(applicantId)
        );

        if (!applicant) {
            return res.status(404).json({
                error: 'Applicant not found for this equipment'
            });
        }

        // Устанавливаем статус заявки на 'approved'
        applicant.status = 'approved';

        // Сохраняем изменения в базе данных
        await owner.save();

        res.status(200).json({
            message: 'Applicant approved successfully'
        });
    } catch (error) {
        console.error('Error approving applicant:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

// Отклонить заявку на аренду
export const dissaproveToRent = async (req, res) => {
    try {
        const { equipmentId, applicantId } = req.body;
        const userId = req.userId;

        if (!userId || !equipmentId || !applicantId) {
            return res.status(400).json({
                error: 'Missing required fields: userId, equipmentId, or applicantId'
            });
        }

        const equipment = await EquipmentModel.findById(equipmentId);
        if (!equipment) {
            return res.status(404).json({
                error: 'Equipment not found'
            });
        }

        if (!equipment.creator.equals(userId)) {
            return res.status(403).json({
                error: 'You are not the owner of this equipment'
            });
        }

        const owner = await UserModel.findById(equipment.creator);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the equipment not found'
            });
        }

        const equipmentListing = owner.applicantsListings.equipment.find(listing =>
            listing.equipment.equals(equipmentId)
        );

        if (!equipmentListing) {
            return res.status(404).json({
                error: 'Equipment listing not found for this owner'
            });
        }

        // Удаляем заявку из списка заявок
        equipmentListing.applicants = equipmentListing.applicants.filter(app =>
            !app.applicant.equals(applicantId)
        );

        await owner.save();

        res.status(200).json({
            message: 'Rental request disapproved and removed'
        });
    } catch (error) {
        console.error('Error disapproving rental request:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

// Начать аренду оборудования
export const startEquipmentRent = async (req, res) => {
    try {
        const { equipmentId, applicantId } = req.body;
        console.log('applicantId:', applicantId);
        const userId = req.userId;

        if (!userId || !equipmentId || !applicantId) {
            return res.status(400).json({
                error: 'Missing required fields: userId, equipmentId, or applicantId'
            });
        }

        const equipment = await EquipmentModel.findById(equipmentId);
        if (!equipment) {
            return res.status(404).json({
                error: 'Equipment not found'
            });
        }

        if (!equipment.creator.equals(userId)) {
            return res.status(403).json({
                error: 'You are not the owner of this equipment'
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        let currentEquipmentIndex;
        let currentApplicantIndex;
        let applicantExists = false;

        // Iterate over the rental info in equipment applicantsListings
        user?.applicantsListings?.equipment?.some((rentInfo, equipmentIndex) => {
            return rentInfo.applicants?.some((applicant, applicantIndex) => {
                console.log('Checking applicant:', applicant?.applicant, applicantId);
                if (applicant?.applicant.equals(applicantId)) {
                    currentEquipmentIndex = equipmentIndex;
                    currentApplicantIndex = applicantIndex;
                    applicantExists = true;
                    return true; // Stop searching once we find the applicant
                }
                return false;
            });
        });

        if (!applicantExists) {
            return res.status(403).json({
                error: 'Applicant ID is not in request database'
            });
        }

        // Update the start date for the applicant (convert to Kyiv timezone)
        const startDateUTC = new Date();
        const startDateKyiv = moment(startDateUTC).tz('Europe/Kyiv').toDate();

        // Access the specific equipment and applicant
        user.applicantsListings.equipment[currentEquipmentIndex].applicants[currentApplicantIndex].startDate = startDateKyiv;

        await user.save();

        res.status(200).json({
            message: 'Equipment rent started successfully',
            // equipment,
            startDateKyiv
        });
    } catch (error) {
        console.error('Error starting equipment rent:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

export const finishEquipmentRent = async (req, res) => {
    try {
        const { equipmentId, applicantId } = req.body;
        const userId = req.userId;

        if (!userId || !equipmentId || !applicantId) {
            return res.status(400).json({
                error: 'Missing required fields: userId, equipmentId, or applicantId'
            });
        }

        // Fetch the equipment
        const equipment = await EquipmentModel.findById(equipmentId);
        if (!equipment) {
            return res.status(404).json({
                error: 'Equipment not found'
            });
        }

        // Verify ownership
        if (!equipment.creator.equals(userId)) {
            return res.status(403).json({
                error: 'You are not the owner of this equipment'
            });
        }

        // Fetch the user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Iterate over the rental info in equipment applicantsListings
        let currentEquipmentIndex;
        let currentApplicantIndex;
        let applicantExists = false;

        user?.applicantsListings?.equipment?.some((rentInfo, equipmentIndex) => {
            return rentInfo.applicants?.some((applicant, applicantIndex) => {
                if (applicant?.applicant.equals(applicantId)) {
                    currentEquipmentIndex = equipmentIndex;
                    currentApplicantIndex = applicantIndex;
                    applicantExists = true;
                    return true; // Stop searching once we find the applicant
                }
                return false;
            });
        });

        if (!applicantExists) {
            return res.status(403).json({
                error: 'Applicant ID is not in request database'
            });
        }

        // Access the specific applicant
        const applicant = user.applicantsListings.equipment[currentEquipmentIndex].applicants[currentApplicantIndex];
        const startDate = applicant.startDate;

        // Current end time in Kyiv timezone
        const endDateUTC = new Date();
        const endDateKyiv = moment(endDateUTC).tz('Europe/Kyiv').toDate();

        // Calculate rental duration in seconds
        const durationInSeconds = Math.floor((endDateKyiv - startDate) / 1000);

        // Calculate profit based on the price per hour
        const pricePerHour = equipment.price;
        const durationInHours = durationInSeconds / 3600;
        const profit = pricePerHour * durationInHours;

        // Update the user's rental history
        const rentalRecord = {
            rentItemName: equipmentId,
            type: 'equipment',
            rentedBy: applicantId,
            startDate: moment(startDate).tz('Europe/Kyiv').toDate(), // Convert to Kyiv timezone
            endDate: endDateKyiv,
            durationInSeconds, // duration added to the record
            profit: profit.toFixed(2) // profit added to the record
        };

        user.rentalHistory.push(rentalRecord);

        // Remove the rental request from applicantsListings after successful rent completion
        user.applicantsListings.equipment[currentEquipmentIndex].applicants.splice(currentApplicantIndex, 1);

        // Save the changes
        await user.save();

        res.status(200).json({
            message: 'Equipment rent finished successfully',
            endDateKyiv,
            durationInSeconds, // return rental duration
            profit // return the profit
        });
    } catch (error) {
        console.error('Error finishing equipment rent:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

export const getRentalRequests = async (req, res) => {
    try {
        const userId = req.userId;
        console.log('Получение данных пользователя из БД.');

        // Получение данных пользователя с предзагрузкой оборудования и заявителей
        const user = await UserModel.findById(userId)
            .populate({
                path: 'applicantsListings.equipment.equipment', // Подгружаем данные об оборудовании
                select: '_id name', // Получаем только нужные поля оборудования
            })
            .populate({
                path: 'applicantsListings.equipment.applicants.applicant', // Подгружаем данные о заявителях
                select: '_id name', // Получаем только нужные поля заявителей
            })
            .populate({
                path: 'applicantsListings.guide.guide', // Подгружаем данные о гидах
                select: '_id name',
            })
            .populate({
                path: 'applicantsListings.guide.applicants.applicant', // Подгружаем данные о заявителях для гида
                select: '_id name',
            })
            .populate({
                path: 'applicantsListings.client.client', // Подгружаем данные о клиентах
                select: '_id name',
            })
            .populate({
                path: 'applicantsListings.client.applicants.applicant', // Подгружаем данные о заявителях для клиента
                select: '_id name',
            });

        if (!user) {
            console.error('Пользователь не найден в БД с ID:', userId);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Формирование структуры данных для ответа
        const rentalRequests = user.applicantsListings.equipment.map((equipmentListing) => {
            const equipment = equipmentListing.equipment;

            if (!equipment) {
                console.error('Оборудование не найдено');
                return null;
            }

            // Формируем список заявителей
            const applicants = equipmentListing.applicants.map((applicantObj) => {
                const applicant = applicantObj.applicant;
                if (!applicant) {
                    console.error('Заявитель не найден');
                    return null;
                }

                return {
                    user: {
                        id: applicant._id,
                        name: applicant.name,
                    },
                    message: applicantObj.message,
                    status: applicantObj.status || 'pending', // Используем статус вместо approvedState
                };
            });

            // Формируем данные по заявкам на оборудование
            return {
                equipment: {
                    equipmentName: equipment.name || 'Неизвестное оборудование',
                    equipmentId: equipment._id,
                },
                applicants: applicants.filter(Boolean), // Убираем возможные null значения
            };
        });

        // Отфильтровываем null записи для оборудования
        const validRentalRequests = rentalRequests.filter(Boolean);

        console.log('Запросы на аренду:', validRentalRequests);
        return res.status(200).json({ rentalRequests: validRentalRequests });
    } catch (error) {
        console.error('Ошибка в getRentalRequests:', error.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};




// export const startEquipmentRent = async (req, res) => {
//     try {
//         const { equipmentId, applicantId } = req.body;
//         const userId = req.userId;

//         if (!userId || !equipmentId || !applicantId) {
//             return res.status(400).json({
//                 error: 'Missing required fields: userId, equipmentId, or applicantId'
//             });
//         }

//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         const creator = equipment.creator;

//         if (!creator.equals(userId)) {
//             return res.status(403).json({
//                 error: 'You are not the owner of this equipment'
//             });
//         }

//         const user = await UserModel.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         let currentIndex;
//         const applicantExists = user?.applicantsListings?.equipment?.applicants?.some((applicant, index) => {
//             if (applicant.equals(applicantId)) {
//                 currentIndex = index;
//                 return true;
//             }
//             return false;
//         });

//         if (!applicantExists) {
//             return res.status(403).json({
//                 error: 'Applicant ID is not in request database'
//             });
//         }

//         // Update the start date for the applicant
//         user.applicantsListings.equipment.applicants[currentIndex].startDate = new Date();

//         await user.save();

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
//         const { equipmentId, applicantId } = req.body;
//         const userId = req.userId;

//         if (!userId || !equipmentId || !applicantId) {
//             return res.status(400).json({
//                 error: 'Missing required fields: userId, equipmentId, or applicantId'
//             });
//         }

//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         if (!equipment.creator.equals(userId)) {
//             return res.status(403).json({
//                 error: 'You are not the owner of this equipment'
//             });
//         }

//         // Find the applicant in the rental listings
//         const applicant = equipment.user.find(r => r.rentedBy.equals(applicantId));
//         if (!applicant) {
//             return res.status(404).json({
//                 error: 'Applicant not found in the rental records'
//             });
//         }

//         const startDate = applicant.startDate;
//         const endDate = new Date();

//         // Update the user's rental history
//         const user = await UserModel.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 error: 'User not found'
//             });
//         }

//         const rentalRecord = {
//             rentItemName: equipmentId,
//             type: 'equipment',
//             rentedBy: applicantId,
//             startDate: startDate,
//             endDate: endDate
//         };

//         user.rentalHistory.push(rentalRecord);

//         // Save the changes
//         await user.save();

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

// export const startEquipmentRent = async (req, res) => {
//     try {
//         const { equipmentId, rentedBy } = req.body;
//         const userId = req.userId;

//         if (!userId || !equipmentId || !rentedBy) {
//             return res.status(400).json({
//                 error: 'Missing required fields: userId, equipmentId, or rentedBy'
//             });
//         }

//         const equipment = await EquipmentModel.findById(equipmentId);
//         if (!equipment) {
//             return res.status(404).json({
//                 error: 'Equipment not found'
//             });
//         }

//         if (!equipment.creator.equals(userId)) {
//             return res.status(403).json({
//                 error: 'You are not the owner of this equipment'
//             });
//         }

//         // Проверяем, что оборудование еще не арендовано
//         if (equipment.rentedBy && equipment.startDate) {
//             return res.status(400).json({
//                 error: 'Equipment is already rented'
//             });
//         }

//         // Устанавливаем, кто арендовал оборудование, и старт аренды
//         equipment.rentedBy = rentedBy;
//         equipment.startDate = new Date();

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