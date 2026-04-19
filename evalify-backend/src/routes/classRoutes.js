import express from 'express';
import {
    createClass,
    getClasses,
    getClassByCode,
    joinClass,
    getUserClasses,
    getTeacherRoster
} from '../controllers/classController.js';

const router = express.Router();

router.post('/', createClass);
router.get('/', getClasses);
router.get('/:code', getClassByCode);
router.post('/join', joinClass);
// Route to fetch all classes for a specific user (teacher or student)
router.get('/user/:userId', getUserClasses);
router.get('/teacher/:teacherId/roster', getTeacherRoster);

export default router;
