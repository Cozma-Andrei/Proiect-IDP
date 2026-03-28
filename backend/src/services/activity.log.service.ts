import { Request } from 'express';
import ActivityLog from '../models/activity.log.model';

export const logActivity = async (
  req: Request,
  action: string,
  entity: string,
  entityId: string = '',
  details: string = ''
) => {
  try {
    const userId = req.user?._id;
    const username = req.user?.username || req.user?.email || 'unknown';
    const ipAddress = req.ip || req.socket?.remoteAddress || '';

    await ActivityLog.create({
      userId,
      username,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    // Nu blocăm fluxul principal dacă logarea eșuează
    console.error('[ActivityLog] Eroare la salvarea log-ului:', err);
  }
};
