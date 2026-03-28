import { Router } from 'express';
import { uploadDocument, getPatientDocuments, getPatientDocumentsByDoctorView, getDocumentById, deleteDocument } from '../controllers/document.controller';
import upload from '../services/upload.service';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const documentRouter = Router();

documentRouter.post('/', authenticateUser, upload.single('document'), uploadDocument);
documentRouter.get('/', authenticateUser, getPatientDocuments);
documentRouter.get('/patient/:patientId', authenticateUser, getPatientDocumentsByDoctorView);
documentRouter.get('/:documentId', authenticateUser, getDocumentById);
documentRouter.delete('/:documentId', authenticateUser, deleteDocument);

export default documentRouter;
