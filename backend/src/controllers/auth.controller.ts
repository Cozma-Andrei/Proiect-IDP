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
      throw new ResourceConflictError('Email is already registered');
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
      throw new ResourceInvalidError('JWT_SECRET is not defined in the environment variables');
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '24h' });

    await sendRegistrationConfirmationEmail(email, token);

    res.status(201).send({ message: 'User registered successfully, please check your email for confirmation.' });
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
      throw new ResourceNotFoundError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ResourceNotFoundError('Invalid email or password');
    }

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET is not defined in the environment variables');
    }

    const token = jwt.sign({ ...user }, jwtSecret, { expiresIn: '24h' });

    res.status(200).send({
      message: 'Login successful',
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
      throw new ResourceNotFoundError('Email not found');
    }

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ResourceInvalidError('JWT_SECRET is not defined in the environment variables');
    }

    const resetToken = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '24h' });

    await sendPasswordResetEmail(email, resetToken);

    res.status(200).send({ message: 'Password reset email sent, please check your email.' });
  } catch (error) {
    next(error);
  }
};
