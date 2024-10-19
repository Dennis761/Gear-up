import mongoose from 'mongoose';
import GuideModel from '../../Models/GuideModel.js'; // Заменено с EquipmentModel на GuideModel
import UserModel from '../../Models/UserModel.js';
import moment from 'moment-timezone';

// Отправка запроса на аренду
export const sendRequestForRent = async (req, res) => {
    try {
        const { guideId, message } = req.body; // Заменено equipmentId на guideId
        const userId = req.userId;

        // Проверка на наличие всех необходимых полей
        if (!guideId || !message || !userId) {
            return res.status(400).json({
                error: 'Missing required fields: guideId, message, or userId'
            });
        }

        // Проверка валидности идентификатора гида
        if (!mongoose.Types.ObjectId.isValid(guideId)) {
            return res.status(400).json({
                error: 'Invalid guide ID'
            });
        }

        // Преобразуем userId и guideId к ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const guideObjectId = new mongoose.Types.ObjectId(guideId);

        // Поиск гида по идентификатору
        const guide = await GuideModel.findById(guideObjectId);
        if (!guide) {
            return res.status(404).json({
                error: 'Guide not found'
            });
        }

        // Поиск владельца гида
        const owner = await UserModel.findById(guide.creator);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the guide not found'
            });
        }

        // Ищем запись о гиде у владельца
        let guideListing = owner.applicantsListings.guides.find(listing =>
            listing.guide.equals(guideObjectId)
        ); // Заменено equipment на guide

        if (!guideListing) {
            // Если записи о гиде нет, создаём новую запись с заявкой
            guideListing = {
                guide: guideObjectId,
                applicants: [{
                    applicant: userObjectId,
                    message
                }]
            };
            owner.applicantsListings.guides.push(guideListing); // Заменено equipment на guides
        } else {
            // Если запись о гиде найдена, проверяем, есть ли заявка от пользователя
            const existingApplicant = guideListing.applicants.find(app =>
                app.applicant.equals(userObjectId)
            );

            if (existingApplicant) {
                // Если заявка от пользователя уже существует, возвращаем ошибку
                return res.status(400).json({
                    error: 'You have already sent a request for this guide'
                });
            }

            // Добавляем нового заявителя, если заявки от этого пользователя нет
            guideListing.applicants.push({
                applicant: userObjectId,
                message
            });
        }

        // Сохраняем изменения
        await owner.save();

        res.status(200).json({
            message: 'Request for rent sent successfully',
            applicants: guideListing.applicants
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
        const { guideId, applicantId } = req.body; // Заменено equipmentId на guideId
        const userId = req.userId; 
        console.log('applicantId', applicantId)
        console.log('guideId', guideId)
        console.log('userId', userId)
        if (!userId || !guideId || !applicantId) { // Заменено equipmentId на guideId
            return res.status(400).json({
                error: 'Missing required fields: userId, guideId, or applicantId'
            });
        }

        const guide = await GuideModel.findById(guideId); // Заменено equipment на guide
        if (!guide) {
            return res.status(404).json({
                error: 'Guide not found'
            });
        }

        if (!guide.creator.equals(userId)) { // Заменено equipment на guide
            return res.status(403).json({
                error: 'You are not the owner of this guide'
            });
        }

        const owner = await UserModel.findById(guide.creator); // Заменено equipment на guide
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the guide not found'
            });
        }

        const guideListing = owner.applicantsListings.guides.find(listing => // Заменено equipment на guides
            listing.guide.equals(guideId) // Заменено equipment на guide
        );

        if (!guideListing) {
            return res.status(404).json({
                error: 'Guide listing not found for this owner'
            });
        }

        const applicant = guideListing.applicants.find(app =>
            app.applicant.equals(applicantId)
        );

        if (!applicant) {
            return res.status(404).json({
                error: 'Applicant not found for this guide'
            });
        }

        // Устанавливаем approvedState в true
        applicant.approvedState = true;

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
        const { guideId, applicantId } = req.body; // Заменено equipmentId на guideId
        const userId = req.userId;

        if (!userId || !guideId || !applicantId) { // Заменено equipmentId на guideId
            return res.status(400).json({
                error: 'Missing required fields: userId, guideId, or applicantId'
            });
        }

        const guide = await GuideModel.findById(guideId); // Заменено equipment на guide
        if (!guide) {
            return res.status(404).json({
                error: 'Guide not found'
            });
        }

        if (!guide.creator.equals(userId)) { // Заменено equipment на guide
            return res.status(403).json({
                error: 'You are not the owner of this guide'
            });
        }

        const owner = await UserModel.findById(guide.creator); // Заменено equipment на guide
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the guide not found'
            });
        }

        const guideListing = owner.applicantsListings.guides.find(listing => // Заменено equipment на guides
            listing.guide.equals(guideId) // Заменено equipment на guide
        );

        if (!guideListing) {
            return res.status(404).json({
                error: 'Guide listing not found for this owner'
            });
        }

        guideListing.applicants = guideListing.applicants.filter(app =>
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

// Начать аренду гида
export const startGuideRent = async (req, res) => { // Заменено Equipment на Guide
    try {
        const { guideId, applicantId } = req.body; // Заменено equipmentId на guideId
        console.log('applicantId:', applicantId);
        const userId = req.userId;

        if (!userId || !guideId || !applicantId) { // Заменено equipmentId на guideId
            return res.status(400).json({
                error: 'Missing required fields: userId, guideId, or applicantId'
            });
        }

        const guide = await GuideModel.findById(guideId); // Заменено equipment на guide
        if (!guide) {
            return res.status(404).json({
                error: 'Guide not found'
            });
        }

        if (!guide.creator.equals(userId)) { // Заменено equipment на guide
            return res.status(403).json({
                error: 'You are not the owner of this guide'
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        let currentGuideIndex;
        let currentApplicantIndex;
        let applicantExists = false;

        // Iterate over the rental info in guide applicantsListings
        user?.applicantsListings?.guides?.some((rentInfo, guideIndex) => { // Заменено equipment на guides
            return rentInfo.applicants?.some((applicant, applicantIndex) => {
                console.log('Checking applicant:', applicant?.applicant, applicantId);
                if (applicant?.applicant.equals(applicantId)) {
                    currentGuideIndex = guideIndex;
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

        // Access the specific guide and applicant
        user.applicantsListings.guides[currentGuideIndex].applicants[currentApplicantIndex].startDate = startDateKyiv; // Заменено equipment на guides

        await user.save();

        res.status(200).json({
            message: 'Guide rent started successfully',
            startDateKyiv
        });
    } catch (error) {
        console.error('Error starting guide rent:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

// Завершить аренду гида
export const finishGuideRent = async (req, res) => { // Заменено Equipment на Guide
    try {
        const { guideId, applicantId } = req.body; // Заменено equipmentId на guideId
        const userId = req.userId;

        if (!userId || !guideId || !applicantId) { // Заменено equipmentId на guideId
            return res.status(400).json({
                error: 'Missing required fields: userId, guideId, or applicantId'
            });
        }

        // Fetch the guide
        const guide = await GuideModel.findById(guideId); // Заменено equipment на guide
        if (!guide) {
            return res.status(404).json({
                error: 'Guide not found'
            });
        }

        // Verify ownership
        if (!guide.creator.equals(userId)) { // Заменено equipment на guide
            return res.status(403).json({
                error: 'You are not the owner of this guide'
            });
        }

        // Fetch the user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Iterate over the rental info in guide applicantsListings
        let currentGuideIndex;
        let currentApplicantIndex;
        let applicantExists = false;

        user?.applicantsListings?.guides?.some((rentInfo, guideIndex) => { // Заменено equipment на guides
            return rentInfo.applicants?.some((applicant, applicantIndex) => {
                if (applicant?.applicant.equals(applicantId)) {
                    currentGuideIndex = guideIndex;
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
        const applicant = user.applicantsListings.guides[currentGuideIndex].applicants[currentApplicantIndex]; // Заменено equipment на guides
        const startDate = applicant.startDate;

        // Current end time in Kyiv timezone
        const endDateUTC = new Date();
        const endDateKyiv = moment(endDateUTC).tz('Europe/Kyiv').toDate();

        // Calculate rental duration in seconds
        const durationInSeconds = Math.floor((endDateKyiv - startDate) / 1000);

        // Calculate profit based on the price per hour
        const pricePerHour = guide.price; // Заменено equipment на guide
        const durationInHours = durationInSeconds / 3600;
        const profit = pricePerHour * durationInHours;

        // Update the user's rental history
        const rentalRecord = {
            rentItemName: guideId, // Заменено equipment на guide
            type: 'guide', // Заменено equipment на guide
            rentedBy: applicantId,
            startDate: moment(startDate).tz('Europe/Kyiv').toDate(), // Convert to Kyiv timezone
            endDate: endDateKyiv,
            durationInSeconds, // duration added to the record
            profit: profit.toFixed(2) // profit added to the record
        };

        user.rentalHistory.push(rentalRecord);

        // Remove the rental request from applicantsListings after successful rent completion
        user.applicantsListings.guides[currentGuideIndex].applicants.splice(currentApplicantIndex, 1); // Заменено equipment на guides

        // Save the changes
        await user.save();

        res.status(200).json({
            message: 'Guide rent finished successfully',
            endDateKyiv,
            durationInSeconds, // return rental duration
            profit // return the profit
        });
    } catch (error) {
        console.error('Error finishing guide rent:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

// Получение запросов на аренду
export const getRentalRequests = async (req, res) => {
    try {
        const userId = req.userId;
        console.log('Получение данных пользователя из БД.');

        // Получение данных пользователя с предзагрузкой гидов и заявителей
        const user = await UserModel.findById(userId)
            .populate({
                path: 'applicantsListings.guides.guide', // Заменено equipment на guides
                select: '_id name', // Получаем только нужные поля гида
            })
            .populate({
                path: 'applicantsListings.guides.applicants.applicant', // Заменено equipment на guides
                select: '_id name approvedState', // Получаем только нужные поля заявителей
            });

        if (!user) {
            console.error('Пользователь не найден в БД с ID:', userId);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Формирование структуры данных для ответа
        const rentalRequests = user.applicantsListings.guides.map((guideListing) => { // Заменено equipment на guides
            const guide = guideListing.guide; // Заменено equipment на guide

            if (!guide) {
                console.error('Гид не найден');
                return null;
            }

            // Формируем список заявителей
            const applicants = guideListing.applicants.map((applicantObj) => { // Заменено equipment на guides
                const applicant = applicantObj.applicant;
                if (!applicant) {
                    console.error('Заявитель не найден');
                    return null;
                }

                return {
                    user: {
                        id: applicant._id,
                        name: applicant.name,
                        approvedState: applicantObj.approvedState || applicant.approvedState,
                    },
                    message: applicantObj.message,
                };
            });

            // Формируем данные по заявкам на гида
            return {
                guide: { // Заменено equipment на guide
                    guideName: guide.name || 'Неизвестный гид', // Заменено equipmentName на guideName
                    guideId: guide._id, // Заменено equipmentId на guideId
                    endDate: guide.endDate || 0 // Заменено equipment на guide
                },
                applicants: applicants.filter(Boolean),
            };
        });

        // Отфильтровываем null записи для гидов
        const validRentalRequests = rentalRequests.filter(Boolean);

        console.log('Запросы на аренду:', validRentalRequests);
        return res.status(200).json({ rentalRequests: validRentalRequests });
    } catch (error) {
        console.error('Ошибка в getRentalRequests:', error.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};
