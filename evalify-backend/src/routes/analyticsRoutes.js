import express from 'express';
import {
    markAttendance,
    getAttendance,
    logIntegrity,
    getIntegrityLogs,
    getAnnouncements,
    createAnnouncement
} from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/attendance', markAttendance);
router.get('/attendance', getAttendance);

router.post('/integrity', logIntegrity);
router.get('/integrity', getIntegrityLogs);

router.post('/announcements', createAnnouncement);
router.get('/announcements', getAnnouncements);

export default router;
