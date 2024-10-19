import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import * as fetchGuideRequestMessages from '../Controllers/RateScriptsControllers/RateGuideScriptControllers/FetchGuideRequestMessages.js';
import * as rateGuideMesageControllers from '../Controllers/RateScriptsControllers/RateGuideScriptControllers/RateGuideInRequestControllers.js';

const router = express.Router();

router.get('/fetch/messages', checkAuth, fetchGuideRequestMessages.fetchGuideRequestMessages);
router.patch('/rate/messages', checkAuth, rateGuideMesageControllers.RateGuideRequest);

export default router;
