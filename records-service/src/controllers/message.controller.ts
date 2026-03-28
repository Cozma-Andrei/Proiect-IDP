import { Request, Response, NextFunction } from 'express';
import Message from '../models/message.model';

export const findMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { senderId, receiverId, userId } = req.query;
    let filter: any = {};
    
    if (userId) {
      // Find all messages where user is either sender or receiver
      filter.$or = [
        { senderId: userId },
        { receiverId: userId }
      ];
    } else {
      if (senderId && receiverId) {
        // Find conversation between two users
        filter.$or = [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ];
      } else {
        if (senderId) filter.senderId = senderId;
        if (receiverId) filter.receiverId = receiverId;
      }
    }

    const sort = (req.query.sort as string) || 'sentAt';
    const messages = await Message.find(filter).sort(sort);
    res.status(200).send({ data: messages });
  } catch (error) {
    next(error);
  }
};

export const findMessageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: message });
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = new Message(req.body);
    await message.save();
    res.status(201).send({ data: message });
  } catch (error) {
    next(error);
  }
};

export const updateMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!message) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: message });
  } catch (error) {
    next(error);
  }
};
