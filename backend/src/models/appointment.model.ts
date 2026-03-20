import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  time: string;
  status: string;
  notes: string;
}

const AppointmentSchema = new Schema<IAppointment>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentDate: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, required: true },
  notes: { type: String, required: true },
}, { timestamps: false });

const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export default Appointment;
