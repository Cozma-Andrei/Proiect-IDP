import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  action: { type: String, required: true, enum: [
    'LOGIN', 'REGISTER', 'LOGOUT',
    'CREATE_PATIENT', 'UPDATE_PATIENT',
    'CREATE_DOCTOR', 'UPDATE_DOCTOR', 'VERIFY_DOCTOR',
    'UPLOAD_DOCUMENT', 'DELETE_DOCUMENT', 'DOWNLOAD_DOCUMENT',
    'CREATE_RECORD', 'UPDATE_RECORD',
    'CREATE_PRESCRIPTION',
    'CREATE_RECOMMENDATION',
    'CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT',
    'UPDATE_ROLE', 'DEACTIVATE_USER',
    'SEND_MESSAGE',
  ]},
  entity: { type: String, required: true },
  entityId: { type: String, default: '' },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

// Index for efficient querying by date range
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
