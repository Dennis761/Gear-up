import { body } from 'express-validator';

const guideValidator = [
    body('name', 
        'Name must be at least 2 letters long! \n Name can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 

    body('experience', 'Invalid experience format! \n Must be in the format: xxx years')
        .matches(/^\d{1,3}\s+years$/),

    body('contact', 'Invalid phone number format!')
        .matches(/^\+?[1-9]\d{9,14}$/), 
    
    body('region', 
        'Country must be at least 2 characters long! \n Country can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 

];

export default guideValidator