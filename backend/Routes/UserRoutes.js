import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import * as userControllers from '../Controllers/UserControllers/UserControllers.js';
import editUserValidator from '../Validation/EditUserValidator.js';

const router = express.Router();

router.get('/profile', checkAuth, userControllers.getUserProfile);
router.patch('/profile/edit', checkAuth, editUserValidator, userControllers.editProfile);

export default router;
