import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  createStockMovement, 
  getStockMovements 
} from '../controllers/product';
import { authorize } from '../middleware/auth';

const router = Router();

// Route mappings
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('Admin', 'Warehouse'), createProduct);
router.put('/:id', authorize('Admin', 'Warehouse'), updateProduct);
router.post('/:id/stock-movement', authorize('Admin', 'Warehouse'), createStockMovement);
router.get('/:id/stock-movements', getStockMovements);

export default router;
