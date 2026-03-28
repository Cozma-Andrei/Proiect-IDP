import { Router } from 'express';
import { createPatient, getPatientProfile, updatePatientProfile, viewMedicalData } from '../controllers/patient.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const patientRouter = Router();

patientRouter.post('/', authenticateUser, createPatient);
patientRouter.get('/profile', authenticateUser, getPatientProfile);
patientRouter.put('/profile', authenticateUser, updatePatientProfile);
patientRouter.get('/medical-data', authenticateUser, viewMedicalData);
patientRouter.get('/medical-data/:patientId', authenticateUser, viewMedicalData);

export default patientRouter;
