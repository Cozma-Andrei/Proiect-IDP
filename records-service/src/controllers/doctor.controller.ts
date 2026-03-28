import { Request, Response, NextFunction } from 'express';
import Doctor from '../models/doctor.model';

export const findDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userAccountId, isVerified } = req.query;
    let filter: any = {};
    if (userAccountId) filter.userAccountId = userAccountId;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const select = (req.query.select as string) || '';
    const populate = (req.query.populate as string) || '';

    let query: any = Doctor.find(filter);
    if (select) query = query.select(select);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }

    const doctors = await query;
    res.status(200).send({ data: doctors });
  } catch (error) {
    next(error);
  }
};

export const countDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isVerified } = req.query;
    let filter: any = {};
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    const count = await Doctor.countDocuments(filter);
    res.status(200).send({ count });
  } catch (error) {
    next(error);
  }
};

export const findDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const select = (req.query.select as string) || '';
    let query = Doctor.findById(req.params.id);
    if (select) query = query.select(select);
    const doctor = await query;
    if (!doctor) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: doctor });
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).send({ data: doctor });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!doctor) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: doctor });
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
