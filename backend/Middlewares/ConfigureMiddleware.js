// middleware/index.js
import cors from 'cors';
import express from 'express';

const configureMiddleware = (app) => {
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
};

export default configureMiddleware;
