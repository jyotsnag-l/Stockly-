import { Router } from 'express';
import { 
  getChallans, 
  getChallanById, 
  createChallan, 
  updateChallan, 
  confirmChallan, 
  cancelChallan 
} from '../controllers/challan';
import { authorize } from '../middleware/auth';

const router = Router();

// Route mappings
router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', authorize('Admin', 'Sales'), createChallan);
router.put('/:id', authorize('Admin', 'Sales'), updateChallan);
router.post('/:id/confirm', authorize('Admin', 'Sales'), confirmChallan);
router.post('/:id/cancel', authorize('Admin', 'Sales'), cancelChallan);

export default router;
