import { Router } from 'express';
import { param } from 'express-validator';
import adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.listUsers);
router.patch('/users/:id', validate([param('id').isUUID()]), adminController.updateUser);
router.delete('/users/:id', validate([param('id').isUUID()]), adminController.deleteUser);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// System statistics
router.get('/stats', adminController.getSystemStats);
router.get('/storage-report', adminController.getStorageReport);

export default router;
