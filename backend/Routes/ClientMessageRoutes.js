import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import * as getClientMessageControllers from '../Controllers/RateScriptsControllers/RateClientScriptControllers/FetchClientRequestMessages.js';
import * as rateClientMesageControllers from '../Controllers/RateScriptsControllers/RateClientScriptControllers/RateClientInRequestController.js';

const router = express.Router();

router.get('/fetch/messages', checkAuth, getClientMessageControllers.fetchClientRequestMessages);
router.patch('/rate/messages', checkAuth, rateClientMesageControllers.RateClientRequest);

export default router;
