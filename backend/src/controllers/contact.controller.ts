import { Request, Response, NextFunction } from 'express';
import { sendContactEmail } from '../services/mail.service';

export const sendContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, message } = req.body;

  try {
    await sendContactEmail(firstName, lastName, email, message);
    res.status(200).send({ message: 'Mesajul dumneavoastră a fost trimis cu succes.' });
  } catch (error) {
    next(error);
  }
};
