import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import rentOutMyEquipmentValidator from '../Validation/RentOutMyEquipmentValidator.js';
import * as equipmentRequestControllers from '../Controllers/RequestsControllers/EquipmentRequests.js';
import * as rentOutEquipmentControllers from '../Controllers/RentOutControllers/RentOutEquipmentControllers.js';

const router = express.Router();

router.patch('/approve', checkAuth, equipmentRequestControllers.approveToRent);
router.post('/rent', checkAuth, rentOutMyEquipmentValidator, rentOutEquipmentControllers.createEquipmentRent);
router.post('/request', checkAuth, equipmentRequestControllers.sendRequestForRent);
router.patch('/disapprove', checkAuth, equipmentRequestControllers.dissaproveToRent);
router.patch('/start', checkAuth, equipmentRequestControllers.startEquipmentRent);
router.patch('/finish', checkAuth, equipmentRequestControllers.finishEquipmentRent);
router.get('/all-equipments', checkAuth, rentOutEquipmentControllers.getAllEquipment);
router.get('/rent-requests', checkAuth, equipmentRequestControllers.getRentalRequests);
router.get('/my-equipment', checkAuth, rentOutEquipmentControllers.showRentedOutMyEquipment);
router.get('/listings', checkAuth, rentOutEquipmentControllers.getMyEquipmentListings);
router.get('/:id', checkAuth, rentOutEquipmentControllers.getEquipmentById);
router.delete('/:id', checkAuth, rentOutEquipmentControllers.deleteRentedOutMyEquipment);

export default router;
