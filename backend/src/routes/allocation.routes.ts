import { Router } from 'express';
import {
  getAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  linkAllocationToDestination,
  unlinkAllocationFromDestination,
} from '../controllers/allocation.controller';

const router = Router();

router.get('/', getAllocations);
router.get('/:id', getAllocationById);
router.post('/', createAllocation);
router.put('/:id', updateAllocation);
router.delete('/:id', deleteAllocation);
router.post('/:id/link', linkAllocationToDestination);
router.post('/:id/unlink', unlinkAllocationFromDestination);

export default router;
