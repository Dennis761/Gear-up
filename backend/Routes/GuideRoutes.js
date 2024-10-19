import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import guideValidator from '../Validation/GuideValidator.js';
import * as guideRequestControllers from '../Controllers/RequestsControllers/GuideRequests.js';
import * as rentOutGuideControllers from '../Controllers/RentOutControllers/RentOutGuideControllers.js';

const router = express.Router();

router.patch('/approve', checkAuth, guideRequestControllers.approveToRent);
router.post('/rent', checkAuth, guideValidator, rentOutGuideControllers.createGuideRent);
router.post('/request', checkAuth, guideRequestControllers.sendRequestForRent);
router.patch('/disapprove', checkAuth, guideRequestControllers.dissaproveToRent);
router.patch('/start', checkAuth, guideRequestControllers.startGuideRent);
router.patch('/finish', checkAuth, guideRequestControllers.finishGuideRent);
router.get('/all-guides', checkAuth, rentOutGuideControllers.getAllGuides);
router.get('/rent-requests', checkAuth, guideRequestControllers.getRentalRequests);
router.get('/my-guide', checkAuth, rentOutGuideControllers.showRentedOutMyGuide);
router.get('/listings', checkAuth, rentOutGuideControllers.getMyGuideListings);
router.get('/:id', checkAuth, rentOutGuideControllers.getGuideById);
router.delete('/:id', checkAuth, rentOutGuideControllers.deleteRentedOutMyGuide);

export default router;
