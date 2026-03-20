import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import apiRouter from './api.routes';
import { errorHandler } from './common/errors/errors.utils';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoPath = process.env.MONGO_URI || 'mongodb://0.0.0.0:27017/careLog';

app.enable('trust proxy');

if (process.env.NODE_ENV !== 'PROD') {
  app.use(cors());
}

app.use(express.json());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/', apiRouter);

app.use(errorHandler);

mongoose
  .connect(mongoPath)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

export default app;
