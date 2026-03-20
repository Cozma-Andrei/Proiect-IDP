import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import User from '../models/user.model';
import Doctor from '../models/doctor.model';
import Patient from '../models/patient.model';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const verifyDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const doctorId = req.params.doctorId;
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ResourceNotFoundError('Doctor not found');
    }

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).send({ 
      message: 'Doctor has been verified successfully',
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        isVerified: doctor.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const doctors = await Doctor.find()
      .populate('userAccountId', 'username email');

    res.status(200).send({ doctors });
  } catch (error) {
    next(error);
  }
};

export const getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const patients = await Patient.find()
      .populate('userAccountId', 'username email');

    res.status(200).send({ patients });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const users = await User.find().select('-password');

    res.status(200).send({ users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const userId = req.params.userId;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    let profile = null;
    if (user.role === 'Doctor') {
      profile = await Doctor.findOne({ userAccountId: userId });
    } else if (user.role === 'Patient') {
      profile = await Patient.findOne({ userAccountId: userId });
    }

    res.status(200).send({ 
      user,
      profile
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const userId = req.params.userId;
    
    const roleSchema = Joi.object({
      role: Joi.string().valid('User', 'Doctor', 'Patient', 'Admin').required().messages(validationMessages),
    }).unknown(true);

    const { error } = roleSchema.validate(req.body);
    if (error) throw error;

    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    res.status(200).send({ 
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // We don't want to actually delete users, but we can mark them as inactive
    user.isConfirmed = false; // Using isConfirmed as a way to deactivate
    await user.save();

    res.status(200).send({ message: 'User has been deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('You do not have permission to perform this action');
    }

    const userCount = await User.countDocuments();
    const doctorCount = await Doctor.countDocuments();
    const verifiedDoctorCount = await Doctor.countDocuments({ isVerified: true });
    const patientCount = await Patient.countDocuments();
    
    res.status(200).send({ 
      stats: {
        users: userCount,
        doctors: doctorCount,
        verifiedDoctors: verifiedDoctorCount,
        patients: patientCount
      }
    });
  } catch (error) {
    next(error);
  }
};
