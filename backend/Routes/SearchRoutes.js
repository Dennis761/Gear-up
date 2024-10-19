import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import * as searchEquipmentControllers from '../Controllers/FindRentControllers/SearchEquipmentByName.js';
import * as searchGuideControllers from '../Controllers/FindRentControllers/SearchGuideByName.js';
import * as searchClientControllers from '../Controllers/FindRentControllers/SearchClientByName.js';

const router = express.Router();

router.get('/equipment/:namePrefix', checkAuth, searchEquipmentControllers.searchEquipmentByName);
router.get('/guide/:namePrefix', checkAuth, searchGuideControllers.searchGuideByName);
router.get('/client/:namePrefix', checkAuth, searchClientControllers.searchClientByName);

export default router;
