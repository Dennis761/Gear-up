import { body } from 'express-validator';

const validateBlog = [
    body('title').notEmpty().withMessage('Title is required'),
    body('date').notEmpty().isISO8601().withMessage('Valid date is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('image').notEmpty().withMessage('Image URL is required'),
];

export default validateBlog