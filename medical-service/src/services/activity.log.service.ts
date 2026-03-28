import { Request } from 'express';
import { authApi } from './http.client';

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

    // Fire and forget (don't wait for response)
    authApi.post('/internal/log', {
      userId,
      username,
      action,
      entity,
      entityId,
      details,
      ipAddress,
    }).catch(err => {
      console.error('[Medical Service ActivityLog] Remote log error:', err.message);
    });
  } catch (err) {
    console.error('[Medical Service ActivityLog] Local logic error:', err);
  }
};
