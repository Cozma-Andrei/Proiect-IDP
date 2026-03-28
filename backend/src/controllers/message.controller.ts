import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Message from '../models/message.model';
import User from '../models/user.model';
import Doctor from '../models/doctor.model';
import Patient from '../models/patient.model';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import { logActivity } from '../services/activity.log.service';

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
      throw new ResourceNotFoundError('Destinatarul nu a fost găsit');
    }

    const message = new Message({
      senderId: req.user?._id,
      receiverId,
      content,
      sentAt: new Date(),
    });

    await message.save();

    res.status(201).send({ 
      message: 'Mesajul a fost trimis cu succes',
      sentMessage: {
        id: message._id,
        content: message.content,
        sentAt: message.sentAt,
      }
    });

    logActivity(req, 'SEND_MESSAGE', 'Message', message._id.toString(), `Către: ${receiverId}`);
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
      throw new ResourceNotFoundError('Utilizatorul nu a fost găsit');
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
      throw new ResourceNotFoundError('Mesajul nu a fost găsit');
    }

    if (!message.receiverId.equals(req.user?._id)) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a marca acest mesaj ca fiind citit');
    }

    // Set as read
    message.isRead = true;
    await message.save();

    res.status(200).send({ message: 'Mesaj marcat ca citit' });
  } catch (error) {
    next(error);
  }
};

export const getContactDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactId = req.params.userId;
    const user = await User.findById(contactId).select('username');
    if (!user) {
      throw new ResourceNotFoundError('Contactul nu a fost găsit');
    }

    let partnerDetails = null;
    const isDoctor = await Doctor.findOne({ userAccountId: contactId }).select('firstName lastName specialization');
    const isPatient = await Patient.findOne({ userAccountId: contactId }).select('firstName lastName');
    
    if (isDoctor) {
      partnerDetails = { ...isDoctor.toObject(), role: 'Doctor' };
    } else if (isPatient) {
      partnerDetails = { ...isPatient.toObject(), role: 'Patient' };
    }

    res.status(200).send({
      userId: contactId,
      username: user.username,
      details: partnerDetails
    });
  } catch (error) {
    next(error);
  }
};
