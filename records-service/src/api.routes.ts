import { Router } from 'express';
import * as patientCtrl from './controllers/patient.controller';
import * as doctorCtrl from './controllers/doctor.controller';
import * as appointmentCtrl from './controllers/appointment.controller';
import * as medicalRecordCtrl from './controllers/medical.record.controller';
import * as prescriptionCtrl from './controllers/prescription.controller';
import * as recommendationCtrl from './controllers/recommendation.controller';
import * as messageCtrl from './controllers/message.controller';
import * as documentCtrl from './controllers/document.controller';

const router = Router();

// Patients
router.get('/patients', patientCtrl.findPatients);
router.get('/patients/count', patientCtrl.countPatients);
router.get('/patients/:id', patientCtrl.findPatientById);
router.post('/patients', patientCtrl.createPatient);
router.put('/patients/:id', patientCtrl.updatePatient);
router.delete('/patients/:id', patientCtrl.deletePatient);

// Doctors
router.get('/doctors', doctorCtrl.findDoctors);
router.get('/doctors/count', doctorCtrl.countDoctors);
router.get('/doctors/:id', doctorCtrl.findDoctorById);
router.post('/doctors', doctorCtrl.createDoctor);
router.put('/doctors/:id', doctorCtrl.updateDoctor);
router.delete('/doctors/:id', doctorCtrl.deleteDoctor);

// Appointments
router.get('/appointments', appointmentCtrl.findAppointments);
router.get('/appointments/count', appointmentCtrl.countAppointments);
router.get('/appointments/aggregate', appointmentCtrl.aggregateAppointments);
router.get('/appointments/:id', appointmentCtrl.findAppointmentById);
router.post('/appointments', appointmentCtrl.createAppointment);
router.put('/appointments/:id', appointmentCtrl.updateAppointment);
router.delete('/appointments/:id', appointmentCtrl.deleteAppointment);

// Medical Records
router.get('/medical-records', medicalRecordCtrl.findMedicalRecords);
router.get('/medical-records/count', medicalRecordCtrl.countMedicalRecords);
router.get('/medical-records/:id', medicalRecordCtrl.findMedicalRecordById);
router.post('/medical-records', medicalRecordCtrl.createMedicalRecord);
router.put('/medical-records/:id', medicalRecordCtrl.updateMedicalRecord);

// Prescriptions
router.get('/prescriptions', prescriptionCtrl.findPrescriptions);
router.get('/prescriptions/count', prescriptionCtrl.countPrescriptions);
router.get('/prescriptions/:id', prescriptionCtrl.findPrescriptionById);
router.post('/prescriptions', prescriptionCtrl.createPrescription);
router.put('/prescriptions/:id', prescriptionCtrl.updatePrescription);

// Recommendations
router.get('/recommendations', recommendationCtrl.findRecommendations);
router.get('/recommendations/:id', recommendationCtrl.findRecommendationById);
router.post('/recommendations', recommendationCtrl.createRecommendation);
router.put('/recommendations/:id', recommendationCtrl.updateRecommendation);

// Messages
router.get('/messages', messageCtrl.findMessages);
router.get('/messages/:id', messageCtrl.findMessageById);
router.post('/messages', messageCtrl.createMessage);
router.put('/messages/:id', messageCtrl.updateMessage);

// Documents (metadata only)
router.get('/documents', documentCtrl.findDocuments);
router.get('/documents/count', documentCtrl.countDocuments);
router.get('/documents/:id', documentCtrl.findDocumentById);
router.post('/documents', documentCtrl.createDocument);
router.delete('/documents/:id', documentCtrl.deleteDocument);

export default router;
