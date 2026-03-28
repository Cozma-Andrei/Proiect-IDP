import { Router } from 'express';
import { createRecommendation, getPatientRecommendations, getDoctorRecommendations, getRecommendationById, updateRecommendation } from '../controllers/recommendation.controller';
import { authenticateUser } from '../common/middlewares/auth.middleware';

const recommendationRouter = Router();

recommendationRouter.post('/', authenticateUser, createRecommendation);
recommendationRouter.get('/patient', authenticateUser, getPatientRecommendations);
recommendationRouter.get('/doctor', authenticateUser, getDoctorRecommendations);
recommendationRouter.get('/:recommendationId', authenticateUser, getRecommendationById);
recommendationRouter.put('/:recommendationId', authenticateUser, updateRecommendation);

export default recommendationRouter;
