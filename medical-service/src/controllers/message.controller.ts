import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { recordsApi } from '../services/http.client';
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

    const response = await recordsApi.post('/messages', {
      senderId: req.user?._id,
      receiverId,
      content,
      sentAt: new Date(),
    });

    const message = response.data.data;
    res.status(201).send({
      message: 'Mesajul a fost trimis cu succes',
      sentMessage: { id: message._id, content: message.content, sentAt: message.sentAt }
    });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const otherUserId = req.params.userId;

    const response = await recordsApi.get('/messages', {
      params: { senderId: userId, receiverId: otherUserId, sort: 'sentAt' }
    });

    res.status(200).send({ messages: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    const response = await recordsApi.get('/messages', {
      params: { userId, sort: '-sentAt' }
    });

    const messages = response.data.data;
    const conversationPartnersMap = new Map();

    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partnerIdStr = partnerId.toString();

      if (!conversationPartnersMap.has(partnerIdStr)) {
        // Look up partner details from Records Service
        let partnerDetails = null;
        try {
          const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: partnerId } });
          if (doctorResp.data.data.length > 0) {
            const doc = doctorResp.data.data[0];
            partnerDetails = { firstName: doc.firstName, lastName: doc.lastName, specialization: doc.specialization, role: 'Doctor' };
          }
        } catch (e) {}

        if (!partnerDetails) {
          try {
            const patientResp = await recordsApi.get('/patients', { params: { userAccountId: partnerId } });
            if (patientResp.data.data.length > 0) {
              const pat = patientResp.data.data[0];
              partnerDetails = { firstName: pat.firstName, lastName: pat.lastName, role: 'Patient' };
            }
          } catch (e) {}
        }

        conversationPartnersMap.set(partnerIdStr, {
          userId: partnerId,
          username: partnerDetails ? `${partnerDetails.firstName} ${partnerDetails.lastName}` : partnerId,
          lastMessage: {
            content: message.content,
            sentAt: message.sentAt,
            isIncoming: message.senderId !== userId
          },
          details: partnerDetails
        });
      }
    }

    res.status(200).send({ conversations: Array.from(conversationPartnersMap.values()) });
  } catch (error) {
    next(error);
  }
};

export const markMessageAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messageId = req.params.messageId;
    const msgResp = await recordsApi.get(`/messages/${messageId}`);
    const msg = msgResp.data.data;
    if (!msg) throw new ResourceNotFoundError('Mesajul nu a fost găsit');

    if (msg.receiverId.toString() !== req.user?._id?.toString()) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a marca acest mesaj ca fiind citit');
    }

    await recordsApi.put(`/messages/${messageId}`, { isRead: true });
    res.status(200).send({ message: 'Mesaj marcat ca citit' });
  } catch (error) {
    next(error);
  }
};

export const getContactDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactId = req.params.userId;
    let partnerDetails = null;

    try {
      const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: contactId } });
      if (doctorResp.data.data.length > 0) {
        const doc = doctorResp.data.data[0];
        partnerDetails = { firstName: doc.firstName, lastName: doc.lastName, specialization: doc.specialization, role: 'Doctor' };
      }
    } catch (e) {}

    if (!partnerDetails) {
      try {
        const patientResp = await recordsApi.get('/patients', { params: { userAccountId: contactId } });
        if (patientResp.data.data.length > 0) {
          const pat = patientResp.data.data[0];
          partnerDetails = { firstName: pat.firstName, lastName: pat.lastName, role: 'Patient' };
        }
      } catch (e) {}
    }

    res.status(200).send({
      userId: contactId,
      username: partnerDetails ? `${partnerDetails.firstName} ${partnerDetails.lastName}` : contactId,
      details: partnerDetails
    });
  } catch (error) {
    next(error);
  }
};
