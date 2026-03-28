import { Request, Response, NextFunction } from 'express';
import ActivityLog from '../models/activity.log.model';

export const createActivityLogInternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, username, action, entity, entityId, details, ipAddress } = req.body;

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

    res.status(201).send({ message: 'Log created' });
  } catch (error) {
    // Non-blocking log for internal errors
    console.error('[Auth Service Internal Log] Error:', error);
    res.status(500).send({ message: 'Internal error' });
  }
};
