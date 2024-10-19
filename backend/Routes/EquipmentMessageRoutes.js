import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import * as fetchEquipmentRequestMessages from '../Controllers/RateScriptsControllers/RateEquipmentScriptControllers/FetchEquipmentRequestMessages.js';
import * as rateEquipmentMesageControllers from '../Controllers/RateScriptsControllers/RateEquipmentScriptControllers/RateEquipmentInRequestController.js';

const router = express.Router();

router.get('/fetch/messages', checkAuth, fetchEquipmentRequestMessages.fetchEquipmentRequestMessages);
router.patch('/rate/messages', checkAuth, rateEquipmentMesageControllers.RateEquipmentRequest);

export default router;
