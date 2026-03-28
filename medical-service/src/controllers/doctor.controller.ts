import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { recordsApi, authApi } from '../services/http.client';
import { ResourceNotFoundError, ResourceConflictError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const createDoctorProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorSchema = Joi.object({
      firstName: Joi.string().required().messages(validationMessages),
      lastName: Joi.string().required().messages(validationMessages),
      specialization: Joi.string().required().messages(validationMessages),
      phone: Joi.string().pattern(/^\+?\d{10,15}$/).required().messages(validationMessages),
    }).unknown(true);

    const { error } = doctorSchema.validate(req.body);
    if (error) throw error;

    const { firstName, lastName, specialization, phone } = req.body;

    // Check if doctor profile already exists
    const existing = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (existing.data.data.length > 0) {
      throw new ResourceConflictError('Profilul de doctor există deja pentru acest utilizator');
    }

    const response = await recordsApi.post('/doctors', {
      firstName, lastName, specialization, phone,
      isVerified: false,
      userAccountId: req.user?._id,
    });

    const doctor = response.data.data;
    
    // Update user role in Auth Service
    try {
      await authApi.put(`/admin/users/${req.user?._id}/role`, { role: 'Doctor' }, {
        headers: { Authorization: req.headers.authorization }
      });
    } catch (roleError: any) {
      console.error('[Medical Service] Failed to update user role to Doctor:', roleError.response?.data || roleError.message);
      // We don't fail the whole request because the profile was created successfully
    }

    res.status(201).send({
      message: 'Profilul de doctor a fost creat cu succes. Acesta va fi analizat pentru verificare.',
      doctor: { id: doctor._id, firstName: doctor.firstName, lastName: doctor.lastName, specialization: doctor.specialization }
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    const doctors = response.data.data;
    if (doctors.length === 0) {
      return res.status(200).send({ doctor: null });
    }
    res.status(200).send({ doctor: doctors[0] });
  } catch (error) {
    next(error);
  }
};

export const updateDoctorProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorSchema = Joi.object({
      firstName: Joi.string().messages(validationMessages),
      lastName: Joi.string().messages(validationMessages),
      specialization: Joi.string().messages(validationMessages),
      phone: Joi.string().pattern(/^\+?\d{10,15}$/).messages(validationMessages),
    }).unknown(true);

    const { error } = doctorSchema.validate(req.body);
    if (error) throw error;

    const existing = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (existing.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de doctor nu a fost găsit');
    }

    const doctor = existing.data.data[0];
    const response = await recordsApi.put(`/doctors/${doctor._id}`, req.body);

    res.status(200).send({ message: 'Profilul de doctor a fost actualizat cu succes', doctor: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await recordsApi.get('/doctors', {
      params: { isVerified: 'true', select: 'firstName lastName specialization userAccountId' }
    });
    res.status(200).send({ doctors: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await recordsApi.get(`/doctors/${req.params.doctorId}`, {
      params: { select: 'firstName lastName specialization' }
    });
    if (!response.data.data) {
      throw new ResourceNotFoundError('Doctorul nu a fost găsit');
    }
    res.status(200).send({ doctor: response.data.data });
  } catch (error) {
    next(error);
  }
};
