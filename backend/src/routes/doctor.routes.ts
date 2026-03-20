import { Router } from 'express';
import { createDoctorProfile, getDoctorProfile, updateDoctorProfile, getAllDoctors, getDoctorById } from '../controllers/doctor.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const doctorRouter = Router();

doctorRouter.get('/all', getAllDoctors);
doctorRouter.post('/', authenticateUser, createDoctorProfile);
doctorRouter.get('/profile', authenticateUser, getDoctorProfile);
doctorRouter.put('/profile', authenticateUser, updateDoctorProfile);
doctorRouter.get('/:doctorId', getDoctorById);

export default doctorRouter;
