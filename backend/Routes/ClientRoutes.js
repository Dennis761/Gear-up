import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import clientValidator from '../Validation/ClientValidator.js';
import * as clientRequestControllers from '../Controllers/RequestsControllers/ClientRequests.js';
import * as rentOutClientControllers from '../Controllers/RentOutControllers/RentOutClientControllers.js';

const router = express.Router();

router.patch('/approve', checkAuth, clientRequestControllers.approveToRent);
router.post('/rent', checkAuth, clientValidator, rentOutClientControllers.createClientRent);
router.post('/request', checkAuth, clientRequestControllers.sendRequestForRent);
router.patch('/disapprove', checkAuth, clientRequestControllers.dissaproveToRent);
router.patch('/start', checkAuth, clientRequestControllers.startClientRent);
router.patch('/finish', checkAuth, clientRequestControllers.finishClientRent);
router.get('/all-clients', checkAuth, rentOutClientControllers.getAllClients);
router.get('/rent-requests', checkAuth, clientRequestControllers.getRentalRequests);
router.get('/my-client', checkAuth, rentOutClientControllers.showRentedOutMyClient);
router.get('/listings', checkAuth, rentOutClientControllers.getMyClientListings);
router.get('/:id', checkAuth, rentOutClientControllers.getClientById);
router.delete('/:id', checkAuth, rentOutClientControllers.deleteRentedOutMyClient);

export default router;
