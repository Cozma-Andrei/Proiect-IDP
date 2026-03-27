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
      throw new ResourceInvalidError('Token-ul este obligatoriu');
    }

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET nu este definit în variabilele de mediu');
    }

    const decodedToken = jwt.verify(token, jwtSecret) as { userId: string };

    const user = await User.findById(decodedToken.userId);
    if (!user) {
      throw new ResourceNotFoundError('Utilizatorul nu a fost găsit');
    }

    if (user.isConfirmed) {
      return res.status(400).send({ message: 'Utilizatorul este deja confirmat' });
    }

    user.isConfirmed = true;
    await user.save();

    res.status(200).send({ message: 'Înregistrarea a fost confirmată cu succes' });
  } catch (error) {
    next(error);
  }
};

export const confirmResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query?.token as string;
    if (!token) {
      throw new ResourceInvalidError('Token-ul este obligatoriu');
    }

    const resetPasswordSchema = Joi.object({
      password: Joi.string().min(8).required().messages(validationMessages),
    }).unknown(true); // Allows other fields in `req.body`

    const { error } = resetPasswordSchema.validate(req.body);
    if (error) throw error;

    const { password } = req.body;

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET nu este definit în variabilele de mediu');
    }

    const decodedToken = jwt.verify(token, jwtSecret) as { userId: string };

    const user = await User.findById(decodedToken.userId);
    if (!user) {
      throw new ResourceNotFoundError('Utilizatorul nu a fost găsit');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send({ message: 'Parola a fost resetată cu succes' });
  } catch (error) {
    next(error);
  }
};
