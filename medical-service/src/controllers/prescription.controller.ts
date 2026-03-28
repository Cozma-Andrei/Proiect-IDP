import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { recordsApi } from '../services/http.client';
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

    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0 || !doctorResp.data.data[0].isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    // Check existing prescription
    const existingResp = await recordsApi.get('/prescriptions', { params: { medicalRecordId } });
    if (existingResp.data.data.length > 0) {
      throw new ResourceConflictError('O rețetă există deja pentru această înregistrare medicală');
    }

    const response = await recordsApi.post('/prescriptions', { medicalRecordId, medications, dosage, observations });
    const prescription = response.data.data;

    res.status(201).send({ message: 'Rețeta a fost creată cu succes', prescription: { id: prescription._id, medications, dosage } });
  } catch (error) {
    next(error);
  }
};

export const getPatientPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (patientResp.data.data.length === 0) throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    const patient = patientResp.data.data[0];

    const recordsResp = await recordsApi.get('/medical-records', { params: { patientId: patient._id, select: '_id recordDate' } });
    const recordIds = recordsResp.data.data.map((r: any) => r._id).join(',');
    
    if (!recordIds) return res.status(200).send({ prescriptions: [] });

    const prescResp = await recordsApi.get('/prescriptions', {
      params: { medicalRecordId: recordIds, populate: 'medicalRecordId:recordDate diagnosis doctorId' }
    });

    res.status(200).send({ prescriptions: prescResp.data.data });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await recordsApi.get(`/prescriptions/${req.params.prescriptionId}`, {
      params: { populate: 'medicalRecordId:recordDate diagnosis doctorId patientId' }
    });
    if (!response.data.data) throw new ResourceNotFoundError('Rețeta nu a fost găsită');
    res.status(200).send({ prescription: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptionSchema = Joi.object({
      medications: Joi.string().messages(validationMessages),
      dosage: Joi.string().messages(validationMessages),
      observations: Joi.string().allow('').messages(validationMessages),
    }).unknown(true);

    const { error } = prescriptionSchema.validate(req.body);
    if (error) throw error;

    const response = await recordsApi.put(`/prescriptions/${req.params.prescriptionId}`, req.body);
    res.status(200).send({ message: 'Rețeta a fost actualizată cu succes', prescription: response.data.data });
  } catch (error) {
    next(error);
  }
};
