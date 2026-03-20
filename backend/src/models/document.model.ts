import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  documentType: string;
  documentPath: string;
  uploadedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  documentType: { type: String, required: true },
  documentPath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: false });

const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
export default DocumentModel;
