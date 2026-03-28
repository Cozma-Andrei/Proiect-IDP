import { Router } from 'express';
import appointmentRouter from './routes/appointment.routes';
import doctorRouter from './routes/doctor.routes';
import documentRouter from './routes/document.routes';
import medicalRecordRouter from './routes/medical.record.routes';
import messageRouter from './routes/message.routes';
import patientRouter from './routes/patient.routes';
import prescriptionRouter from './routes/prescription.routes';
import recommendationRouter from './routes/recommendation.routes';

const router = Router();

router.use('/appointment', appointmentRouter);
router.use('/doctor', doctorRouter);
router.use('/document', documentRouter);
router.use('/medicalRecord', medicalRecordRouter);
router.use('/message', messageRouter);
router.use('/patient', patientRouter);
router.use('/prescription', prescriptionRouter);
router.use('/recommendation', recommendationRouter);

export default router;
