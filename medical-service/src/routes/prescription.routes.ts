import { Router } from 'express';
import { createPrescription, getPatientPrescriptions, getPrescriptionById, updatePrescription } from '../controllers/prescription.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const prescriptionRouter = Router();

prescriptionRouter.post('/', authenticateUser, createPrescription);
prescriptionRouter.get('/patient', authenticateUser, getPatientPrescriptions);
prescriptionRouter.get('/:prescriptionId', authenticateUser, getPrescriptionById);
prescriptionRouter.put('/:prescriptionId', authenticateUser, updatePrescription);

export default prescriptionRouter;
