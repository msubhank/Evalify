import express from 'express';
import {
    createMaterial,
    getClassMaterials,
    getUserMaterials,
    deleteMaterial
} from '../controllers/materialController.js';

const router = express.Router();

router.post('/', createMaterial);
router.get('/class/:classId', getClassMaterials);
router.get('/user/:userId', getUserMaterials);
router.delete('/:id', deleteMaterial);

export default router;
