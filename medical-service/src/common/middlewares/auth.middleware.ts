import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import { ResourceInvalidError } from '../errors/errors';

// JWT-only auth middleware — no DB lookup needed
// The JWT payload contains the full user object from Auth Service
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

    // Set user from JWT payload (no DB lookup)
    req.user = decodedToken._doc || decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};
