import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Appointment from '../models/appointment.model';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
import { ResourceNotFoundError, ResourceConflictError, ResourceInvalidError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentSchema = Joi.object({
      doctorId: Joi.string().required().messages(validationMessages),
      appointmentDate: Joi.date().min('now').required().messages(validationMessages),
      time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages(validationMessages),
      notes: Joi.string().allow('').required().messages(validationMessages),
    }).unknown(true);

    const { error } = appointmentSchema.validate(req.body);
    if (error) throw error;

    const { doctorId, appointmentDate, time, notes } = req.body;

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctor not found or not verified');
    }

    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      time
    });

    if (existingAppointment) {
      throw new ResourceConflictError('The requested appointment time is already booked');
    }

    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      time,
      status: 'Scheduled',
      notes
    });

    await appointment.save();

    res.status(201).send({ 
      message: 'Appointment scheduled successfully',
      appointment: {
        id: appointment._id,
        date: appointment.appointmentDate,
        time: appointment.time,
        status: appointment.status,
        doctorName: `${doctor.firstName} ${doctor.lastName}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointmentForPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentSchema = Joi.object({
      appointmentDate: Joi.date().min('now').required().messages(validationMessages),
      time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages(validationMessages),
      notes: Joi.string().allow('').required().messages(validationMessages),
    }).unknown(true);

    const { error } = appointmentSchema.validate(req.body);
    if (error) throw error;

    const { patientId, appointmentDate, time, notes } = req.body;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctor profile not found or not verified');
    }

    let patients: any[] = [];
    
    if (req.user?.role === 'Admin' || req.user?.role === 'Doctor') {
      patients = await Patient.find({});
    }

    const identifier = patientId;
    const patient = patients.find(p => {
      const fn = p.firstName?.toLowerCase() || '';
      const ln = p.lastName?.toLowerCase() || '';
      const phone = p.phone || '';
      const idLower = identifier.toLowerCase();

      return (
        fn.includes(idLower) ||
        ln.includes(idLower) ||
        phone.includes(identifier) ||
        idLower.includes(fn) ||
        idLower.includes(ln) ||
        identifier.includes(phone)
      );
    });

    if (!patient) {
      throw new ResourceNotFoundError('Patient not found');
    }

    const existingAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      appointmentDate: new Date(appointmentDate),
      time
    });

    if (existingAppointment) {
      throw new ResourceConflictError('The requested appointment time is already booked');
    }

    const appointment = new Appointment({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: new Date(appointmentDate),
      time,
      status: 'Scheduled',
      notes
    });

    await appointment.save();

    res.status(201).send({
      message: 'Appointment scheduled successfully',
      appointment: {
        id: appointment._id,
        date: appointment.appointmentDate,
        time: appointment.time,
        status: appointment.status,
        patientName: `${patient.firstName} ${patient.lastName}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Patient profile not found');
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ appointmentDate: 1, time: 1 });

    res.status(200).send({ appointments });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor) {
      throw new ResourceNotFoundError('Doctor profile not found');
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'firstName lastName')
      .sort({ appointmentDate: 1, time: 1 });

    res.status(200).send({ appointments });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    const statusSchema = Joi.object({
      status: Joi.string().valid('Scheduled', 'Completed', 'Cancelled', 'Missed').required().messages(validationMessages),
    }).unknown(true);

    const { error } = statusSchema.validate(req.body);
    if (error) throw error;

    const { status } = req.body;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor) {
      throw new ResourceNotFoundError('Doctor profile not found');
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: doctor._id });
    if (!appointment) {
      throw new ResourceNotFoundError('Appointment not found');
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).send({ 
      message: `Appointment ${status.toLowerCase()} successfully`,
      appointment: {
        id: appointment._id,
        date: appointment.appointmentDate,
        time: appointment.time,
        status: appointment.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ResourceNotFoundError('Appointment not found');
    }

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient || !patient._id.equals(appointment.patientId)) {
      throw new ResourceNotFoundError('You do not have permission to cancel this appointment');
    }

    const currentDate = new Date();
    if (appointment.appointmentDate < currentDate) {
      throw new ResourceInvalidError('Cannot cancel past appointments');
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.status(200).send({ 
      message: 'Appointment cancelled successfully',
      appointment: {
        id: appointment._id,
        date: appointment.appointmentDate,
        time: appointment.time,
        status: appointment.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      throw new ResourceInvalidError('Doctor ID and date are required');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctor not found or not verified');
    }

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: new Date(date as string),
      status: { $ne: 'Cancelled' }
    }).select('time');

    const availableSlots = [];
    const bookedTimes = bookedAppointments.map(app => app.time);
    
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (!bookedTimes.includes(timeSlot)) {
          availableSlots.push(timeSlot);
        }
      }
    }

    res.status(200).send({ availableSlots });
  } catch (error) {
    next(error);
  }
};
