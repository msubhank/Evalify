import express from 'express';
import { syncUser, getUser, checkRegNo } from '../controllers/authController.js';

const router = express.Router();

// Synchronize Supabase user into Postgres (called right after signup)
router.post('/sync', syncUser);

// Check if regNo already exists
router.get('/check-regno/:regNo', checkRegNo);

// Get user profile by ID
router.get('/:id', getUser);

export default router;
