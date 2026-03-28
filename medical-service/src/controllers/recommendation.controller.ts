import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { recordsApi } from '../services/http.client';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const createRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendationSchema = Joi.object({
      patientId: Joi.string().required().messages(validationMessages),
      content: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = recommendationSchema.validate(req.body);
    if (error) throw error;

    const { patientId, content } = req.body;

    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0 || !doctorResp.data.data[0].isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }
    const doctor = doctorResp.data.data[0];

    const response = await recordsApi.post('/recommendations', {
      patientId, doctorId: doctor._id, content, issuedDate: new Date()
    });

    const recommendation = response.data.data;
    res.status(201).send({ message: 'Recomandarea a fost creată cu succes', recommendation: { id: recommendation._id, issuedDate: recommendation.issuedDate } });
  } catch (error) {
    next(error);
  }
};

export const getPatientRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (patientResp.data.data.length === 0) throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');

    const response = await recordsApi.get('/recommendations', {
      params: { patientId: patientResp.data.data[0]._id, populate: 'doctorId:firstName lastName specialization' }
    });

    res.status(200).send({ recommendations: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getDoctorRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0 || !doctorResp.data.data[0].isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    const response = await recordsApi.get('/recommendations', {
      params: { doctorId: doctorResp.data.data[0]._id, populate: 'patientId:firstName lastName' }
    });

    res.status(200).send({ recommendations: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getRecommendationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await recordsApi.get(`/recommendations/${req.params.recommendationId}`, {
      params: { populate: 'doctorId:firstName lastName specialization;patientId:firstName lastName birthDate' }
    });
    if (!response.data.data) throw new ResourceNotFoundError('Recomandarea nu a fost găsită');
    res.status(200).send({ recommendation: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const updateRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendationSchema = Joi.object({ content: Joi.string().required().messages(validationMessages) }).unknown(true);
    const { error } = recommendationSchema.validate(req.body);
    if (error) throw error;

    const response = await recordsApi.put(`/recommendations/${req.params.recommendationId}`, {
      content: req.body.content, issuedDate: new Date()
    });
    res.status(200).send({ message: 'Recomandarea a fost actualizată cu succes', recommendation: response.data.data });
  } catch (error) {
    next(error);
  }
};
