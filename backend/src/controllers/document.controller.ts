import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import fs from 'fs';
import Document from '../models/document.model';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
import { ResourceNotFoundError, ResourceInvalidError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ResourceInvalidError('No file uploaded');
    }

    const documentSchema = Joi.object({
      documentType: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = documentSchema.validate(req.body);
    if (error) throw error;

    const { documentType } = req.body;
    const documentPath = req.file.path;

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
    }

    const document = new Document({
      patientId: patient._id,
      documentType,
      documentPath,
      uploadedAt: new Date(),
    });

    await document.save();

    res.status(201).send({ 
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        documentType: document.documentType,
        uploadedAt: document.uploadedAt,
      }
    });
  } catch (error) {
    // If there was an error and a file was uploaded, remove it
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    next(error);
  }
};

export const getPatientDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
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
      throw new ResourceNotFoundError('Doctor profile not found or not verified');
    }

    let patients: any[] = [];

    if (req.user?.role === 'Admin' || req.user?.role === 'Doctor') {
      patients = await Patient.find({});
    }

    const identifier = patientId;
    const patient = patients.find(p => {
      const fn = p.firstName?.toLowerCase() || '';
      const ln = p.lastName?.toLowerCase() || '';
      const phone = p.phone || '';
      const idLower = identifier.toLowerCase();

      return (
        fn.includes(idLower) ||
        ln.includes(idLower) ||
        phone.includes(identifier) ||
        idLower.includes(fn) ||
        idLower.includes(ln) ||
        identifier.includes(phone)
      );
    });

    if (!patient) {
      throw new ResourceNotFoundError('Patient not found');
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
      throw new ResourceNotFoundError('Document not found');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    
    const isPatient = patient && patient._id.equals(document.patientId);
    const isDoctor = doctor && doctor.isVerified;
    
    if (!isPatient && !isDoctor && req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to access this document');
    }

    const filePath = document.documentPath;
    if (!fs.existsSync(filePath)) {
      throw new ResourceNotFoundError('Document file not found');
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.documentId;
    
    const document = await Document.findById(documentId);
    if (!document) {
      throw new ResourceNotFoundError('Document not found');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient || !patient._id.equals(document.patientId)) {
      throw new ResourceNotFoundError('You do not have permission to delete this document');
    }

    const filePath = document.documentPath;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(documentId);

    res.status(200).send({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};
