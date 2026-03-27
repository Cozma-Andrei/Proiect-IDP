import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/user.model';
import { sendRegistrationConfirmationEmail, sendPasswordResetEmail } from '../services/mail.service';
import { ResourceConflictError, ResourceNotFoundError, ResourceInvalidError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const registerSchema = Joi.object({
      username: Joi.string().min(3).max(30).required().messages(validationMessages),
      email: Joi.string().email().required().messages(validationMessages),
      password: Joi.string().min(8).required().messages(validationMessages),
    }).unknown(true); // Allows other fields in `req.body`

    const { error } = registerSchema.validate(req.body);
    if (error) throw error;

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ResourceConflictError('Email-ul este deja înregistrat');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'User',
    });

    await user.save();

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET nu este definit în variabilele de mediu');
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '24h' });

    await sendRegistrationConfirmationEmail(email, token);

    res.status(201).send({ message: 'Utilizator înregistrat cu succes, vă rugăm să vă verificați email-ul pentru confirmare.' });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginSchema = Joi.object({
      email: Joi.string().email().required().messages(validationMessages),
      password: Joi.string().min(8).required().messages(validationMessages),
    }).unknown(true); // Allows other fields in `req.body`

    const { error } = loginSchema.validate(req.body);
    if (error) throw error;

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isConfirmed) {
      throw new ResourceNotFoundError('Email sau parolă incorecte');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ResourceNotFoundError('Email sau parolă incorecte');
    }

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET nu este definit în variabilele de mediu');
    }

    const token = jwt.sign({ ...user }, jwtSecret, { expiresIn: '24h' });

    res.status(200).send({
      message: 'Autentificare cu succes',
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resetPasswordSchema = Joi.object({
      email: Joi.string().email().required().messages(validationMessages),
    }).unknown(true); // Allows other fields in `req.body`

    const { error } = resetPasswordSchema.validate(req.body);
    if (error) throw error;

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isConfirmed) {
      throw new ResourceNotFoundError('Email-ul nu a fost găsit');
    }

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET nu este definit în variabilele de mediu');
    }

    const resetToken = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '24h' });

    await sendPasswordResetEmail(email, resetToken);

    res.status(200).send({ message: 'Email-ul pentru resetarea parolei a fost trimis, vă rugăm să verificați.' });
  } catch (error) {
    next(error);
  }
};
