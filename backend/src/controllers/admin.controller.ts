import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import User from '../models/user.model';
import Doctor from '../models/doctor.model';
import Patient from '../models/patient.model';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import { logActivity } from '../services/activity.log.service';

export const verifyDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const doctorId = req.params.doctorId;
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ResourceNotFoundError('Doctorul nu a fost găsit');
    }

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).send({ 
      message: 'Doctorul a fost verificat cu succes',
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        isVerified: doctor.isVerified
      }
    });

    logActivity(req, 'VERIFY_DOCTOR', 'Doctor', doctor._id.toString(), `Verificat: ${doctor.firstName} ${doctor.lastName}`);
  } catch (error) {
    next(error);
  }
};

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
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
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
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
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
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
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const userId = req.params.userId;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ResourceNotFoundError('Utilizatorul nu a fost găsit');
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
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
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
      throw new ResourceNotFoundError('Utilizatorul nu a fost găsit');
    }

    res.status(200).send({ 
      message: `User role updated to ${role} successfully`,
      user
    });

    logActivity(req, 'UPDATE_ROLE', 'User', userId, `Rol schimbat în: ${role}`);
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('Utilizatorul nu a fost găsit');
    }

    user.isConfirmed = false;
    await user.save();

    res.status(200).send({ message: 'Utilizatorul a fost dezactivat cu succes' });

    logActivity(req, 'DEACTIVATE_USER', 'User', userId, `Dezactivat: ${user.username}`);
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const Appointment = require('../models/appointment.model').default;
    const DocumentModel = require('../models/document.model').default;
    const MedicalRecord = require('../models/medical.record.model').default;
    const Prescription = require('../models/prescription.model').default;
    const ActivityLog = require('../models/activity.log.model').default;

    const [userCount, doctorCount, verifiedDoctorCount, patientCount, appointmentCount, documentCount, recordCount, prescriptionCount, recentLogsCount] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Doctor.countDocuments({ isVerified: true }),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      DocumentModel.countDocuments(),
      MedicalRecord.countDocuments(),
      Prescription.countDocuments(),
      ActivityLog.countDocuments(),
    ]);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLoginsCount = await ActivityLog.countDocuments({ action: 'LOGIN', timestamp: { $gte: last24h } });
    const recentUploadsCount = await ActivityLog.countDocuments({ action: 'UPLOAD_DOCUMENT', timestamp: { $gte: last24h } });

    res.status(200).send({ 
      stats: {
        users: userCount,
        doctors: doctorCount,
        verifiedDoctors: verifiedDoctorCount,
        patients: patientCount,
        appointments: appointmentCount,
        documents: documentCount,
        medicalRecords: recordCount,
        prescriptions: prescriptionCount,
        activityLogs: recentLogsCount,
        recentLogins24h: recentLoginsCount,
        recentUploads24h: recentUploadsCount,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const ActivityLog = require('../models/activity.log.model').default;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (action) filter.action = action;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    res.status(200).send({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const ActivityLog = require('../models/activity.log.model').default;
    const Appointment = require('../models/appointment.model').default;

    const actionBreakdown = await ActivityLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyActivity = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: last30d } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    const topUsers = await ActivityLog.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).send({
      report: {
        actionBreakdown,
        dailyActivity,
        topUsers,
        appointmentsByStatus,
      }
    });
  } catch (error) {
    next(error);
  }
};
