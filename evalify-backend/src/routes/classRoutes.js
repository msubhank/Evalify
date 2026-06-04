import express from 'express';
import {
    createClass,
    getClasses,
    getClassByCode,
    joinClass,
    getUserClasses,
    getTeacherRoster
} from '../controllers/classController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all class endpoints
router.use(requireAuth);

router.post('/', createClass);
router.get('/', getClasses);
router.get('/:code', getClassByCode);
router.post('/join', joinClass);
// Route to fetch all classes for a specific user (teacher or student)
router.get('/user/:userId', getUserClasses);
router.get('/teacher/:teacherId/roster', getTeacherRoster);

export default router;
