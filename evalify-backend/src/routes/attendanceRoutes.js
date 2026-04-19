import express from 'express';
import {
    markAttendance,
    getAttendance,
    archiveAttendance
} from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/', markAttendance);
router.get('/', getAttendance);
router.post('/archive', archiveAttendance);

export default router;
