import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import checkAuth from './Middlewares/CheckAuth.js';

import clientValidator from './Validation/ClientValidator.js';
import createUserValidator from './Validation/CreateUserValidator.js';
import editUserValidator from './Validation/EditUserValidator.js';
import guideValidator from './Validation/GuideValidator.js';
import rentOutMyEquipmentValidator from './Validation/RentOutMyEquipmentValidator.js';
import validateBlog from './Validation/ValidateBlog.js';

// Importing controllers
import * as authControllers from './Controllers/Auth.js';
import * as userControllers from './Controllers/UserControllers.js';
import * as equipmentRequestControllers from './Controllers/RequestsControllers/EquipmentRequests.js';
import * as rentOutEquipmentControllers from './Controllers/RentOutEquipmentControllers.js';
import * as clientControllers from './Controllers/ClientControllers.js';
import * as blogsControllers from './Controllers/BlogsControllers.js';
import * as becomeAGuideControllers from './Controllers/BecomeAGuideControllers.js';
import * as historyControllers from './Controllers/HistoryControllers.js'
import * as searchEquipmentControllers from './Controllers/FindRentControllers/SearchEquipmentByName.js'

const app = express();
const PORT = 4444;
const db = 'mongodb+srv://millerden45:qetuo159@cluster0.ufrk5m5.mongodb.net/blog?retryWrites=true&w=majority';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to the database');
    })
    .catch((err) => {
        console.error('Error connecting to the database:', err);
    });

app.get('/', (req, res) => {
    res.send('Hello world!');
});

// Authentication routes
app.post('/auth/register', createUserValidator, authControllers.register);
app.post('/auth/login', authControllers.login);

// User routes
app.get('/user/profile', checkAuth, userControllers.getUserProfile);
app.patch('/user/profile/edit', checkAuth, editUserValidator, userControllers.editProfile);

// Equipment routes
app.patch('/equipment/approve', checkAuth, equipmentRequestControllers.approveToRent);
app.post('/equipment/rent', checkAuth, rentOutMyEquipmentValidator, rentOutEquipmentControllers.rentOutMyEquipment);
app.post('/equipment/request', checkAuth, equipmentRequestControllers.sendRequestForRent);
app.patch('/equipment/disapprove', checkAuth, equipmentRequestControllers.dissaproveToRent);
app.patch('/equipment/start', checkAuth, equipmentRequestControllers.startEquipmentRent);
app.patch('/equipment/finish', checkAuth, equipmentRequestControllers.finishEquipmentRent);
app.get('/equipment/all-equipments', checkAuth, rentOutEquipmentControllers.getAllEquipment);
app.get('/equipment/rent-requests', checkAuth, equipmentRequestControllers.getRentalRequests);
app.get('/equipment/my-equipment', checkAuth, rentOutEquipmentControllers.showRentedOutMyEquipment);
app.get('/equipment/listings', checkAuth, rentOutEquipmentControllers.getMyEquipmentListings);

// Динамический маршрут должен быть в конце, чтобы избежать конфликтов
app.get('/equipment/:id', checkAuth, rentOutEquipmentControllers.getEquipmentById);
app.delete('/equipment/:id', checkAuth, rentOutEquipmentControllers.deleteRentedOutMyEquipment);

// Guide routes
app.post('/guides/rent', checkAuth, guideValidator, becomeAGuideControllers.rentOutMyGuide);
app.get('/guides/my', checkAuth, becomeAGuideControllers.showRentedOutMyGuide);
app.get('/guides/all', becomeAGuideControllers.getAllGuides);
app.get('/guides/listings', checkAuth, becomeAGuideControllers.getMyGuideListings);
app.delete('/guides/:id', checkAuth, becomeAGuideControllers.deleteRentedOutMyGuide);

// Blog routes
app.post('/blogs/create', checkAuth, validateBlog, blogsControllers.createBlog);
app.put('/blogs/edit/:id', checkAuth, validateBlog, blogsControllers.editBlog);
app.get('/blogs/all', blogsControllers.getAllBlogs);
app.get('/blogs/my', checkAuth, blogsControllers.getUserBlogs);
app.delete('/blogs/:id', checkAuth, blogsControllers.deleteBlog);

// Liked blogs
app.post('/blogs/like/:blogId', checkAuth, blogsControllers.addBlogToLiked);
app.delete('/blogs/unlike/:blogId', checkAuth, blogsControllers.removeBlogFromLiked);

// Saved blogs
app.post('/blogs/save/:blogId', checkAuth, blogsControllers.addBlogToSaved);
app.delete('/blogs/unsave/:blogId', checkAuth, blogsControllers.removeBlogFromSaved);
app.get('/blogs/saved', checkAuth, blogsControllers.getSavedBlogs);

// Client routes
app.post('/clients/rent', checkAuth, clientValidator, clientControllers.rentOutMyClient);
app.get('/clients/my', checkAuth, clientControllers.showRentedOutMyClient);
app.get('/clients/all', clientControllers.getAllClients);
app.get('/clients/listings', checkAuth, clientControllers.getMyClientListings);
app.delete('/clients/:id', checkAuth, clientControllers.deleteRentedOutMyClient);

app.get('/search/equipment/:namePrefix', checkAuth, searchEquipmentControllers.searchEquipmentByName);

app.get('/history', checkAuth, historyControllers.getUserRentalHistory);

app.listen(PORT, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Server running on PORT:${PORT}`);
    }
});

// app.post('/equipment/rent', checkAuth, rentOutMyEquipmentValidator, rentOutEquipmentControllers.rentOutMyEquipment); // Создание оборудования
// app.post('/equipment/:id/request', checkAuth, rentOutEquipmentControllers.sendRequestForRent); // Отправка запроса на аренду
// app.patch('/equipment/:id/approve', checkAuth, rentOutEquipmentControllers.approveToRent); // Одобрение запроса на аренду
// app.patch('/equipment/:id/disapprove', checkAuth, rentOutEquipmentControllers.dissaproveToRent); // Отклонение запроса на аренду
// app.patch('/equipment/:id/start', checkAuth, rentOutEquipmentControllers.startEquipmentRent); // Начало аренды
// app.patch('/equipment/:id/finish', checkAuth, rentOutEquipmentControllers.finishEquipmentRent); // Окончание аренды
// app.get('/equipment/my-rented', checkAuth, rentOutEquipmentControllers.showRentedOutMyEquipment); // Показать арендованное мной оборудование
// app.get('/equipment/all-equipment', rentOutEquipmentControllers.getAllEquipment); // Получить все оборудование
// app.get('/equipment/my-equipment', checkAuth, rentOutEquipmentControllers.getMyEquipmentListings); // Показать список моего оборудования
// app.delete('/equipment/:id', checkAuth, rentOutEquipmentControllers.deleteRentedOutMyEquipment); // Удалить оборудование
