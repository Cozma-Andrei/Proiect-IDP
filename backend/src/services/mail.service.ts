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
    subject: 'Confirmare Înregistrare - CareLog',
    text: `Vă rugăm să vă confirmați înregistrarea accesând următorul link:\n\n${process.env.FRONTEND_URL}/confirm-registration/${token}`,
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
    subject: 'Cerere Resetare Parolă - CareLog',
    text: `Ați solicitat resetarea parolei. Vă rugăm să accesați următorul link pentru a alege o nouă parolă:\n\n${process.env.FRONTEND_URL}/reset-password/${token}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error('Failed to send password reset email');
  }
};
