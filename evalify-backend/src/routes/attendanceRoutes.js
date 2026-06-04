import express from 'express';
import {
    markAttendance,
    getAttendance,
    archiveAttendance
} from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all attendance endpoints
router.use(requireAuth);

router.post('/', markAttendance);
router.get('/', getAttendance);
router.post('/archive', archiveAttendance);

export default router;
