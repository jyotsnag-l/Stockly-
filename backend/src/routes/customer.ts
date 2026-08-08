import { Router } from 'express';
import { 
  getCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  createCustomerNote 
} from '../controllers/customer';
import { authorize } from '../middleware/auth';

const router = Router();

// Route mappings
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', authorize('Admin', 'Sales'), createCustomer);
router.put('/:id', authorize('Admin', 'Sales'), updateCustomer);
router.post('/:id/notes', authorize('Admin', 'Sales'), createCustomerNote);

export default router;
