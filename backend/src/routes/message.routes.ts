import { Router } from 'express';
import { sendMessage, getConversation, getConversations, markMessageAsRead } from '../controllers/message.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const messageRouter = Router();

messageRouter.post('/', authenticateUser, sendMessage);
messageRouter.get('/conversation/:userId', authenticateUser, getConversation);
messageRouter.get('/conversations', authenticateUser, getConversations);
messageRouter.put('/:messageId/read', authenticateUser, markMessageAsRead);

export default messageRouter;
