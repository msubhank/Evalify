import express from 'express';
import {
    createAnnouncement,
    getClassAnnouncements,
    getUserAnnouncements,
    deleteAnnouncement
} from '../controllers/announcementController.js';

const router = express.Router();

router.post('/', createAnnouncement);
router.get('/class/:classId', getClassAnnouncements);
router.get('/user/:userId', getUserAnnouncements);
router.delete('/:id', deleteAnnouncement);

export default router;
