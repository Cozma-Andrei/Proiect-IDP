import { Request, Response, NextFunction } from 'express';
import DocumentModel from '../models/document.model';

export const findDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.query;
    let filter: any = {};
    if (patientId) filter.patientId = patientId;

    const documents = await DocumentModel.find(filter).sort({ uploadedAt: -1 });
    res.status(200).send({ data: documents });
  } catch (error) {
    next(error);
  }
};

export const countDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await DocumentModel.countDocuments();
    res.status(200).send({ count });
  } catch (error) {
    next(error);
  }
};

export const findDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentModel.findById(req.params.id);
    if (!document) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: document });
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = new DocumentModel(req.body);
    await document.save();
    res.status(201).send({ data: document });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentModel.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).send({ message: 'Not found' });
    res.status(200).send({ data: document });
  } catch (error) {
    next(error);
  }
};
