import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  documentType: string;
  documentPath: string;
  originalName: string;
  storageType: 'local' | 's3';
  uploadedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  documentType: { type: String, required: true },
  documentPath: { type: String, required: true },
  originalName: { type: String, default: '' },
  storageType: { type: String, enum: ['local', 's3'], default: 's3' },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: false });

const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
export default DocumentModel;
