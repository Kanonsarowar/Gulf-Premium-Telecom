import { Router } from 'express';
import {
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
} from '../controllers/destination.controller';

const router = Router();

router.get('/', getDestinations);
router.get('/:id', getDestinationById);
router.post('/', createDestination);
router.put('/:id', updateDestination);
router.delete('/:id', deleteDestination);

export default router;
