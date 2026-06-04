import express from 'express';
import { syncUser, getUser, checkRegNo } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Synchronize Supabase user into Postgres (called right after signup)
router.post('/sync', requireAuth, syncUser);

// Check if regNo already exists (Public endpoint used during signup)
router.get('/check-regno/:regNo', checkRegNo);

// Get user profile by ID
router.get('/:id', requireAuth, getUser);

export default router;
