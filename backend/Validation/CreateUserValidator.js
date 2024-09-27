import { body } from 'express-validator';

const createUserValidator = [
    body('name', 
        'Name must be at least 2 letters long! \n Name can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 
    body('email', 'Invalid email format!')
        .isEmail(),
    
    body('phoneNumber', 'Invalid phone number format!')
        .matches(/^\+?[1-9]\d{9,14}$/), 
    
    body('region', 
        'Country must be at least 2 characters long! \n Country can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 

    body('password', 
        'Password must be at least 8 characters long! \n Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!')
        .isLength({ min: 8 }) 
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
];

export default createUserValidator