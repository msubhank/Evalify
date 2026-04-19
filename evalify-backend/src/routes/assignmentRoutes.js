import express from 'express';
import {
    createAssignment,
    getUserAssignments,
    deleteAssignment,
    saveSubmission,
    getSubmissions,
    startAttempt,
    getAttempts,
    updateAssignment
} from '../controllers/assignmentController.js';

const router = express.Router();

router.post('/', createAssignment);
router.get('/user/:userId', getUserAssignments);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

router.post('/submissions', saveSubmission);
router.get('/submissions', getSubmissions);

router.post('/attempts', startAttempt);
router.get('/attempts', getAttempts);

export default router;
