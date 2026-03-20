import { Router } from 'express';
import adminRouter from './routes/admin.routes';
import appointmentRouter from './routes/appointment.routes';
import authRouter from './routes/auth.routes';
import contactRouter from './routes/contact.routes';
import doctorRouter from './routes/doctor.routes';
import documentRouter from './routes/document.routes';
import medicalRecordRouter from './routes/medical.record.routes';
import messageRouter from './routes/message.routes';
import patientRouter from './routes/patient.routes';
import prescriptionRouter from './routes/prescription.routes';
import recommendationRouter from './routes/recommendation.routes';
import tokenRouter from './routes/token.routes';

const router = Router();

router.use('/admin', adminRouter);
router.use('/appointment', appointmentRouter);
router.use('/auth', authRouter);
router.use('/contact', contactRouter);
router.use('/doctor', doctorRouter);
router.use('/document', documentRouter);
router.use('/medicalRecord', medicalRecordRouter);
router.use('/message', messageRouter);
router.use('/patient', patientRouter);
router.use('/prescription', prescriptionRouter);
router.use('/recommendation', recommendationRouter);
router.use('/confirm', tokenRouter);

export default router;
