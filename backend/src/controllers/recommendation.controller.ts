import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Recommendation from '../models/recommendation.model';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
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

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new ResourceNotFoundError('Pacientul nu a fost găsit');
    }

    const recommendation = new Recommendation({
      patientId,
      doctorId: doctor._id,
      content,
      issuedDate: new Date(),
    });

    await recommendation.save();

    res.status(201).send({ 
      message: 'Recomandarea a fost creată cu succes',
      recommendation: {
        id: recommendation._id,
        issuedDate: recommendation.issuedDate,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const recommendations = await Recommendation.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ issuedDate: -1 });

    res.status(200).send({ recommendations });
  } catch (error) {
    next(error);
  }
};

export const getDoctorRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    const recommendations = await Recommendation.find({ doctorId: doctor._id })
      .populate('patientId', 'firstName lastName')
      .sort({ issuedDate: -1 });

    res.status(200).send({ recommendations });
  } catch (error) {
    next(error);
  }
};

export const getRecommendationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendationId = req.params.recommendationId;
    
    const recommendation = await Recommendation.findById(recommendationId)
      .populate('doctorId', 'firstName lastName specialization')
      .populate('patientId', 'firstName lastName birthDate');
    
    if (!recommendation) {
      throw new ResourceNotFoundError('Recomandarea nu a fost găsită');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    
    const isPatient = patient && patient._id.equals(recommendation.patientId);
    const isDoctor = doctor && (doctor._id.equals(recommendation.doctorId) || doctor.isVerified);
    
    if (!isPatient && !isDoctor && req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a accesa această recomandare');
    }

    res.status(200).send({ recommendation });
  } catch (error) {
    next(error);
  }
};

export const updateRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendationId = req.params.recommendationId;
    
    const recommendationSchema = Joi.object({
      content: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = recommendationSchema.validate(req.body);
    if (error) throw error;

    const { content } = req.body;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
    }

    const recommendation = await Recommendation.findOne({ _id: recommendationId, doctorId: doctor._id });
    if (!recommendation) {
      throw new ResourceNotFoundError('Recomandarea nu a fost găsită sau nu aveți permisiunea de a o actualiza');
    }

    recommendation.content = content;
    recommendation.issuedDate = new Date();
    await recommendation.save();

    res.status(200).send({ 
      message: 'Recomandarea a fost actualizată cu succes',
      recommendation: {
        id: recommendation._id,
        issuedDate: recommendation.issuedDate,
      }
    });
  } catch (error) {
    next(error);
  }
};
