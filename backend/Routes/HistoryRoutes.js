import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import * as historyControllers from '../Controllers/HistoryControllers/HistoryControllers.js';

const router = express.Router();

router.get('/', checkAuth, historyControllers.getUserRentalHistory);

export default router;
