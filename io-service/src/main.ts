import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Registry, collectDefaultMetrics } from 'prom-client';
import { Router } from 'express';
import upload from './services/upload.service';
import { uploadFile, downloadFile, deleteFile } from './controllers/file.controller';
import { errorHandler } from './common/errors/errors.utils';

dotenv.config();

const app = express();
const port = process.env.PORT || 5004;

app.enable('trust proxy');
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const register = new Registry();
collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const router = Router();
router.post('/upload', upload.single('file'), uploadFile);
router.get('/download/:fileKey(*)', downloadFile);
router.delete('/delete/:fileKey(*)', deleteFile);

app.use('/', router);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[IO Service] Running at http://localhost:${port}`);
});

export default app;
