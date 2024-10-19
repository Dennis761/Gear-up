import express from 'express';
import * as authControllers from '../Controllers/AuthControllers/Auth.js';
import createUserValidator from '../Validation/CreateUserValidator.js';

const router = express.Router();

router.post('/register', createUserValidator, authControllers.register);
router.post('/login', authControllers.login);

export default router;
