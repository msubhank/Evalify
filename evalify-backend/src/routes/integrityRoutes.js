import express from 'express';
import { logIntegrity, getIntegrityLogs } from '../controllers/integrityController.js';

const router = express.Router();

router.post('/', logIntegrity);
router.get('/', getIntegrityLogs);

export default router;
