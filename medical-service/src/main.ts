import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import apiRouter from './api.routes';
import { errorHandler } from './common/errors/errors.utils';

dotenv.config();

const app = express();
const port = process.env.PORT || 5002;

app.enable('trust proxy');
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', apiRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[Medical Service] Running at http://localhost:${port}`);
});

export default app;
