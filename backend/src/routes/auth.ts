import { Router } from 'express';
import { login, register } from '../controllers/auth';

const router = Router();

// Route mappings
router.post('/login', login);
router.post('/register', register);

export default router;
