import { Request, Response, NextFunction } from 'express';
import MedicalRecord from '../models/medical.record.model';

export const findMedicalRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId } = req.query;
    let filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;

    const populate = (req.query.populate as string) || '';
    const select = (req.query.select as string) || '';

    let query: any = MedicalRecord.find(filter);
    if (select) query = query.select(select);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }
    query = query.sort({ recordDate: -1 });

    const records = await query;
    res.status(200).send({ data: records });
  } catch (error) {
    next(error);
  }
};

export const countMedicalRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await MedicalRecord.countDocuments();
    res.status(200).send({ count });
  } catch (error) {
    next(error);
  }
};

export const findMedicalRecordById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const populate = (req.query.populate as string) || '';
    let query: any = MedicalRecord.findById(req.params.id);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }
    const record = await query;
    if (!record) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: record });
  } catch (error) {
    next(error);
  }
};

export const createMedicalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = new MedicalRecord(req.body);
    await record.save();
    res.status(201).send({ data: record });
  } catch (error) {
    next(error);
  }
};

export const updateMedicalRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!record) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: record });
  } catch (error) {
    next(error);
  }
};
