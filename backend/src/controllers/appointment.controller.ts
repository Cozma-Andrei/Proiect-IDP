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
      appointmentDate: Joi.date().required().messages(validationMessages),
      time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages(validationMessages),
      notes: Joi.string().allow('').required().messages(validationMessages),
    }).unknown(true);

    const { error } = appointmentSchema.validate(req.body);
    if (error) throw error;

    const { doctorId, appointmentDate, time, notes } = req.body;

    const patient = await Patient.findOne({ userAccountId: req.user?._id });
    if (!patient) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctorul nu a fost găsit sau nu este verificat');
    }

    const isoDateString = new Date(appointmentDate).toISOString().split('T')[0];
    const queryDate = new Date(`${isoDateString}T00:00:00`);

    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: queryDate,
      time
    });

    if (existingAppointment) {
      throw new ResourceConflictError('Intervalul orar solicitat pentru programare este deja rezervat');
    }

    const day = new Date(appointmentDate).getDay();
    if (day === 0 || day === 6) {
      throw new ResourceInvalidError('Programările pot fi făcute doar de luni până vineri');
    }

    if (!doctor.availableSlots || !doctor.availableSlots.includes(time)) {
      throw new ResourceInvalidError('Medicul nu este disponibil în acest interval orar');
    }

    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      appointmentDate: queryDate,
      time,
      status: 'Scheduled',
      notes
    });

    await appointment.save();

    res.status(201).send({ 
      message: 'Programarea a fost stabilită cu succes',
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
      appointmentDate: Joi.date().required().messages(validationMessages),
      time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages(validationMessages),
      notes: Joi.string().allow('').required().messages(validationMessages),
    }).unknown(true);

    const { error } = appointmentSchema.validate(req.body);
    if (error) throw error;

    const { patientId, appointmentDate, time, notes } = req.body;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit sau nu este verificat');
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
      const nationalId = p.nationalId || '';
      const idLower = identifier.toLowerCase();

      return (
        nationalId === identifier ||
        fn.includes(idLower) ||
        ln.includes(idLower) ||
        phone.includes(identifier) ||
        idLower.includes(fn) ||
        idLower.includes(ln) ||
        identifier.includes(phone)
      );
    });

    if (!patient) {
      throw new ResourceNotFoundError('Pacientul nu a fost găsit');
    }

    const isoDateString = new Date(appointmentDate).toISOString().split('T')[0];
    const queryDate = new Date(`${isoDateString}T00:00:00`);

    const existingAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      appointmentDate: queryDate,
      time
    });

    if (existingAppointment) {
      throw new ResourceConflictError('Intervalul orar solicitat pentru programare este deja rezervat');
    }

    const appointment = new Appointment({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: queryDate,
      time,
      status: 'Scheduled',
      notes
    });

    await appointment.save();

    res.status(201).send({
      message: 'Programarea a fost stabilită cu succes',
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
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization userAccountId')
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
      throw new ResourceNotFoundError('Profilul de doctor nu a fost găsit');
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'firstName lastName userAccountId')
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
      status: Joi.string().valid('Scheduled', 'Completed').required().messages(validationMessages),
    }).unknown(true);

    const { error } = statusSchema.validate(req.body);
    if (error) throw error;

    const { status } = req.body;

    const doctor = await Doctor.findOne({ userAccountId: req.user?._id });
    if (!doctor) {
      throw new ResourceNotFoundError('Profilul de doctor nu a fost găsit');
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: doctor._id });
    if (!appointment) {
      throw new ResourceNotFoundError('Programarea nu a fost găsită');
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).send({ 
      message: `Programarea a fost marcată ca ${status.toLowerCase()} cu succes`,
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
      throw new ResourceNotFoundError('Programarea nu a fost găsită');
    }

    const userRole = req.user?.role;
    const userId = req.user?._id;

    let hasPermission = false;
    if (userRole === 'Admin') {
      hasPermission = true;
    } else if (userRole === 'Patient') {
      const patient = await Patient.findOne({ userAccountId: userId });
      if (patient && patient._id.equals(appointment.patientId)) {
        hasPermission = true;
      }
    } else if (userRole === 'Doctor') {
      const doctor = await Doctor.findOne({ userAccountId: userId });
      if (doctor && doctor._id.equals(appointment.doctorId)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a anula această programare');
    }

    if (appointment.status === 'Completed') {
      throw new ResourceInvalidError('Nu se poate anula o programare finalizată');
    }

    const currentDate = new Date();
    if (appointment.appointmentDate < currentDate) {
      throw new ResourceInvalidError('Nu se pot anula programările din trecut');
    }

    await Appointment.findByIdAndDelete(appointmentId);

    res.status(200).send({ 
      message: 'Programarea a fost anulată și ștearsă cu succes'
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      throw new ResourceInvalidError('ID-ul medicului și data sunt obligatorii');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctorul nu a fost găsit sau nu este verificat');
    }

    const isoDateString = new Date(date as string).toISOString().split('T')[0];
    const queryDate = new Date(`${isoDateString}T00:00:00`);

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: queryDate,
      status: 'Scheduled'
    }).select('time');

    const bookedTimes = bookedAppointments.map(app => app.time);
    
    const day = new Date(date as string).getDay();
    if (day === 0 || day === 6) {
      return res.status(200).send({ availableSlots: [], message: 'În weekend nu se fac programări' });
    }

    const availableSlots = (doctor.availableSlots || []).filter(slot => !bookedTimes.includes(slot));

    res.status(200).send({ availableSlots });
  } catch (error) {
    next(error);
  }
};
