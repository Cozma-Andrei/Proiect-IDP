import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { recordsApi } from '../services/http.client';
import { ResourceNotFoundError, ResourceConflictError, ResourceInvalidError } from '../common/errors/errors';
import validationMessages from '../common/errors/validation.messages';
import { logActivity } from '../services/activity.log.service';

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentSchema = Joi.object({
      doctorId: Joi.string().required().messages(validationMessages),
      appointmentDate: Joi.date().min('now').required().messages(validationMessages),
      time: Joi.string().required().messages(validationMessages),
      notes: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = appointmentSchema.validate(req.body);
    if (error) throw error;

    const { doctorId, appointmentDate, time, notes } = req.body;

    // Find patient
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (patientResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }
    const patient = patientResp.data.data[0];

    // Verify doctor exists and is verified
    const doctorResp = await recordsApi.get(`/doctors/${doctorId}`);
    const doctor = doctorResp.data.data;
    if (!doctor || !doctor.isVerified) {
      throw new ResourceNotFoundError('Doctorul nu a fost găsit sau nu este verificat');
    }

    // Check slot availability
    const localDate = new Date(appointmentDate);
    localDate.setHours(0, 0, 0, 0);
    const existingAppts = await recordsApi.get('/appointments', {
      params: { doctorId, date: localDate.toISOString().split('T')[0] }
    });
    const bookedTimes = existingAppts.data.data.map((a: any) => a.time);
    if (bookedTimes.includes(time)) {
      throw new ResourceConflictError('Acest interval orar este deja ocupat');
    }

    if (doctor.availableSlots && doctor.availableSlots.length > 0 && !doctor.availableSlots.includes(time)) {
      throw new ResourceInvalidError('Doctorul nu este disponibil la această oră');
    }

    const response = await recordsApi.post('/appointments', {
      patientId: patient._id,
      doctorId,
      appointmentDate: localDate.toISOString(),
      time,
      status: 'Scheduled',
      notes
    });

    const appointment = response.data.data;

    res.status(201).send({
      message: 'Programarea a fost creată cu succes',
      appointment: { id: appointment._id, date: appointment.appointmentDate, time: appointment.time, status: appointment.status }
    });

    logActivity(req, 'CREATE_APPOINTMENT', 'Appointment', appointment._id.toString(), `Programare creată pentru ${appointment.appointmentDate} la ora ${appointment.time}`);
  } catch (error) {
    next(error);
  }
};

export const createAppointmentForPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentSchema = Joi.object({
      patientId: Joi.string().required().messages(validationMessages),
      appointmentDate: Joi.date().min('now').required().messages(validationMessages),
      time: Joi.string().required().messages(validationMessages),
      notes: Joi.string().required().messages(validationMessages),
    }).unknown(true);

    const { error } = appointmentSchema.validate(req.body);
    if (error) throw error;

    const { patientId: patientIdentifier, appointmentDate, time, notes } = req.body;

    // Find doctor profile
    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de medic nu a fost găsit');
    }
    const doctor = doctorResp.data.data[0];
    if (!doctor.isVerified) {
      throw new ResourceNotFoundError('Profilul de medic nu este verificat');
    }

    // Find patient by nationalId first, then by _id
    let patient = null;
    let resp = await recordsApi.get('/patients', { params: { nationalId: patientIdentifier } });
    if (resp.data.data.length > 0) {
      patient = resp.data.data[0];
    }
    if (!patient) {
      try {
        resp = await recordsApi.get(`/patients/${patientIdentifier}`);
        patient = resp.data.data;
      } catch (e) {}
    }
    if (!patient) {
      throw new ResourceNotFoundError('Pacientul nu a fost găsit');
    }

    const localDate = new Date(appointmentDate);
    localDate.setHours(0, 0, 0, 0);

    const response = await recordsApi.post('/appointments', {
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: localDate.toISOString(),
      time,
      status: 'Scheduled',
      notes
    });

    const appointment = response.data.data;
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
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    if (patientResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de pacient nu a fost găsit');
    }
    const patient = patientResp.data.data[0];

    const response = await recordsApi.get('/appointments', {
      params: { patientId: patient._id, populate: 'doctorId:firstName lastName specialization userAccountId', sort: 'appointmentDate time' }
    });

    res.status(200).send({ appointments: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de doctor nu a fost găsit');
    }
    const doctor = doctorResp.data.data[0];

    const response = await recordsApi.get('/appointments', {
      params: { doctorId: doctor._id, populate: 'patientId:firstName lastName userAccountId', sort: 'appointmentDate time' }
    });

    res.status(200).send({ appointments: response.data.data });
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

    const apptResp = await recordsApi.get(`/appointments/${appointmentId}`);
    const appointment = apptResp.data.data;
    if (!appointment) {
      throw new ResourceNotFoundError('Programarea nu a fost găsită');
    }

    // Verify requester is the doctor
    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    if (doctorResp.data.data.length === 0) {
      throw new ResourceNotFoundError('Profilul de doctor nu a fost găsit');
    }
    const doctor = doctorResp.data.data[0];
    if (appointment.doctorId.toString() !== doctor._id.toString() && appointment.doctorId._id?.toString() !== doctor._id.toString()) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a modifica această programare');
    }

    const response = await recordsApi.put(`/appointments/${appointmentId}`, { status });
    res.status(200).send({ message: 'Statusul programării a fost actualizat cu succes', appointment: response.data.data });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointmentId = req.params.appointmentId;

    const apptResp = await recordsApi.get(`/appointments/${appointmentId}`);
    const appointment = apptResp.data.data;
    if (!appointment) {
      throw new ResourceNotFoundError('Programarea nu a fost găsită');
    }

    // Check permissions
    const patientResp = await recordsApi.get('/patients', { params: { userAccountId: req.user?._id } });
    const doctorResp = await recordsApi.get('/doctors', { params: { userAccountId: req.user?._id } });
    const patient = patientResp.data.data[0];
    const doctor = doctorResp.data.data[0];

    const isPatient = patient && (appointment.patientId.toString() === patient._id.toString() || appointment.patientId._id?.toString() === patient._id.toString());
    const isDoctor = doctor && (appointment.doctorId.toString() === doctor._id.toString() || appointment.doctorId._id?.toString() === doctor._id.toString());
    const isAdmin = req.user?.role === 'Admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ResourceNotFoundError('Nu aveți permisiunea de a anula această programare');
    }

    if (appointment.status === 'Completed') {
      throw new ResourceInvalidError('Nu se poate anula o programare finalizată');
    }

    await recordsApi.delete(`/appointments/${appointmentId}`);
    res.status(200).send({ message: 'Programarea a fost anulată cu succes' });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).send({ message: 'doctorId și date sunt obligatorii' });
    }

    const doctorResp = await recordsApi.get(`/doctors/${doctorId}`);
    const doctor = doctorResp.data.data;
    if (!doctor) {
      throw new ResourceNotFoundError('Doctorul nu a fost găsit');
    }

    const allSlots = doctor.availableSlots || [];
    if (allSlots.length === 0) {
      return res.status(200).send({ availableSlots: [], message: 'Doctorul nu are intervale definite' });
    }

    const existingAppts = await recordsApi.get('/appointments', {
      params: { doctorId, date: date as string }
    });
    const bookedTimes = existingAppts.data.data.map((a: any) => a.time);
    const availableSlots = allSlots.filter((slot: string) => !bookedTimes.includes(slot));

    res.status(200).send({ availableSlots });
  } catch (error) {
    next(error);
  }
};
