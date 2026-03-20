import mongoose, { Schema, Document } from "mongoose";

export interface IPatient extends Document {
    firstName: string;
    lastName: string;
    phone: string;
    birthDate: Date;
    gender: string;
    address: string;
    nationalId: string;
    medicalHistory: string;
    allergies: string;
    userAccountId: mongoose.Types.ObjectId;
}

const PatientSchema = new Schema<IPatient>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },
    medicalHistory: { type: String, required: true },
    allergies: { type: String, required: true },
    userAccountId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
}, { timestamps: false });

const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
export default Patient;
