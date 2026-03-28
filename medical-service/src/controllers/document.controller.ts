import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Readable } from 'stream';
import { recordsApi, ioApi } from '../services/http.client';
import { ResourceNotFoundError, ResourceInvalidError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ResourceInvalidError('Niciun fișier încărcat');
    }

    const documentSchema = Joi.object({
      documentType: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = documentSchema.validate(req.body);
    if (error) throw error;

    const { documentType } = req.body;

    // Find patient
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (patientResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }
    const patient = patientResp.data.data[0];

    // Upload file to IO Service
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

    const ioResponse = await ioApi.post('/upload', formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const { fileKey } = ioResponse.data;

    // Save metadata to Records Service
    const docResponse = await recordsApi.post('/documents', {
      patientId: patient._id,
      documentType,
      documentPath: fileKey,
      originalName: req.file.originalname,
      storageType: 's3',
      uploadedAt: new Date(),
    });

    const document = docResponse.data.data;

    res.status(201).send({
      message: 'Documentul a fost încărcat cu succes',
      document: { id: document._id, documentType: document.documentType, uploadedAt: document.uploadedAt }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (patientResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const response = await recordsApi.get('/documents', { params: { patientId: patientResp.data.data[0]._id } });
    res.status(200).send({ documents: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getPatientDocumentsByDoctorView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId;

    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0 || !doctorResp.data.data[0].isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    // Find patient
    let patient = null;
    let resp = await recordsApi.get('/patients', { params: { nationalId: patientId } });
    if (resp.data.data.length > 0) patient = resp.data.data[0];
    if (!patient) {
      try { resp = await recordsApi.get(`/patients/${patientId}`); patient = resp.data.data; } catch (e) {}
    }
    if (!patient) throw new ResourceNotFoundError('Pacientul nu a fost găsit');

    const response = await recordsApi.get('/documents', { params: { patientId: patient._id } });
    res.status(200).send({ documents: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.documentId;

    const docResp = await recordsApi.get(`/documents/${documentId}`);
    const document = docResp.data.data;
    if (!document) throw new ResourceNotFoundError('Documentul nu a fost găsit');

    // Stream from IO Service
    const ioResponse = await ioApi.get(`/download/${document.documentPath}`, {
      responseType: 'stream',
      params: { fileName: document.originalName }
    });

    // Forward headers
    if (ioResponse.headers['content-type']) res.setHeader('Content-Type', ioResponse.headers['content-type']);
    if (ioResponse.headers['content-length']) res.setHeader('Content-Length', ioResponse.headers['content-length']);
    if (ioResponse.headers['content-disposition']) res.setHeader('Content-Disposition', ioResponse.headers['content-disposition']);

    ioResponse.data.pipe(res);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).send({ message: 'Fișierul documentului nu a fost găsit' });
    }
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.documentId;

    const docResp = await recordsApi.get(`/documents/${documentId}`);
    const document = docResp.data.data;
    if (!document) throw new ResourceNotFoundError('Documentul nu a fost găsit');

    // Delete file from IO Service
    try {
      await ioApi.delete(`/delete/${document.documentPath}`);
    } catch (err) {
      console.error('S3 Delete Error', err);
    }

    // Delete metadata from Records Service
    await recordsApi.delete(`/documents/${documentId}`);

    res.status(200).send({ message: 'Documentul a fost șters cu succes' });
  } catch (error) {
    next(error);
  }
};
