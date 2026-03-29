import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { Registry, collectDefaultMetrics } from 'prom-client';
import apiRouter from './api.routes';
import { errorHandler } from './common/errors/errors.utils';

dotenv.config();

const app = express();
const port = process.env.PORT || 5003;
const mongoPath = process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/careLog_medical';

app.enable('trust proxy');
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const register = new Registry();
collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/', apiRouter);
app.use(errorHandler);

mongoose
  .connect(mongoPath)
  .then(() => {
    console.log('[Records Service] Connected to Medical DB');
    app.listen(port, () => {
      console.log(`[Records Service] Running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('[Records Service] Database connection error:', err);
  });

export default app;
