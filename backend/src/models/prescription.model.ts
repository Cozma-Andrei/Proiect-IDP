import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescription extends Document {
  medicalRecordId: mongoose.Types.ObjectId;
  medications: string;
  dosage: string;
  observations: string;
}

const PrescriptionSchema = new Schema<IPrescription>({
  medicalRecordId: { type: Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  medications: { type: String, required: true },
  dosage: { type: String, required: true },
  observations: { type: String, required: true },
}, { timestamps: false });

const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
export default Prescription;
