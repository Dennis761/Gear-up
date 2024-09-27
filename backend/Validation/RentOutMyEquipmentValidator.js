import { body } from 'express-validator';

const rentOutMyEquipmentValidator = [
    body('name', 
        'Name must be at least 2 letters long! \n Name can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 

    body('price', 'Invalid price format! \n Must be in the format: xxx $')
        .matches(/^\d{1,3}\s?\$$/), // регулярное выражение для формата "xxx $"
        
    body('region', 
        'Country must be at least 2 characters long! \n Country can only contain letters and spaces!')
        .isLength({ min: 2 }) 
        .matches(/^[a-zA-Z\s]*$/), 

]

export default rentOutMyEquipmentValidator