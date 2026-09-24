import { Router } from 'express';
import { getRestaurants, getUserRestaurants, postRestaurant, putRestaurant, deleteRestaurantController } from './restaurantControler.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/restaurants', getRestaurants);

router.get('/my-restaurants', verifyJWT, getUserRestaurants);

router.post('/restaurants', verifyJWT, postRestaurant);

router.put('/restaurants/:id', verifyJWT, putRestaurant);

router.delete('/restaurants/:id', verifyJWT, deleteRestaurantController);

export default router;