import express from 'express';
import {
    createMaterial,
    getClassMaterials,
    getUserMaterials,
    deleteMaterial
} from '../controllers/materialController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all course material endpoints
router.use(requireAuth);

router.post('/', createMaterial);
router.get('/class/:classId', getClassMaterials);
router.get('/user/:userId', getUserMaterials);
router.delete('/:id', deleteMaterial);

export default router;
