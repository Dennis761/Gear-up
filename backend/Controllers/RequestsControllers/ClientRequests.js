import mongoose from 'mongoose';
import ClientModel from '../../Models/ClientModel.js'; // Заменено с GuideModel на ClientModel
import UserModel from '../../Models/UserModel.js';
import moment from 'moment-timezone';

// Отправка запроса на аренду
export const sendRequestForRent = async (req, res) => {
    try {
        const { clientId, message } = req.body; // Заменено guideId на clientId
        const userId = req.userId;

        // Проверка на наличие всех необходимых полей
        if (!clientId || !message || !userId) {
            return res.status(400).json({
                error: 'Missing required fields: clientId, message, or userId'
            });
        }

        // Проверка валидности идентификатора клиента
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            return res.status(400).json({
                error: 'Invalid client ID'
            });
        }

        // Преобразуем userId и clientId к ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const clientObjectId = new mongoose.Types.ObjectId(clientId);

        // Поиск клиента по идентификатору
        const client = await ClientModel.findById(clientObjectId);
        if (!client) {
            return res.status(404).json({
                error: 'Client not found'
            });
        }

        // Поиск владельца клиента
        const owner = await UserModel.findById(client.creator);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the client not found'
            });
        }

        // Ищем запись о клиенте у владельца
        let clientListing = owner.applicantsListings.clients.find(listing =>
            listing.client.equals(clientObjectId)
        ); // Заменено guide на client

        if (!clientListing) {
            // Если записи о клиенте нет, создаём новую запись с заявкой
            clientListing = {
                client: clientObjectId,
                applicants: [{
                    applicant: userObjectId,
                    message
                }]
            };
            owner.applicantsListings.clients.push(clientListing); // Заменено guide на clients
        } else {
            // Если запись о клиенте найдена, проверяем, есть ли заявка от пользователя
            const existingApplicant = clientListing.applicants.find(app =>
                app.applicant.equals(userObjectId)
            );

            if (existingApplicant) {
                // Если заявка от пользователя уже существует, возвращаем ошибку
                return res.status(400).json({
                    error: 'You have already sent a request for this client'
                });
            }

            // Добавляем нового заявителя, если заявки от этого пользователя нет
            clientListing.applicants.push({
                applicant: userObjectId,
                message
            });
        }

        // Сохраняем изменения
        await owner.save();

        res.status(200).json({
            message: 'Request for rent sent successfully',
            applicants: clientListing.applicants
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
        const { clientId, applicantId } = req.body; // Заменено guideId на clientId
        const userId = req.userId; 
        console.log('applicantId', applicantId)
        console.log('clientId', clientId)
        console.log('userId', userId)
        if (!userId || !clientId || !applicantId) { // Заменено guideId на clientId
            return res.status(400).json({
                error: 'Missing required fields: userId, clientId, or applicantId'
            });
        }

        const client = await ClientModel.findById(clientId); // Заменено guide на client
        if (!client) {
            return res.status(404).json({
                error: 'Client not found'
            });
        }

        if (!client.creator.equals(userId)) { // Заменено guide на client
            return res.status(403).json({
                error: 'You are not the owner of this client'
            });
        }

        const owner = await UserModel.findById(client.creator); // Заменено guide на client
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the client not found'
            });
        }

        const clientListing = owner.applicantsListings.clients.find(listing => // Заменено guide на clients
            listing.client.equals(clientId) // Заменено guide на client
        );

        if (!clientListing) {
            return res.status(404).json({
                error: 'Client listing not found for this owner'
            });
        }

        const applicant = clientListing.applicants.find(app =>
            app.applicant.equals(applicantId)
        );

        if (!applicant) {
            return res.status(404).json({
                error: 'Applicant not found for this client'
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
        const { clientId, applicantId } = req.body; // Заменено guideId на clientId
        const userId = req.userId;

        if (!userId || !clientId || !applicantId) { // Заменено guideId на clientId
            return res.status(400).json({
                error: 'Missing required fields: userId, clientId, or applicantId'
            });
        }

        const client = await ClientModel.findById(clientId); // Заменено guide на client
        if (!client) {
            return res.status(404).json({
                error: 'Client not found'
            });
        }

        if (!client.creator.equals(userId)) { // Заменено guide на client
            return res.status(403).json({
                error: 'You are not the owner of this client'
            });
        }

        const owner = await UserModel.findById(client.creator); // Заменено guide на client
        if (!owner) {
            return res.status(404).json({
                error: 'Owner of the client not found'
            });
        }

        const clientListing = owner.applicantsListings.clients.find(listing => // Заменено guide на clients
            listing.client.equals(clientId) // Заменено guide на client
        );

        if (!clientListing) {
            return res.status(404).json({
                error: 'Client listing not found for this owner'
            });
        }

        clientListing.applicants = clientListing.applicants.filter(app =>
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

// Начать аренду клиента
export const startClientRent = async (req, res) => { // Заменено Guide на Client
    try {
        const { clientId, applicantId } = req.body; // Заменено guideId на clientId
        console.log('applicantId:', applicantId);
        const userId = req.userId;

        if (!userId || !clientId || !applicantId) { // Заменено guideId на clientId
            return res.status(400).json({
                error: 'Missing required fields: userId, clientId, or applicantId'
            });
        }

        const client = await ClientModel.findById(clientId); // Заменено guide на client
        if (!client) {
            return res.status(404).json({
                error: 'Client not found'
            });
        }

        if (!client.creator.equals(userId)) { // Заменено guide на client
            return res.status(403).json({
                error: 'You are not the owner of this client'
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        let currentClientIndex;
        let currentApplicantIndex;
        let applicantExists = false;

        // Iterate over the rental info in client applicantsListings
        user?.applicantsListings?.clients?.some((rentInfo, clientIndex) => { // Заменено guide на clients
            return rentInfo.applicants?.some((applicant, applicantIndex) => {
                console.log('Checking applicant:', applicant?.applicant, applicantId);
                if (applicant?.applicant.equals(applicantId)) {
                    currentClientIndex = clientIndex;
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

        // Access the specific client and applicant
        user.applicantsListings.clients[currentClientIndex].applicants[currentApplicantIndex].startDate = startDateKyiv; // Заменено guide на clients

        await user.save();

        res.status(200).json({
            message: 'Client rent started successfully',
            startDateKyiv
        });
    } catch (error) {
        console.error('Error starting client rent:', error);
        return res.status(500).json({
            error: 'Server error. Please try again later.'
        });
    }
};

// Завершить аренду клиента
export const finishClientRent = async (req, res) => { // Заменено Guide на Client
    try {
        const { clientId, applicantId } = req.body; // Заменено guideId на clientId
        const userId = req.userId;

        if (!userId || !clientId || !applicantId) { // Заменено guideId на clientId
            return res.status(400).json({
                error: 'Missing required fields: userId, clientId, or applicantId'
            });
        }

        // Fetch the client
        const client = await ClientModel.findById(clientId); // Заменено guide на client
        if (!client) {
            return res.status(404).json({
                error: 'Client not found'
            });
        }

        // Verify ownership
        if (!client.creator.equals(userId)) { // Заменено guide на client
            return res.status(403).json({
                error: 'You are not the owner of this client'
            });
        }

        // Fetch the user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Iterate over the rental info in client applicantsListings
        let currentClientIndex;
        let currentApplicantIndex;
        let applicantExists = false;

        user?.applicantsListings?.clients?.some((rentInfo, clientIndex) => { // Заменено guide на clients
            return rentInfo.applicants?.some((applicant, applicantIndex) => {
                if (applicant?.applicant.equals(applicantId)) {
                    currentClientIndex = clientIndex;
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
        const applicant = user.applicantsListings.clients[currentClientIndex].applicants[currentApplicantIndex]; // Заменено guide на clients
        const startDate = applicant.startDate;

        // Current end time in Kyiv timezone
        const endDateUTC = new Date();
        const endDateKyiv = moment(endDateUTC).tz('Europe/Kyiv').toDate();

        // Calculate rental duration in seconds
        const durationInSeconds = Math.floor((endDateKyiv - startDate) / 1000);

        // Calculate profit based on the price per hour
        const pricePerHour = client.price; // Заменено guide на client
        const durationInHours = durationInSeconds / 3600;
        const profit = pricePerHour * durationInHours;

        // Update the user's rental history
        const rentalRecord = {
            rentItemName: clientId, // Заменено guide на client
            type: 'client', // Заменено guide на client
            rentedBy: applicantId,
            startDate: moment(startDate).tz('Europe/Kyiv').toDate(), // Convert to Kyiv timezone
            endDate: endDateKyiv,
            durationInSeconds, // duration added to the record
            profit: profit.toFixed(2) // profit added to the record
        };

        user.rentalHistory.push(rentalRecord);

        // Remove the rental request from applicantsListings after successful rent completion
        user.applicantsListings.clients[currentClientIndex].applicants.splice(currentApplicantIndex, 1); // Заменено guide на clients

        // Save the changes
        await user.save();

        res.status(200).json({
            message: 'Client rent finished successfully',
            endDateKyiv,
            durationInSeconds, // return rental duration
            profit // return the profit
        });
    } catch (error) {
        console.error('Error finishing client rent:', error);
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

        // Получение данных пользователя с предзагрузкой клиентов и заявителей
        const user = await UserModel.findById(userId)
            .populate({
                path: 'applicantsListings.clients.client', // Заменено guide на clients
                select: '_id name', // Получаем только нужные поля клиента
            })
            .populate({
                path: 'applicantsListings.clients.applicants.applicant', // Заменено guide на clients
                select: '_id name approvedState', // Получаем только нужные поля заявителей
            });

        if (!user) {
            console.error('Пользователь не найден в БД с ID:', userId);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Формирование структуры данных для ответа
        const rentalRequests = user.applicantsListings.clients.map((clientListing) => { // Заменено guide на clients
            const client = clientListing.client; // Заменено guide на client

            if (!client) {
                console.error('Клиент не найден');
                return null;
            }

            // Формируем список заявителей
            const applicants = clientListing.applicants.map((applicantObj) => { // Заменено guide на clients
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

            // Формируем данные по заявкам на клиента
            return {
                client: { // Заменено guide на client
                    clientName: client.name || 'Неизвестный клиент', // Заменено guideName на clientName
                    clientId: client._id, // Заменено guideId на clientId
                    endDate: client.endDate || 0 // Заменено guide на client
                },
                applicants: applicants.filter(Boolean),
            };
        });

        // Отфильтровываем null записи для клиентов
        const validRentalRequests = rentalRequests.filter(Boolean);

        console.log('Запросы на аренду:', validRentalRequests);
        return res.status(200).json({ rentalRequests: validRentalRequests });
    } catch (error) {
        console.error('Ошибка в getRentalRequests:', error.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};
