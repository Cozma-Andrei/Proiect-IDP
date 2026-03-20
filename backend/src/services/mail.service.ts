import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.MAIL_USER?.trim(),
    pass: process.env.MAIL_PASS?.trim(),
  },
});

export const sendContactEmail = async (firstName: string, lastName: string, email: string, message: string) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject: `Contact message from ${firstName} ${lastName}`,
    text: `Message from: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error('Failed to send contact email');
  }
};

export const sendRegistrationConfirmationEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Registration Confirmation',
    text: `Please confirm your registration by clicking the following link:\n\n${process.env.FRONTEND_URL}/confirm-registration/${token}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error('Failed to send registration confirmation email');
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please click the following link to reset your password:\n\n${process.env.FRONTEND_URL}/reset-password/${token}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error('Failed to send password reset email');
  }
};
