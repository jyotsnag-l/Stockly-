import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchFromApi } from '../api/client';
import { 
  createChallan, 
  updateChallan, 
  confirmChallan, 
  getChallanById 
} from '../api/challans';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  AlertCircle, 
  Save, 
  CheckCircle, 
  Package 
} from 'lucide-react';

interface CustomerDropdown {
  id: string;
  name: string;
  businessName: string;
}

interface ProductDropdown {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

export default function ChallanForm() {
  const { id } = useParams<{ id: string }>(); // If editing
  const navigate = useNavigate();
  const isEditing = !!id;

  const [customers, setCustomers] = useState<CustomerDropdown[]>([]);
  const [products, setProducts] = useState<ProductDropdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: string }[]>([
    { productId: '', quantity: '1' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadDropdownData = async () => {
    try {
      setLoading(true);
      const fetchedCustomers = await fetchFromApi('/customers');
      const fetchedProducts = await fetchFromApi('/products?limit=1000');
      
      setCustomers(Array.isArray(fetchedCustomers) ? fetchedCustomers : fetchedCustomers.data || []);
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : fetchedProducts.data || []);

      if (isEditing && id) {
        const challan = await getChallanById(id);
        if (challan.status !== 'Draft') {
          throw new Error('Only Draft challans can be modified.');
        }
        setSelectedCustomerId(challan.customerId);
        setItems(challan.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity.toString()
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve form dropdown fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, [id]);

  const handleAddItemRow = () => {
    setItems(prev => [...prev, { productId: '', quantity: '1' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
    setFieldErrors(prev => ({ ...prev, [`item-${index}-${field}`]: '' }));
  };

  // Calculations
  const getProductPrice = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    return prod ? Number(prod.unitPrice) : 0;
  };

  const getProductStock = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    return prod ? prod.currentStock : 0;
  };

  const runningTotal = items.reduce((sum, item) => {
    const price = getProductPrice(item.productId);
    const qty = parseInt(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const handleSubmitForm = async (e: React.FormEvent, actionType: 'SAVE_DRAFT' | 'CONFIRM') => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!selectedCustomerId) {
      errors.customerId = 'Please select a customer';
    }

    items.forEach((item, index) => {
      if (!item.productId) {
        errors[`item-${index}-productId`] = 'Please select a product';
      }
      const qtyVal = parseInt(item.quantity);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        errors[`item-${index}-quantity`] = 'Must be greater than 0';
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please resolve the validation errors below.');
      return;
    }

    setSubmitting(true);

    const payload = {
      customerId: selectedCustomerId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity)
      }))
    };

    try {
      let resultChallan;
      if (isEditing && id) {
        resultChallan = await updateChallan(id, { items: payload.items });
      } else {
        resultChallan = await createChallan(payload);
      }

      if (actionType === 'CONFIRM') {
        await confirmChallan(resultChallan.id);
      }

      navigate(`/challans/${resultChallan.id}`);
    } catch (err) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message.replace(/^[^{]*/, ''));
          setFormError(parsed.message || parsed.error || err.message);
        } catch {
          setFormError(err.message);
        }
      } else {
        setFormError('Failed to execute challan transaction.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/challans')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Challans
        </button>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {isEditing ? 'Modify Draft Challan' : 'Create Delivery Challan'}
        </h2>
      </div>

      {formError && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="font-semibold">{formError}</p>
        </div>
      )}

      {/* Main Form Box */}
      <div className="premium-card space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Customer</label>
            <select
              disabled={isEditing}
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (fieldErrors.customerId) setFieldErrors(prev => ({ ...prev, customerId: '' }));
              }}
              className={`premium-input text-gray-700 font-semibold ${fieldErrors.customerId ? 'border-rose-300 bg-rose-50/10' : ''}`}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} &bull; {c.businessName}
                </option>
              ))}
            </select>
            {fieldErrors.customerId && (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.customerId}
              </p>
            )}
          </div>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Total</p>
              <p className="text-3xl font-extrabold text-brand-600 tracking-tight">${runningTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Shipment Items Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Package className="w-4.5 h-4.5 text-gray-400" /> Dispatch Items List
            </h3>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg border border-brand-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const stock = getProductStock(item.productId);
              const price = getProductPrice(item.productId);
              const total = price * (parseInt(item.quantity) || 0);

              const prodError = fieldErrors[`item-${index}-productId`];
              const qtyError = fieldErrors[`item-${index}-quantity`];

              return (
                <div key={index} className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end bg-gray-50/30 border border-gray-100 p-4 rounded-2xl relative">
                  <div className="flex-1 space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-gray-700 bg-white ${
                        prodError ? 'border-rose-300' : 'border-gray-200'
                      }`}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku})
                        </option>
                      ))}
                    </select>
                    {prodError && <p className="text-[10px] text-rose-600 font-semibold mt-1">{prodError}</p>}
                  </div>

                  {item.productId && (
                    <div className="w-full sm:w-28 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock Level</p>
                      <p className={`text-xs font-bold py-2.5 px-1 ${stock <= 5 ? 'text-rose-600' : 'text-gray-750'}`}>
                        {stock} available
                      </p>
                    </div>
                  )}

                  <div className="w-full sm:w-24 space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold bg-white ${
                        qtyError ? 'border-rose-300' : 'border-gray-200'
                      }`}
                    />
                    {qtyError && <p className="text-[10px] text-rose-600 font-semibold mt-1">{qtyError}</p>}
                  </div>

                  <div className="w-full sm:w-24 text-right space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subtotal</p>
                    <p className="text-xs font-bold text-gray-800 py-2">${total.toFixed(2)}</p>
                  </div>

                  <div className="flex justify-end pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={items.length === 1}
                      className="p-2 border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl disabled:opacity-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Panel */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => navigate('/challans')}
            className="premium-btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmitForm(e, 'SAVE_DRAFT')}
            className="premium-btn-secondary w-full sm:w-auto"
          >
            <Save className="w-4.5 h-4.5" />
            {submitting ? 'Saving...' : 'Save as Draft'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmitForm(e, 'CONFIRM')}
            className="premium-btn-primary w-full sm:w-auto"
          >
            <CheckCircle className="w-4.5 h-4.5" />
            {submitting ? 'Confirming...' : 'Confirm & Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
}
