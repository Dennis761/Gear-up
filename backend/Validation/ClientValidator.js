import { body } from 'express-validator';

const clientValidator = [
    body('name', 
        'Name must be at least 2 letters long! \n Name can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 

    body('description', 'Information about user must be under 256 charts')
        .isLength({ max: 256 }),

    body('email', 'Invalid email format!')
        .isEmail(), 
    
    body('sportCategory', 
        'Country must be at least 2 characters long! \n Country can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 
];

export default clientValidator;