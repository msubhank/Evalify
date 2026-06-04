import express from 'express';
import { logIntegrity, getIntegrityLogs } from '../controllers/integrityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all integrity logging endpoints
router.use(requireAuth);

router.post('/', logIntegrity);
router.get('/', getIntegrityLogs);

export default router;
