import { Request, Response, NextFunction } from 'express';
import Prescription from '../models/prescription.model';

export const findPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { medicalRecordId } = req.query;
    let filter: any = {};
    if (medicalRecordId) {
      // Support comma-separated IDs for $in queries
      const ids = (medicalRecordId as string).split(',');
      filter.medicalRecordId = ids.length === 1 ? ids[0] : { $in: ids };
    }

    const populate = (req.query.populate as string) || '';

    let query: any = Prescription.find(filter);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const parts = p.split(':');
        const path = parts[0];
        const sel = parts[1] || undefined;
        query = query.populate(path, sel);
      }
    }

    const prescriptions = await query;
    res.status(200).send({ data: prescriptions });
  } catch (error) {
    next(error);
  }
};

export const countPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await Prescription.countDocuments();
    res.status(200).send({ count });
  } catch (error) {
    next(error);
  }
};

export const findPrescriptionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const populate = (req.query.populate as string) || '';
    let query: any = Prescription.findById(req.params.id);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const parts = p.split(':');
        query = query.populate(parts[0], parts[1] || undefined);
      }
    }
    const prescription = await query;
    if (!prescription) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: prescription });
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = new Prescription(req.body);
    await prescription.save();
    res.status(201).send({ data: prescription });
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!prescription) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: prescription });
  } catch (error) {
    next(error);
  }
};
