import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Patient from '../models/patient.model';
import { ResourceNotFoundError, ResourceConflictError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import User from '../models/user.model';

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientSchema = Joi.object({
      firstName: Joi.string().required().messages(validationMessages),
      lastName: Joi.string().required().messages(validationMessages),
      phone: Joi.string().pattern(/^\+?\d{10,15}$/).required().messages(validationMessages),
      birthDate: Joi.date().required().messages(validationMessages),
      gender: Joi.string().valid('Male', 'Female', 'Other').required().messages(validationMessages),
      address: Joi.string().required().messages(validationMessages),
      nationalId: Joi.string().required().messages(validationMessages),
      medicalHistory: Joi.string().allow('').required().messages(validationMessages),
      allergies: Joi.string().allow('').required().messages(validationMessages),
    }).unknown(true);

    const { error } = patientSchema.validate(req.body);
    if (error) throw error;

    const { firstName, lastName, phone, birthDate, gender, address, nationalId, medicalHistory, allergies } = req.body;

    const existingPatient = await Patient.findOne({ nationalId });
    if (existingPatient) {
      throw new ResourceConflictError('Patient with this national ID already exists');
    }

    const patient = new Patient({
      firstName,
      lastName,
      phone,
      birthDate,
      gender,
      address,
      nationalId,
      medicalHistory,
      allergies,
      userAccountId: req.user?._id,
    });

    await patient.save();

    const user = await User.findById(req.user?._id);
    if (user) {
      user.role = 'Patient';
      await user.save();
    }

    res.status(201).send({
      message: 'Patient profile created successfully',
      patient: {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
    }

    res.status(200).send({ patient });
  } catch (error) {
    next(error);
  }
};

export const updatePatientProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientSchema = Joi.object({
      firstName: Joi.string().messages(validationMessages),
      lastName: Joi.string().messages(validationMessages),
      phone: Joi.string().pattern(/^\+?\d{10,15}$/).messages(validationMessages),
      address: Joi.string().messages(validationMessages),
      medicalHistory: Joi.string().allow('').messages(validationMessages),
      allergies: Joi.string().allow('').messages(validationMessages),
    }).unknown(true);

    const { error } = patientSchema.validate(req.body);
    if (error) throw error;

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).send({
      message: 'Patient profile updated successfully',
      patient: updatedPatient
    });
  } catch (error) {
    next(error);
  }
};

export const viewMedicalData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.patientId || req.user?._id?.toString();
    const userId = req.user?._id?.toString();

    let patients: any[] = [];

    if (req.user?.role === 'Admin' || req.user?.role === 'Doctor') {
      patients = await Patient.find({});
    } else {
      patients = await Patient.find({ userAccountId: userId });
    }

    let patient = patients.find(p => {
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
      patient = await Patient.findOne({ userAccountId: userId });
      if (!patient) {
        throw new ResourceNotFoundError('Patient not found');
      }
    }

    const isOwner = patient.userAccountId?.toString() === userId;
    const isAdminOrDoctor = req.user?.role === 'Doctor' || req.user?.role === 'Admin';

    if (!isOwner && !isAdminOrDoctor) {
      throw new ResourceNotFoundError('You do not have permission to access this data');
    }

    res.status(200).send({
      patient: {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        birthDate: patient.birthDate,
        gender: patient.gender,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies
      }
    });
  } catch (error) {
    next(error);
  }
};
