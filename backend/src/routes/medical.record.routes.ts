import { Router } from 'express';
import { createMedicalRecord, getPatientMedicalRecords, getMedicalRecordsByPatientId, getMedicalRecordById, updateMedicalRecord } from '../controllers/medical.record.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const medicalRecordRouter = Router();

medicalRecordRouter.post('/', authenticateUser, createMedicalRecord);
medicalRecordRouter.get('/patient', authenticateUser, getPatientMedicalRecords);
medicalRecordRouter.get('/patient/:patientId', authenticateUser, getMedicalRecordsByPatientId);
medicalRecordRouter.get('/:recordId', authenticateUser, getMedicalRecordById);
medicalRecordRouter.put('/:recordId', authenticateUser, updateMedicalRecord);

export default medicalRecordRouter;
