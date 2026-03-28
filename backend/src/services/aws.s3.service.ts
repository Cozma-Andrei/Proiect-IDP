import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const region = process.env.AWS_REGION || 'eu-central-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

// Avoid instantiating S3Client if credentials are not provided (e.g. testing environments without S3)
const s3Client = (accessKeyId && secretAccessKey) 
  ? new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    })
  : null;

export const uploadToS3 = async (fileBuffer: Buffer, mimeType: string, originalName: string): Promise<string> => {
  if (!s3Client) throw new Error('AWS S3 Client is not configured. Check your .env variables.');
  
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');

  const fileExtension = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `documents/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimeType,
    ContentDisposition: `inline; filename="${safeName}"`,
  });

  await s3Client.send(command);
  return fileKey;
};

export const deleteFromS3 = async (fileKey: string): Promise<void> => {
  if (!s3Client) throw new Error('AWS S3 Client is not configured. Check your .env variables.');

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  await s3Client.send(command);
};

export const getS3ObjectStream = async (fileKey: string) => {
  if (!s3Client) throw new Error('AWS S3 Client is not configured. Check your .env variables.');

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  const response = await s3Client.send(command);
  return response;
};
