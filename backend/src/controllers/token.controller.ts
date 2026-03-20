import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/user.model';
import { ResourceNotFoundError, ResourceInvalidError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const confirmRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query?.token as string;
    if (!token) {
      throw new ResourceInvalidError('Token is required');
    }

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET is not defined in the environment variables');
    }

    const decodedToken = jwt.verify(token, jwtSecret) as { userId: string };

    const user = await User.findById(decodedToken.userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    if (user.isConfirmed) {
      return res.status(400).send({ message: 'User is already confirmed' });
    }

    user.isConfirmed = true;
    await user.save();

    res.status(200).send({ message: 'Registration confirmed successfully' });
  } catch (error) {
    next(error);
  }
};

export const confirmResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query?.token as string;
    if (!token) {
      throw new ResourceInvalidError('Token is required');
    }

    const resetPasswordSchema = Joi.object({
      password: Joi.string().min(8).required().messages(validationMessages),
    }).unknown(true); // Allows other fields in `req.body`

    const { error } = resetPasswordSchema.validate(req.body);
    if (error) throw error;

    const { password } = req.body;

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET is not defined in the environment variables');
    }

    const decodedToken = jwt.verify(token, jwtSecret) as { userId: string };

    const user = await User.findById(decodedToken.userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
