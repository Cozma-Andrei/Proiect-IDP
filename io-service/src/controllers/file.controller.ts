import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import { uploadToS3, deleteFromS3, getS3ObjectStream } from '../services/aws.s3.service';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'Niciun fișier încărcat' });
    }

    const fileKey = await uploadToS3(req.file.buffer, req.file.mimetype, req.file.originalname);

    res.status(201).send({
      fileKey,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileKey = req.params.fileKey || req.query.fileKey as string;
    if (!fileKey) {
      return res.status(400).send({ message: 'fileKey is required' });
    }

    const s3Response = await getS3ObjectStream(fileKey);

    if (s3Response.ContentType) {
      res.setHeader('Content-Type', s3Response.ContentType);
    }
    if (s3Response.ContentLength) {
      res.setHeader('Content-Length', s3Response.ContentLength);
    }

    const fileName = req.query.fileName as string || fileKey.split('/').pop() || 'document';
    const safeFileName = fileName.replace(/[^\x20-\x7E]/g, '_');
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    const stream = s3Response.Body as Readable;
    stream.pipe(res);
  } catch (error: any) {
    console.error('Eroare S3 download:', error);
    res.status(404).send({ message: 'Fișierul nu a fost găsit în Amazon S3' });
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileKey = req.params.fileKey || req.query.fileKey as string;
    if (!fileKey) {
      return res.status(400).send({ message: 'fileKey is required' });
    }

    await deleteFromS3(fileKey);
    res.status(200).send({ message: 'Fișierul a fost șters cu succes' });
  } catch (error) {
    next(error);
  }
};
