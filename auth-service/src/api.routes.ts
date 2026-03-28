import { Router } from 'express';
import authRouter from './routes/auth.routes';
import tokenRouter from './routes/token.routes';
import adminRouter from './routes/admin.routes';
import { createActivityLogInternal } from './controllers/internal.log.controller';

const router = Router();

router.use('/auth', authRouter);
router.use('/confirm', tokenRouter);
router.use('/admin', adminRouter);
router.post('/internal/log', createActivityLogInternal);

export default router;
