import { Router } from 'express';
import { verifyDoctor, getAllDoctors, getAllPatients, getAllUsers, getUserById, updateUserRole, deactivateUser, getSystemStats } from '../controllers/admin.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const adminRouter = Router();

adminRouter.put('/doctors/:doctorId/verify', authenticateUser, verifyDoctor);
adminRouter.get('/doctors', authenticateUser, getAllDoctors);
adminRouter.get('/patients', authenticateUser, getAllPatients);
adminRouter.get('/users', authenticateUser, getAllUsers);
adminRouter.get('/users/:userId', authenticateUser, getUserById);
adminRouter.put('/users/:userId/role', authenticateUser, updateUserRole);
adminRouter.put('/users/:userId/deactivate', authenticateUser, deactivateUser);
adminRouter.get('/stats', authenticateUser, getSystemStats);

export default adminRouter;
