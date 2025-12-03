import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('username').isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
  ]),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  authController.login
);

router.post(
  '/verify-2fa',
  authLimiter,
  validate([
    body('userId').isUUID(),
    body('token').isLength({ min: 6, max: 6 }),
  ]),
  authController.verifyTwoFactor
);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

router.post('/2fa/setup', authenticate, authController.setupTwoFactor);

router.post(
  '/2fa/enable',
  authenticate,
  validate([
    body('token').isLength({ min: 6, max: 6 }),
  ]),
  authController.enableTwoFactor
);

router.post('/2fa/disable', authenticate, authController.disableTwoFactor);

router.post(
  '/change-password',
  authenticate,
  validate([
    body('oldPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ]),
  authController.changePassword
);

export default router;
