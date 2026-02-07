import { Router } from 'express';
import { getSystemStatus, syncAllToAsterisk } from '../controllers/system.controller';

const router = Router();

router.get('/status', getSystemStatus);
router.post('/sync-asterisk', syncAllToAsterisk);

export default router;
