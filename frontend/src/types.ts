export interface PatientData {
  _id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  medicalHistory: string;
  allergies: string;
}

export interface DoctorData {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

export interface MedicalRecord {
  _id: string;
  recordDate: string;
  diagnosis: string;
  observations: string;
  recommendedTreatment: string;
  doctorId: string;
  patientId: string;
}

export interface Prescription {
  _id: string;
  medicalRecordId: string;
  medications: string;
  dosage: string;
  observations: string;
}

export interface DocumentData {
  _id: string;
  documentType: string;
  documentPath: string;
  uploadedAt: string;
}

export interface AppointmentPacient {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface AppointmentDoctor {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface Appointment {
  _id: string;
  patientId: AppointmentPacient;
  doctorId: AppointmentDoctor;
  appointmentDate: string;
  time: string;
  status: string;
  notes: string;
}

export interface Recommendation {
  _id: string;
  patientId: string;
  doctorId: string;
  content: string;
  issuedDate: string;
}
