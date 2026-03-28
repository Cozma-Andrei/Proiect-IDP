import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import apiRouter from './api.routes';
import { errorHandler } from './common/errors/errors.utils';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const mongoPath = process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/careLog_auth';

app.enable('trust proxy');
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', apiRouter);
app.use(errorHandler);

mongoose
  .connect(mongoPath)
  .then(() => {
    console.log('[Auth Service] Connected to Auth DB');
    app.listen(port, () => {
      console.log(`[Auth Service] Running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('[Auth Service] Database connection error:', err);
  });

export default app;
