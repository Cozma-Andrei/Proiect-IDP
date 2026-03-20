import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Message from '../models/message.model';
import User from '../models/user.model';
import Doctor from '../models/doctor.model';
import Patient from '../models/patient.model';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messageSchema = Joi.object({
      receiverId: Joi.string().required().messages(validationMessages),
      content: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = messageSchema.validate(req.body);
    if (error) throw error;

    const { receiverId, content } = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new ResourceNotFoundError('Receiver not found');
    }

    const message = new Message({
      senderId: req.user?._id,
      receiverId,
      content,
      sentAt: new Date(),
    });

    await message.save();

    res.status(201).send({ 
      message: 'Message sent successfully',
      sentMessage: {
        id: message._id,
        content: message.content,
        sentAt: message.sentAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const otherUserId = req.params.userId;

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      throw new ResourceNotFoundError('User not found');
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    }).sort({ sentAt: 1 });

    res.status(200).send({ messages });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ sentAt: -1 });

    const conversationPartnersMap = new Map();
    
    for (const message of messages) {
      const partnerId = message.senderId.equals(userId) ? message.receiverId : message.senderId;
      const partnerIdStr = partnerId.toString();
      
      if (!conversationPartnersMap.has(partnerIdStr)) {
        const partner = await User.findById(partnerId).select('username');
        
        let partnerDetails = null;
        const isDoctor = await Doctor.findOne({ userAccountId: partnerId }).select('firstName lastName specialization');
        const isPatient = await Patient.findOne({ userAccountId: partnerId }).select('firstName lastName');
        
        if (isDoctor) {
          partnerDetails = {
            ...isDoctor.toObject(),
            role: 'Doctor'
          };
        } else if (isPatient) {
          partnerDetails = {
            ...isPatient.toObject(),
            role: 'Patient'
          };
        }

        conversationPartnersMap.set(partnerIdStr, {
          userId: partnerId,
          username: partner?.username,
          lastMessage: {
            content: message.content,
            sentAt: message.sentAt,
            isIncoming: !message.senderId.equals(userId)
          },
          details: partnerDetails
        });
      }
    }

    const conversations = Array.from(conversationPartnersMap.values());
    
    res.status(200).send({ conversations });
  } catch (error) {
    next(error);
  }
};

export const markMessageAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messageId = req.params.messageId;
    
    const message = await Message.findById(messageId);
    if (!message) {
      throw new ResourceNotFoundError('Message not found');
    }

    if (!message.receiverId.equals(req.user?._id)) {
      throw new ResourceNotFoundError('You do not have permission to mark this message as read');
    }

    await message.save();

    res.status(200).send({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};
