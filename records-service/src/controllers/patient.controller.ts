import { Request, Response, NextFunction } from 'express';
import Patient from '../models/patient.model';

// GET /patients - query by userAccountId, nationalId, or get all
export const findPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userAccountId, nationalId } = req.query;
    let filter: any = {};
    if (userAccountId) filter.userAccountId = userAccountId;
    if (nationalId) filter.nationalId = nationalId;

    const select = (req.query.select as string) || '';
    const populate = (req.query.populate as string) || '';

    let query: any = Patient.find(filter);
    if (select) query = query.select(select);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }

    const patients = await query;
    res.status(200).send({ data: patients });
  } catch (error) {
    next(error);
  }
};

// GET /patients/count
export const countPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await Patient.countDocuments();
    res.status(200).send({ count });
  } catch (error) {
    next(error);
  }
};

// GET /patients/:id
export const findPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: patient });
  } catch (error) {
    next(error);
  }
};

// POST /patients
export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).send({ data: patient });
  } catch (error) {
    next(error);
  }
};

// PUT /patients/:id
export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!patient) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: patient });
  } catch (error) {
    next(error);
  }
};

// DELETE /patients/:id
export const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
