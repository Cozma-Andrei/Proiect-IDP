import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import fs from 'fs';
import { Readable } from 'stream';
import Document from '../models/document.model';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
import { ResourceNotFoundError, ResourceInvalidError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import { uploadToS3, deleteFromS3, getS3ObjectStream } from '../services/aws.s3.service';
import { logActivity } from '../services/activity.log.service';

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
    
    const documentPath = await uploadToS3(req.file.buffer, req.file.mimetype, req.file.originalname);

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const document = new Document({
      patientId: patient._id,
      documentType,
      documentPath,
      originalName: req.file.originalname,
      storageType: 's3',
      uploadedAt: new Date(),
    });

    await document.save();

    logActivity(req, 'UPLOAD_DOCUMENT', 'Document', document._id.toString(), `Încărcat: ${documentType} (${req.file.originalname})`);

    res.status(201).send({ 
      message: 'Documentul a fost încărcat cu succes',
      document: {
        id: document._id,
        documentType: document.documentType,
        uploadedAt: document.uploadedAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const documents = await Document.find({ patientId: patient._id })
      .sort({ uploadedAt: -1 });

    res.status(200).send({ documents });
  } catch (error) {
    next(error);
  }
};

export const getPatientDocumentsByDoctorView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    let patient = await Patient.findOne({ nationalId: patientId });
    if (!patient) {
      try {
        patient = await Patient.findById(patientId);
      } catch (e) {}
    }

    if (!patient) {
      throw new ResourceNotFoundError('Pacientul nu a fost găsit');
    }

    const documents = await Document.find({ patientId: patient._id })
      .sort({ uploadedAt: -1 });

    res.status(200).send({ documents });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.documentId;
    
    const document = await Document.findById(documentId);
    if (!document) {
      console.error(`[getDocumentById] Document not found in DB: ${documentId}`);
      throw new ResourceNotFoundError('Documentul nu a fost găsit');
    }

    console.log(`[getDocumentById] Document found: ${documentId}, storageType: ${document.storageType}, path: ${document.documentPath}`);

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    
    const isPatient = patient && patient._id.equals(document.patientId);
    const isDoctor = doctor && doctor.isVerified;
    
    console.log(`[getDocumentById] patient: ${patient?._id}, isPatient(owner): ${isPatient}, isDoctor: ${isDoctor}, role: ${req.user?.role}`);

    if (!isPatient && !isDoctor && req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a accesa acest document');
    }

    const filePath = document.documentPath;

    // Determine storage type from model field
    if (document.storageType === 'local') {
      if (!fs.existsSync(filePath)) {
        throw new ResourceNotFoundError('Fișierul documentului nu a fost găsit local');
      }
      return res.download(filePath);
    }

    try {
      const s3Response = await getS3ObjectStream(filePath);
      
      if (s3Response.ContentType) {
        res.setHeader('Content-Type', s3Response.ContentType);
      }
      if (s3Response.ContentLength) {
        res.setHeader('Content-Length', s3Response.ContentLength);
      }

      const fileName = document.originalName || filePath.split('/').pop() || 'document.pdf';
      const safeFileName = fileName.replace(/[^\x20-\x7E]/g, '_');
      res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      
      const stream = s3Response.Body as Readable;
      stream.pipe(res);
    } catch (err: any) {
      console.error('Eroare S3 download:', err);
      throw new ResourceNotFoundError('Fișierul documentului nu a fost găsit în Amazon S3');
    }
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.documentId;
    
    const document = await Document.findById(documentId);
    if (!document) {
      throw new ResourceNotFoundError('Documentul nu a fost găsit');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient || !patient._id.equals(document.patientId)) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a șterge acest document');
    }

    const filePath = document.documentPath;
    
    if (document.storageType === 'local') {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      try {
        await deleteFromS3(filePath);
      } catch (err) {
        console.error('S3 Delete Error', err);
      }
    }

    await Document.findByIdAndDelete(documentId);

    res.status(200).send({ message: 'Documentul a fost șters cu succes' });
  } catch (error) {
    next(error);
  }
};
