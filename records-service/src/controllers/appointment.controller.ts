import { Request, Response, NextFunction } from 'express';
import Appointment from '../models/appointment.model';

export const findAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId, status, date } = req.query;
    let filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date as string);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.appointmentDate = { $gte: d, $lt: nextDay };
    }

    const populate = (req.query.populate as string) || '';
    const sort = (req.query.sort as string) || 'appointmentDate';

    let query: any = Appointment.find(filter);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }
    query = query.sort(sort);

    const appointments = await query;
    res.status(200).send({ data: appointments });
  } catch (error) {
    next(error);
  }
};

export const countAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await Appointment.countDocuments();
    res.status(200).send({ count });
  } catch (error) {
    next(error);
  }
};

export const aggregateAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.status(200).send({ data: result });
  } catch (error) {
    next(error);
  }
};

export const findAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const populate = (req.query.populate as string) || '';
    let query: any = Appointment.findById(req.params.id);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }
    const appointment = await query;
    if (!appointment) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: appointment });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.status(201).send({ data: appointment });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!appointment) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: appointment });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
