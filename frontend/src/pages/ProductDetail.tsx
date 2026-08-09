import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getProductById, 
  getProductMovements, 
  createStockMovement, 
  Product, 
  StockMovement, 
  MovementType 
} from '../api/products';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  IndianRupee, 
  AlertTriangle, 
  History, 
  PlusCircle, 
  MinusCircle, 
  Clock, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWritable = user?.role === 'Admin' || user?.role === 'Warehouse';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stock movements timeline parameters
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsMeta, setMovementsMeta] = useState({ total: 0, page: 1, limit: 5, totalPages: 1 });
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movementsPage, setMovementsPage] = useState(1);

  // Adjustment Form State
  const [qty, setQty] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [reason, setReason] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchProductDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (page = movementsPage) => {
    if (!id) return;
    try {
      setMovementsLoading(true);
      const res = await getProductMovements(id, { page, limit: 5 });
      setMovements(res.data);
      setMovementsMeta(res.meta);
    } catch {
      // Ignore timeline failures
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    fetchMovements(movementsPage);
  }, [id, movementsPage]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || formSubmitting) return;

    // Client side validations
    const errors: Record<string, string> = {};
    const qtyVal = parseInt(qty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      errors.quantityChanged = 'Adjustment quantity must be greater than 0';
    }
    if (!reason.trim()) {
      errors.reason = 'Please provide a valid adjustment description';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please resolve the validation errors below.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await createStockMovement(id, {
        quantityChanged: qtyVal,
        movementType,
        reason: reason.trim()
      });

      setProduct(response.updatedProduct);
      setQty('');
      setReason('');
      setMovementType('IN');
      setMovementsPage(1);
      fetchMovements(1);
    } catch (err) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message.replace(/^[^{]*/, ''));
          if (parsed.fields) {
            setFieldErrors(parsed.fields);
            setFormError('Please resolve the validation errors below.');
          } else {
            setFormError(parsed.error || err.message);
          }
        } catch {
          setFormError(err.message);
        }
      } else {
        setFormError('An unexpected server error occurred.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-200"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <p className="font-semibold">{error || 'Product details not found.'}</p>
      </div>
    );
  }

  const isLowStock = product.currentStock <= product.minStockAlert;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Info Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="premium-card space-y-6">
            <div className="pb-4 border-b border-gray-100 space-y-3">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl w-12 h-12 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-600 tracking-wide uppercase">{product.category}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{product.name}</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {product.sku}</p>
              </div>
              {isLowStock && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-850 text-xs font-semibold">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>Inventory levels are below safety thresholds! (Threshold: {product.minStockAlert} units)</span>
                </div>
              )}
            </div>

            {/* Product Meta details */}
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <IndianRupee className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Sales Price</p>
                  <p className="font-bold text-gray-800">{formatCurrency(Number(product.unitPrice))}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Tag className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Warehouse Location</p>
                  <p className="font-bold text-gray-800">{product.location}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Package className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Stock Count</p>
                  <p className={`text-lg font-bold ${isLowStock ? 'text-rose-600' : 'text-gray-900'}`}>
                    {product.currentStock} units
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Adjust Stock Form Card */}
          {isWritable && (
            <div className="premium-card space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-gray-500">Record quick manual arrivals or warehouse counts.</p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs border border-rose-100">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              <form onSubmit={handleAdjustStock} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('IN')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                      movementType === 'IN' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-50' 
                        : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                    }`}
                  >
                    <PlusCircle className="w-4.5 h-4.5" /> Stock In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('OUT')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                      movementType === 'OUT' 
                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-50' 
                        : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                    }`}
                  >
                    <MinusCircle className="w-4.5 h-4.5" /> Stock Out
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Adjustment Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => {
                      setQty(e.target.value);
                      if (fieldErrors.quantityChanged) setFieldErrors(prev => ({ ...prev, quantityChanged: '' }));
                    }}
                    className={`premium-input ${fieldErrors.quantityChanged ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="10"
                  />
                  {fieldErrors.quantityChanged && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.quantityChanged}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason / Description</label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (fieldErrors.reason) setFieldErrors(prev => ({ ...prev, reason: '' }));
                    }}
                    className={`premium-input resize-none text-xs ${fieldErrors.reason ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="Audit count adjustment..."
                  />
                  {fieldErrors.reason && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.reason}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="premium-btn-primary w-full py-2.5"
                >
                  {formSubmitting ? 'Processing...' : 'Apply Stock Change'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Historical Stock Movement Listing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card flex flex-col min-h-[50vh] space-y-6 justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" /> Stock Audit Ledger
              </h3>
              <p className="text-xs text-gray-500">Chronological history logs of all inward arrivals and outward shipments.</p>
            </div>

            {/* Table Listings */}
            <div className="flex-1 overflow-x-auto min-h-[30vh]">
              {movementsLoading ? (
                <div className="space-y-4 animate-pulse p-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              ) : movements.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 uppercase tracking-wider text-gray-450">
                      <th className="px-4 py-3 font-bold">Audit Details</th>
                      <th className="px-4 py-3 font-bold">Type</th>
                      <th className="px-4 py-3 font-bold">Qty Changed</th>
                      <th className="px-4 py-3 font-bold">Adjusted By</th>
                      <th className="px-4 py-3 font-bold">Logged Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {movements.map((mov) => {
                      const isAddition = mov.movementType === 'IN';
                      return (
                        <tr key={mov.id} className="hover:bg-gray-55 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-800 max-w-[200px] break-words">
                            {mov.reason}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              isAddition ? 'premium-badge-success' : 'premium-badge-danger'
                            }`}>
                              {mov.movementType}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-bold ${isAddition ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isAddition ? `+${mov.quantityChanged}` : `${mov.quantityChanged}`} pcs
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-bold flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {mov.createdByUser?.name || 'System Operator'}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-300" />
                              {new Date(mov.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4 py-16">
                  <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
                    <History className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-gray-900">No Movements Recorded</p>
                    <p className="text-xs text-gray-500">There are no manual adjustments or dispatch shipments logged for this inventory item yet.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!movementsLoading && movementsMeta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 bg-white">
                <p className="text-[10px] text-gray-400">
                  Page <span className="font-bold text-gray-600">{movementsMeta.page}</span> of{' '}
                  <span className="font-bold text-gray-600">{movementsMeta.totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  <button
                    disabled={movementsPage === 1}
                    onClick={() => setMovementsPage(prev => Math.max(prev - 1, 1))}
                    className="p-1 px-2.5 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-[10px] font-bold text-gray-600 rounded-lg transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    disabled={movementsPage === movementsMeta.totalPages}
                    onClick={() => setMovementsPage(prev => Math.min(prev + 1, movementsMeta.totalPages))}
                    className="p-1 px-2.5 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-[10px] font-bold text-gray-600 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
