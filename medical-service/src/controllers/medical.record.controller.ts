import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { recordsApi } from '../services/http.client';
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

    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0 || !doctorResp.data.data[0].isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }
    const doctor = doctorResp.data.data[0];

    const response = await recordsApi.post('/medical-records', {
      patientId, doctorId: doctor._id, recordDate: new Date(), diagnosis, observations, recommendedTreatment
    });

    const record = response.data.data;
    res.status(201).send({ message: 'Înregistrarea medicală a fost creată cu succes', medicalRecord: { id: record._id, date: record.recordDate, diagnosis: record.diagnosis } });
  } catch (error) {
    next(error);
  }
};

export const getPatientMedicalRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (patientResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }
    const patient = patientResp.data.data[0];

    const response = await recordsApi.get('/medical-records', {
      params: { patientId: patient._id, populate: 'doctorId:firstName lastName specialization' }
    });

    res.status(200).send({ medicalRecords: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getMedicalRecordsByPatientId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId;

    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0 || !doctorResp.data.data[0].isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    // Find patient by nationalId or _id
    let patient = null;
    let resp = await recordsApi.get('/patients', { params: { nationalId: patientId } });
    if (resp.data.data.length > 0) patient = resp.data.data[0];
    if (!patient) {
      try { resp = await recordsApi.get(`/patients/${patientId}`); patient = resp.data.data; } catch (e) {}
    }
    if (!patient) throw new ResourceNotFoundError('Pacientul nu a fost găsit');

    const response = await recordsApi.get('/medical-records', {
      params: { patientId: patient._id, populate: 'doctorId:firstName lastName specialization' }
    });

    res.status(200).send({ medicalRecords: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getMedicalRecordById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await recordsApi.get(`/medical-records/${req.params.recordId}`, {
      params: { populate: 'doctorId:firstName lastName specialization;patientId:firstName lastName birthDate' }
    });
    if (!response.data.data) throw new ResourceNotFoundError('Înregistrarea medicală nu a fost găsită');
    res.status(200).send({ medicalRecord: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const updateMedicalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordSchema = Joi.object({
      diagnosis: Joi.string().messages(validationMessages),
      observations: Joi.string().messages(validationMessages),
      recommendedTreatment: Joi.string().messages(validationMessages),
    }).unknown(true);

    const { error } = recordSchema.validate(req.body);
    if (error) throw error;

    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0 || !doctorResp.data.data[0].isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    const response = await recordsApi.put(`/medical-records/${req.params.recordId}`, req.body);
    res.status(200).send({ message: 'Înregistrarea medicală a fost actualizată cu succes', medicalRecord: response.data.data });
  } catch (error) {
    next(error);
  }
};
