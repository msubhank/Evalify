import express from 'express';
import {
    markAttendance,
    getAttendance,
    logIntegrity,
    getIntegrityLogs,
    getAnnouncements,
    createAnnouncement
} from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all analytics endpoints
router.use(requireAuth);

router.post('/attendance', markAttendance);
router.get('/attendance', getAttendance);

router.post('/integrity', logIntegrity);
router.get('/integrity', getIntegrityLogs);

router.post('/announcements', createAnnouncement);
router.get('/announcements', getAnnouncements);

export default router;
