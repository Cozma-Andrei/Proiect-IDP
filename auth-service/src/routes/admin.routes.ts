import { Router } from 'express';
import { authenticateUser } from '../common/middlewares/auth.middleware';
import { verifyDoctor, getAllDoctors, getAllPatients, getAllUsers, getUserById, updateUserRole, deactivateUser, getSystemStats, getActivityLogs, getReport } from '../controllers/admin.controller';

const router = Router();

router.put('/doctors/:doctorId/verify', authenticateUser, verifyDoctor);
router.get('/doctors', authenticateUser, getAllDoctors);
router.get('/patients', authenticateUser, getAllPatients);
router.get('/users', authenticateUser, getAllUsers);
router.get('/users/:userId', authenticateUser, getUserById);
router.put('/users/:userId/role', authenticateUser, updateUserRole);
router.put('/users/:userId/deactivate', authenticateUser, deactivateUser);
router.get('/stats', authenticateUser, getSystemStats);
router.get('/activity-logs', authenticateUser, getActivityLogs);
router.get('/report', authenticateUser, getReport);

export default router;
