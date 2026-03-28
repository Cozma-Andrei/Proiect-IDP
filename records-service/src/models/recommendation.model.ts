import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  content: string;
  issuedDate: Date;
}

const RecommendationSchema = new Schema<IRecommendation>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  content: { type: String, required: true },
  issuedDate: { type: Date, required: true },
}, { timestamps: false });

const Recommendation = mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
export default Recommendation;
