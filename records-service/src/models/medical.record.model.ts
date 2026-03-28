import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  recordDate: Date;
  diagnosis: string;
  observations: string;
  recommendedTreatment: string;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  recordDate: { type: Date, required: true },
  diagnosis: { type: String, required: true },
  observations: { type: String, required: true },
  recommendedTreatment: { type: String, required: true },
}, { timestamps: false });

const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
export default MedicalRecord;
