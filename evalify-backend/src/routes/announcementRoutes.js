import express from 'express';
import {
    createAnnouncement,
    getClassAnnouncements,
    getUserAnnouncements,
    deleteAnnouncement
} from '../controllers/announcementController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all announcement endpoints
router.use(requireAuth);

router.post('/', createAnnouncement);
router.get('/class/:classId', getClassAnnouncements);
router.get('/user/:userId', getUserAnnouncements);
router.delete('/:id', deleteAnnouncement);

export default router;
