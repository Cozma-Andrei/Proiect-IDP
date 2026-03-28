import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  firstName: string;
  lastName: string;
  specialization: string;
  phone: string;
  isVerified: boolean;
  availableSlots: string[];
  userAccountId: mongoose.Types.ObjectId;
}

const DoctorSchema = new Schema<IDoctor>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String, required: true },
  phone: { type: String, required: true },
  isVerified: { type: Boolean, required: true, default: false },
  availableSlots: { type: [String], default: [] },
  userAccountId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
}, { timestamps: false });

const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
export default Doctor;
