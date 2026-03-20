import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Doctor from '../models/doctor.model';
import { ResourceNotFoundError, ResourceConflictError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import User from '../models/user.model';

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

    const existingDoctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (existingDoctor) {
      throw new ResourceConflictError('Doctor profile already exists for this user');
    }

    const doctor = new Doctor({
      firstName,
      lastName,
      specialization,
      phone,
      isVerified: false,
      userAccountId: req.user?._id,
    });

    await doctor.save();

    const user = await User.findById(req.user?._id);
    if (user) {
      user.role = 'Doctor';
      await user.save();
    }

    res.status(201).send({ 
      message: 'Doctor profile created successfully. It will be reviewed for verification.',
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor) {
      throw new ResourceNotFoundError('Doctor profile not found');
    }

    res.status(200).send({ doctor });
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

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor) {
      throw new ResourceNotFoundError('Doctor profile not found');
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).send({ 
      message: 'Doctor profile updated successfully',
      doctor: updatedDoctor
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctors = await Doctor.find({ isVerified: true })
      .select('firstName lastName specialization');

    res.status(200).send({ doctors });
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findOne({ _id: doctorId, isVerified: true })
      .select('firstName lastName specialization');
    
    if (!doctor) {
      throw new ResourceNotFoundError('Doctor not found');
    }

    res.status(200).send({ doctor });
  } catch (error) {
    next(error);
  }
};
