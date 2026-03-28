import { Request, Response, NextFunction } from 'express';
import Recommendation from '../models/recommendation.model';

export const findRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId } = req.query;
    let filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;

    const populate = (req.query.populate as string) || '';

    let query: any = Recommendation.find(filter);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }
    query = query.sort({ issuedDate: -1 });

    const recommendations = await query;
    res.status(200).send({ data: recommendations });
  } catch (error) {
    next(error);
  }
};

export const findRecommendationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const populate = (req.query.populate as string) || '';
    let query: any = Recommendation.findById(req.params.id);
    if (populate) {
      const popFields = populate.split(';');
      for (const p of popFields) {
        const [path, sel] = p.split(':');
        query = query.populate(path, sel || undefined);
      }
    }
    const recommendation = await query;
    if (!recommendation) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: recommendation });
  } catch (error) {
    next(error);
  }
};

export const createRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendation = new Recommendation(req.body);
    await recommendation.save();
    res.status(201).send({ data: recommendation });
  } catch (error) {
    next(error);
  }
};

export const updateRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!recommendation) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: recommendation });
  } catch (error) {
    next(error);
  }
};
