import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { recordsApi, authApi } from '../services/http.client';
import { ResourceNotFoundError, ResourceConflictError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

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

    // Check if patient with this CNP already exists
    const existing = await recordsApi.get('/patients', { params: { nationalId } });
    if (existing.data.data.length > 0) {
      throw new ResourceConflictError('Pacientul cu acest CNP există deja');
    }

    const response = await recordsApi.post('/patients', {
      firstName, lastName, phone, birthDate, gender, address, nationalId, medicalHistory, allergies,
      userAccountId: req.user?._id,
    });

    const patient = response.data.data;
    
    // Update user role in Auth Service
    try {
      await authApi.put(`/admin/users/${req.user?._id}/role`, { role: 'Patient' }, {
        headers: { Authorization: req.headers.authorization }
      });
    } catch (roleError) {
      console.error('[Medical Service] Failed to update user role to Patient:', roleError);
      // We don't fail the whole request because the profile was created successfully
    }

    res.status(201).send({
      message: 'Profilul pacientului a fost creat cu succes',
      patient: { id: patient._id, firstName: patient.firstName, lastName: patient.lastName }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    const patients = response.data.data;
    if (patients.length === 0) {
      return res.status(200).send({ patient: null });
    }
    res.status(200).send({ patient: patients[0] });
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

    const existing = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (existing.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const patient = existing.data.data[0];
    const response = await recordsApi.put(`/patients/${patient._id}`, req.body);

    res.status(200).send({ message: 'Profilul pacientului a fost actualizat cu succes', patient: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const viewMedicalData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.params.patientId || req.user?._id?.toString();
    const userId = req.user?._id?.toString();
    const explicitSearch = !!req.params.patientId;

    let patient = null;

    // Try nationalId first
    let resp = await recordsApi.get('/patients', { params: { nationalId: identifier } });
    if (resp.data.data.length > 0) {
      patient = resp.data.data[0];
    }

    // Try by _id
    if (!patient) {
      try {
        resp = await recordsApi.get(`/patients/${identifier}`);
        patient = resp.data.data;
      } catch (e) {}
    }

    // Try by userAccountId (own profile)
    if (!patient && !explicitSearch) {
      resp = await recordsApi.get('/patients', { params: { userAccountId: userId } });
      if (resp.data.data.length > 0) patient = resp.data.data[0];
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
