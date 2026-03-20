import { Router } from 'express';
import { createAppointment, getPatientAppointments, getDoctorAppointments, updateAppointmentStatus, cancelAppointment, getAvailableSlots, createAppointmentForPatient } from '../controllers/appointment.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const appointmentRouter = Router();

appointmentRouter.post('/', authenticateUser, createAppointment);
appointmentRouter.post('/for-patient', authenticateUser, createAppointmentForPatient);
appointmentRouter.get('/patient', authenticateUser, getPatientAppointments);
appointmentRouter.get('/doctor', authenticateUser, getDoctorAppointments);
appointmentRouter.put('/:appointmentId/status', authenticateUser, updateAppointmentStatus);
appointmentRouter.put('/:appointmentId/cancel', authenticateUser, cancelAppointment);
appointmentRouter.get('/available-slots', authenticateUser, getAvailableSlots);

export default appointmentRouter;
