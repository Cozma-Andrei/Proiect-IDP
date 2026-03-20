import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Prescription from '../models/prescription.model';
import MedicalRecord from '../models/medical.record.model';
import Doctor from '../models/doctor.model';
import Patient from '../models/patient.model';
import { ResourceNotFoundError, ResourceConflictError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const createPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptionSchema = Joi.object({
      medicalRecordId: Joi.string().required().messages(validationMessages),
      medications: Joi.string().required().messages(validationMessages),
      dosage: Joi.string().required().messages(validationMessages),
      observations: Joi.string().allow('').required().messages(validationMessages),
    }).unknown(true);

    const { error } = prescriptionSchema.validate(req.body);
    if (error) throw error;

    const { medicalRecordId, medications, dosage, observations } = req.body;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctor profile not found or not verified');
    }

    const medicalRecord = await MedicalRecord.findById(medicalRecordId);
    if (!medicalRecord) {
      throw new ResourceNotFoundError('Medical record not found');
    }

    if (!medicalRecord.doctorId.equals(doctor._id)) {
      throw new ResourceNotFoundError('You do not have permission to create a prescription for this medical record');
    }

    const existingPrescription = await Prescription.findOne({ medicalRecordId });
    if (existingPrescription) {
      throw new ResourceConflictError('A prescription already exists for this medical record');
    }

    const prescription = new Prescription({
      medicalRecordId,
      medications,
      dosage,
      observations
    });

    await prescription.save();

    res.status(201).send({ 
      message: 'Prescription created successfully',
      prescription: {
        id: prescription._id,
        medications: prescription.medications,
        dosage: prescription.dosage
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
    }

    const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
      .select('_id recordDate');

    const medicalRecordIds = medicalRecords.map(record => record._id);
    const prescriptions = await Prescription.find({ medicalRecordId: { $in: medicalRecordIds } })
      .populate({
        path: 'medicalRecordId',
        select: 'recordDate diagnosis doctorId',
        populate: {
          path: 'doctorId',
          select: 'firstName lastName specialization'
        }
      })
      .sort({ 'medicalRecordId.recordDate': -1 });

    res.status(200).send({ prescriptions });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptionId = req.params.prescriptionId;
    
    const prescription = await Prescription.findById(prescriptionId)
      .populate({
        path: 'medicalRecordId',
        select: 'recordDate diagnosis doctorId patientId',
        populate: [
          {
            path: 'doctorId',
            select: 'firstName lastName specialization'
          },
          {
            path: 'patientId',
            select: 'firstName lastName birthDate'
          }
        ]
      });
    
    if (!prescription) {
      throw new ResourceNotFoundError('Prescription not found');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    
    const medicalRecord = prescription.medicalRecordId as any;
    
    const isPatient = patient && patient._id.equals(medicalRecord.patientId._id);
    const isDoctor = doctor && (doctor._id.equals(medicalRecord.doctorId._id) || doctor.isVerified);
    
    if (!isPatient && !isDoctor && req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to access this prescription');
    }

    res.status(200).send({ prescription });
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptionId = req.params.prescriptionId;
    
    const prescriptionSchema = Joi.object({
      medications: Joi.string().messages(validationMessages),
      dosage: Joi.string().messages(validationMessages),
      observations: Joi.string().allow('').messages(validationMessages),
    }).unknown(true);

    const { error } = prescriptionSchema.validate(req.body);
    if (error) throw error;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctor profile not found or not verified');
    }

    const prescription = await Prescription.findById(prescriptionId)
      .populate({
        path: 'medicalRecordId',
        select: 'doctorId'
      });
    
    if (!prescription) {
      throw new ResourceNotFoundError('Prescription not found');
    }

    const medicalRecord = prescription.medicalRecordId as any;
    if (!doctor._id.equals(medicalRecord.doctorId)) {
        throw new ResourceNotFoundError('You do not have permission to update this prescription');
    }

    if (req.body.medications) prescription.medications = req.body.medications;
    if (req.body.dosage) prescription.dosage = req.body.dosage;
    if (req.body.observations !== undefined) prescription.observations = req.body.observations;
    
    await prescription.save();

    res.status(200).send({ 
      message: 'Prescription updated successfully',
      prescription: {
        id: prescription._id,
        medications: prescription.medications,
        dosage: prescription.dosage
      }
    });
  } catch (error) {
    next(error);
  }
};
