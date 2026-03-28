import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import axios from 'axios';
import User from '../models/user.model';
import ActivityLog from '../models/activity.log.model';
import { ResourceNotFoundError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import { logActivity } from '../services/activity.log.service';

const RECORDS_URL = process.env.RECORDS_SERVICE_URL || 'http://localhost:5003';

export const verifyDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const doctorId = req.params.doctorId;

    // Call Records Service to update doctor
    const response = await axios.put(`${RECORDS_URL}/doctors/${doctorId}`, { isVerified: true });
    const doctor = response.data.data;

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

    const response = await axios.get(`${RECORDS_URL}/doctors`);
    const doctors = response.data.data;

    // Manually join User info
    const userIds = doctors.map((d: any) => d.userAccountId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('username email');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const populatedDoctors = doctors.map((d: any) => ({
      ...d,
      userAccountId: d.userAccountId ? userMap.get(d.userAccountId.toString()) || d.userAccountId : d.userAccountId
    }));

    res.status(200).send({ doctors: populatedDoctors });
  } catch (error) {
    next(error);
  }
};

export const getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'Admin') {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

    const response = await axios.get(`${RECORDS_URL}/patients`);
    const patients = response.data.data;

    // Manually join User info
    const userIds = patients.map((p: any) => p.userAccountId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('username email');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const populatedPatients = patients.map((p: any) => ({
      ...p,
      userAccountId: p.userAccountId ? userMap.get(p.userAccountId.toString()) || p.userAccountId : p.userAccountId
    }));

    res.status(200).send({ patients: populatedPatients });
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
    try {
      if (user.role === 'Doctor') {
        const resp = await axios.get(`${RECORDS_URL}/doctors`, { params: { userAccountId: userId } });
        profile = resp.data.data?.[0] || null;
      } else if (user.role === 'Patient') {
        const resp = await axios.get(`${RECORDS_URL}/patients`, { params: { userAccountId: userId } });
        profile = resp.data.data?.[0] || null;
      }
    } catch (e) {
      // Records Service might be down, user data still works
    }

    res.status(200).send({ user, profile });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    const isSelfUpdate = req.user?._id?.toString() === userId && req.user?.role === 'User';

    if (req.user?.role !== 'Admin' && !isSelfUpdate) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a efectua această acțiune');
    }

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

    // Local counts (Auth DB)
    const userCount = await User.countDocuments();
    const recentLogsCount = await ActivityLog.countDocuments();

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLoginsCount = await ActivityLog.countDocuments({ action: 'LOGIN', timestamp: { $gte: last24h } });
    const recentUploadsCount = await ActivityLog.countDocuments({ action: 'UPLOAD_DOCUMENT', timestamp: { $gte: last24h } });

    // Remote counts (Records Service / Medical DB)
    let doctorCount = 0, verifiedDoctorCount = 0, patientCount = 0, appointmentCount = 0, documentCount = 0, recordCount = 0, prescriptionCount = 0;
    try {
      const [doctors, verifiedDoctors, patients, appointments, documents, records, prescriptions] = await Promise.all([
        axios.get(`${RECORDS_URL}/doctors/count`),
        axios.get(`${RECORDS_URL}/doctors/count`, { params: { isVerified: 'true' } }),
        axios.get(`${RECORDS_URL}/patients/count`),
        axios.get(`${RECORDS_URL}/appointments/count`),
        axios.get(`${RECORDS_URL}/documents/count`),
        axios.get(`${RECORDS_URL}/medical-records/count`),
        axios.get(`${RECORDS_URL}/prescriptions/count`),
      ]);
      doctorCount = doctors.data.count;
      verifiedDoctorCount = verifiedDoctors.data.count;
      patientCount = patients.data.count;
      appointmentCount = appointments.data.count;
      documentCount = documents.data.count;
      recordCount = records.data.count;
      prescriptionCount = prescriptions.data.count;
    } catch (e) {
      console.error('[Auth Service] Could not reach Records Service for stats');
    }

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

    // Get appointment stats from Records Service
    let appointmentsByStatus: any[] = [];
    try {
      const resp = await axios.get(`${RECORDS_URL}/appointments/aggregate`);
      appointmentsByStatus = resp.data.data || [];
    } catch (e) {
      console.error('[Auth Service] Could not reach Records Service for appointment aggregate');
    }

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
