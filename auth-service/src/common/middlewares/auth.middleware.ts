import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import User from '../../models/user.model';
import { ResourceInvalidError, ResourceNotFoundError } from '../errors/errors';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new ResourceInvalidError('Authorization token is missing');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET is not defined in environment variables');
    }

    jwt.verify(token, jwtSecret);
    const decodedToken: any = jwtDecode(token);

    const user = await User.findById(decodedToken._doc._id);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
