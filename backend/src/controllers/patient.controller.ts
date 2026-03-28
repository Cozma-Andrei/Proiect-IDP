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
      throw new ResourceConflictError('Pacientul cu acest CNP există deja');
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
      message: 'Profilul pacientului a fost creat cu succes',
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
      return res.status(200).send({ patient: null });
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
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).send({
      message: 'Profilul pacientului a fost actualizat cu succes',
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
    const explicitSearch = !!req.params.patientId;

    let patient = await Patient.findOne({ nationalId: identifier });
    if (!patient) {
      try {
        patient = await Patient.findById(identifier);
      } catch (e) {}
    }
    if (!patient && !explicitSearch) {
      patient = await Patient.findOne({ userAccountId: userId });
    }

    if (!patient) {
      throw new ResourceNotFoundError('Pacientul nu a fost găsit');
    }

    const isOwner = patient.userAccountId?.toString() === userId;
    const isAdminOrDoctor = req.user?.role === 'Doctor' || req.user?.role === 'Admin';

    if (!isOwner && !isAdminOrDoctor) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a accesa aceste date');
    }

    res.status(200).send({
      patient: {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        birthDate: patient.birthDate,
        gender: patient.gender,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        userAccountId: patient.userAccountId
      }
    });
  } catch (error) {
    next(error);
  }
};
