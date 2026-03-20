import { Router } from 'express';
import { confirmRegistration, confirmResetPassword } from '../controllers/token.controller';

const tokenRouter = Router();

tokenRouter.get('/registration', confirmRegistration);
tokenRouter.post('/reset-password', confirmResetPassword);

export default tokenRouter;
