import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import MedicalRecord from '../models/medical.record.model';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const createMedicalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordSchema = Joi.object({
      patientId: Joi.string().required().messages(validationMessages),
      diagnosis: Joi.string().required().messages(validationMessages),
      observations: Joi.string().required().messages(validationMessages),
      recommendedTreatment: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = recordSchema.validate(req.body);
    if (error) throw error;

    const { patientId, diagnosis, observations, recommendedTreatment } = req.body;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctor profile not found or not verified');
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new ResourceNotFoundError('Patient not found');
    }

    const medicalRecord = new MedicalRecord({
      patientId,
      doctorId: doctor._id,
      recordDate: new Date(),
      diagnosis,
      observations,
      recommendedTreatment
    });

    await medicalRecord.save();

    res.status(201).send({ 
      message: 'Medical record created successfully',
      medicalRecord: {
        id: medicalRecord._id,
        date: medicalRecord.recordDate,
        diagnosis: medicalRecord.diagnosis
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientMedicalRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
    }

    const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ recordDate: -1 });

    res.status(200).send({ medicalRecords });
  } catch (error) {
    next(error);
  }
};

export const getMedicalRecordsByPatientId = async (req: Request, res: Response, next: NextFunction) => {
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

    const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ recordDate: -1 });

    res.status(200).send({ medicalRecords });
  } catch (error) {
    next(error);
  }
};

export const getMedicalRecordById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordId = req.params.recordId;
    
    const medicalRecord = await MedicalRecord.findById(recordId)
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName birthDate');
    
    if (!medicalRecord) {
      throw new ResourceNotFoundError('Medical record not found');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    
    const isPatient = patient && patient._id.equals(medicalRecord.patientId);
    const isDoctor = doctor && (doctor._id.equals(medicalRecord.doctorId) || doctor.isVerified);
    
    if (!isPatient && !isDoctor && req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to access this medical record');
    }

    res.status(200).send({ medicalRecord });
  } catch (error) {
    next(error);
  }
};

export const updateMedicalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordId = req.params.recordId;
    
    const recordSchema = Joi.object({
      diagnosis: Joi.string().messages(validationMessages),
      observations: Joi.string().messages(validationMessages),
      recommendedTreatment: Joi.string().messages(validationMessages),
    }).unknown(true);

    const { error } = recordSchema.validate(req.body);
    if (error) throw error;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctor profile not found or not verified');
    }

    const medicalRecord = await MedicalRecord.findOne({ _id: recordId, doctorId: doctor._id });
    if (!medicalRecord) {
      throw new ResourceNotFoundError('Medical record not found or you do not have permission to update it');
    }

    if (req.body.diagnosis) medicalRecord.diagnosis = req.body.diagnosis;
    if (req.body.observations) medicalRecord.observations = req.body.observations;
    if (req.body.recommendedTreatment) medicalRecord.recommendedTreatment = req.body.recommendedTreatment;
    
    await medicalRecord.save();

    res.status(200).send({ 
      message: 'Medical record updated successfully',
      medicalRecord: {
        id: medicalRecord._id,
        date: medicalRecord.recordDate,
        diagnosis: medicalRecord.diagnosis
      }
    });
  } catch (error) {
    next(error);
  }
};
