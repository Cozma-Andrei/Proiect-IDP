import { Router } from 'express';
import { sendContactMessage } from '../controllers/contact.controller';

const contactRouter = Router();

contactRouter.post('/', sendContactMessage);

export default contactRouter;
