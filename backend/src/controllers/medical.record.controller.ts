import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import MedicalRecord from '../models/medical.record.model';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import { logActivity } from '../services/activity.log.service';

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
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new ResourceNotFoundError('Pacientul nu a fost găsit');
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

    logActivity(req, 'CREATE_RECORD', 'MedicalRecord', medicalRecord._id.toString(), `Diagnostic: ${diagnosis}`);

    res.status(201).send({ 
      message: 'Înregistrarea medicală a fost creată cu succes',
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
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
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
      throw new ResourceNotFoundError('Înregistrarea medicală nu a fost găsită');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    
    const isPatient = patient && patient._id.equals(medicalRecord.patientId);
    const isDoctor = doctor && (doctor._id.equals(medicalRecord.doctorId) || doctor.isVerified);
    
    if (!isPatient && !isDoctor && req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a accesa această înregistrare medicală');
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
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    const medicalRecord = await MedicalRecord.findOne({ _id: recordId, doctorId: doctor._id });
    if (!medicalRecord) {
      throw new ResourceNotFoundError('Înregistrarea medicală nu a fost găsită sau nu aveți permisiunea de a o actualiza');
    }

    if (req.body.diagnosis) medicalRecord.diagnosis = req.body.diagnosis;
    if (req.body.observations) medicalRecord.observations = req.body.observations;
    if (req.body.recommendedTreatment) medicalRecord.recommendedTreatment = req.body.recommendedTreatment;
    
    await medicalRecord.save();

    res.status(200).send({ 
      message: 'Înregistrarea medicală a fost actualizată cu succes',
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
