import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  Product 
} from '../api/products';
import { 
  Search, 
  Plus, 
  AlertCircle, 
  X, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit2, 
  AlertTriangle,
  Package 
} from 'lucide-react';

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isWritable = user?.role === 'Admin' || user?.role === 'Warehouse';

  // API query parameters
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Category List (populated dynamically from all products)
  const [categories, setCategories] = useState<string[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form Fields State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('0');
  const [minStockAlert, setMinStockAlert] = useState('0');
  const [location, setLocation] = useState('');

  const fetchProductsList = async (page = currentPage) => {
    try {
      setLoading(true);
      const res = await getProducts({
        page,
        limit: 10,
        search: search.trim() || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        lowStock: lowStockFilter ? true : undefined
      });
      setProducts(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product list');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getProducts({ page: 1, limit: 1000 });
      const uniqueCats = Array.from(new Set(res.data.map(p => p.category))).sort();
      setCategories(uniqueCats);
    } catch {
      // Ignore category load failures
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchProductsList(1);
  }, [search, categoryFilter, lowStockFilter]);

  useEffect(() => {
    fetchProductsList(currentPage);
  }, [currentPage]);

  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setName('');
    setSku('');
    setCategory('');
    setUnitPrice('');
    setCurrentStock('0');
    setMinStockAlert('0');
    setLocation('');
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setModalMode('EDIT');
    setEditingId(product.id);
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    setUnitPrice(product.unitPrice.toString());
    setCurrentStock(product.currentStock.toString());
    setMinStockAlert(product.minStockAlert.toString());
    setLocation(product.location);
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    // Client validations
    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Product name is required';
    if (!sku) {
      errors.sku = 'SKU is required';
    } else if (!/^[A-Za-z0-9-_]+$/.test(sku)) {
      errors.sku = 'SKU must be alphanumeric (letters, numbers, dashes, underscores)';
    }
    if (!category) errors.category = 'Category is required';
    
    const price = parseFloat(unitPrice);
    if (isNaN(price) || price <= 0) {
      errors.unitPrice = 'Price must be a positive decimal number';
    }

    const minStock = parseInt(minStockAlert);
    if (isNaN(minStock) || minStock < 0) {
      errors.minStockAlert = 'Min stock alert must be 0 or greater';
    }

    const stock = parseInt(currentStock);
    if (modalMode === 'CREATE' && (isNaN(stock) || stock < 0)) {
      errors.currentStock = 'Current stock must be 0 or greater';
    }

    if (!location) errors.location = 'Storage shelf location is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please resolve the validation errors below.');
      setFormSubmitting(false);
      return;
    }

    const payload = {
      name,
      sku: sku.trim().toUpperCase(),
      category,
      unitPrice: price,
      currentStock: stock,
      minStockAlert: minStock,
      location
    };

    try {
      if (modalMode === 'CREATE') {
        await createProduct(payload);
      } else if (editingId) {
        await updateProduct(editingId, payload);
      }
      setIsModalOpen(false);
      fetchProductsList(currentPage);
      loadCategories(); // Reload unique categories
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

  const itemStart = (meta.page - 1) * meta.limit + 1;
  const itemEnd = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-gray-500 font-medium">Manage item details, shelf locations, and track active stock counts.</p>
        </div>
        {isWritable && (
          <button 
            onClick={handleOpenCreateModal}
            className="premium-btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input pl-10"
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="premium-input font-semibold text-gray-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 px-2">
          <input
            type="checkbox"
            id="lowStockToggle"
            checked={lowStockFilter}
            onChange={(e) => setLowStockFilter(e.target.checked)}
            className="h-4.5 w-4.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
          <label htmlFor="lowStockToggle" className="text-sm text-gray-700 font-bold cursor-pointer select-none">
            Show Low Stock Only
          </label>
        </div>
      </div>

      {/* Error Indicator */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-6">
                <div className="flex-1 space-y-2 max-w-[200px]">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20 hidden sm:block"></div>
                <div className="h-4 bg-gray-200 rounded w-24 hidden md:block"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="premium-th">Product Info</th>
                  <th className="premium-th">SKU</th>
                  <th className="premium-th">Category</th>
                  <th className="premium-th">Unit Price</th>
                  <th className="premium-th">Inventory Level</th>
                  <th className="premium-th">Location</th>
                  <th className="premium-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {products.length > 0 ? (
                  products.map((product) => {
                    const isLowStock = product.currentStock <= product.minStockAlert;
                    return (
                      <tr key={product.id} className="hover:bg-gray-55 transition-colors">
                        <td className="premium-td">
                          <button
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="font-bold text-gray-900 hover:text-brand-600 transition-colors text-left"
                          >
                            {product.name}
                          </button>
                        </td>
                        <td className="premium-td font-mono text-xs text-gray-500">
                          {product.sku}
                        </td>
                        <td className="premium-td">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                            {product.category}
                          </span>
                        </td>
                        <td className="premium-td font-bold text-gray-900">
                          {formatCurrency(Number(product.unitPrice))}
                        </td>
                        <td className="premium-td">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isLowStock ? 'text-rose-600' : 'text-gray-700'}`}>
                              {product.currentStock} pcs
                            </span>
                            {isLowStock && (
                              <span className="premium-badge-danger uppercase text-[9px] tracking-wide">
                                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="premium-td text-gray-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {product.location}
                          </div>
                        </td>
                        <td className="premium-td text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => navigate(`/products/${product.id}`)}
                              title="View Detail & Logs"
                              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-brand-600 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isWritable && (
                              <button
                                onClick={() => handleOpenEditModal(product)}
                                title="Edit Product"
                                className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-amber-600 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                        <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
                          <Package className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-gray-900">No Products Found</p>
                          <p className="text-xs text-gray-500">We couldn't find any products matching your current filters or search terms. Try adjusting your query.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Panel */}
        {!loading && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-700">{itemStart}</span> to{' '}
              <span className="font-bold text-gray-700">{itemEnd}</span> of{' '}
              <span className="font-bold text-gray-700">{meta.total}</span> entries
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Prev
              </button>
              <button
                disabled={currentPage === meta.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, meta.totalPages))}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-semibold text-gray-700 rounded-lg transition-colors"
              >
                Next <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === 'CREATE' ? 'Add New Product' : 'Edit Product Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-750">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs border border-rose-100">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <p className="font-semibold">{formError}</p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`premium-input ${fieldErrors.name ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="Dell XPS 15 Laptop"
                  />
                  {fieldErrors.name && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Product SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => {
                        setSku(e.target.value);
                        if (fieldErrors.sku) setFieldErrors(prev => ({ ...prev, sku: '' }));
                      }}
                      className={`premium-input font-mono ${fieldErrors.sku ? 'border-rose-300 bg-rose-50/10' : ''}`}
                      placeholder="DELL-XPS15-SLV"
                    />
                    {fieldErrors.sku && (
                      <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldErrors.sku}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: '' }));
                      }}
                      className={`premium-input ${fieldErrors.category ? 'border-rose-300 bg-rose-50/10' : ''}`}
                      placeholder="Hardware / Laptops"
                    />
                    {fieldErrors.category && (
                      <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldErrors.category}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Unit Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => {
                        setUnitPrice(e.target.value);
                        if (fieldErrors.unitPrice) setFieldErrors(prev => ({ ...prev, unitPrice: '' }));
                      }}
                      className={`premium-input ${fieldErrors.unitPrice ? 'border-rose-300 bg-rose-50/10' : ''}`}
                      placeholder="1299.99"
                    />
                    {fieldErrors.unitPrice && (
                      <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldErrors.unitPrice}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Current Stock</label>
                    <input
                      type="number"
                      disabled={modalMode === 'EDIT'} // Avoid changing current stock directly outside of Stock Movement adjustments!
                      value={currentStock}
                      onChange={(e) => {
                        setCurrentStock(e.target.value);
                        if (fieldErrors.currentStock) setFieldErrors(prev => ({ ...prev, currentStock: '' }));
                      }}
                      className={`premium-input ${fieldErrors.currentStock ? 'border-rose-300 bg-rose-50/10' : ''}`}
                      placeholder="15"
                    />
                    {fieldErrors.currentStock && (
                      <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldErrors.currentStock}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Min Stock Alert Level</label>
                    <input
                      type="number"
                      value={minStockAlert}
                      onChange={(e) => {
                        setMinStockAlert(e.target.value);
                        if (fieldErrors.minStockAlert) setFieldErrors(prev => ({ ...prev, minStockAlert: '' }));
                      }}
                      className={`premium-input ${fieldErrors.minStockAlert ? 'border-rose-300 bg-rose-50/10' : ''}`}
                      placeholder="3"
                    />
                    {fieldErrors.minStockAlert && (
                      <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldErrors.minStockAlert}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Storage Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (fieldErrors.location) setFieldErrors(prev => ({ ...prev, location: '' }));
                      }}
                      className={`premium-input ${fieldErrors.location ? 'border-rose-300 bg-rose-50/10' : ''}`}
                      placeholder="Shelf B-3"
                    />
                    {fieldErrors.location && (
                      <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldErrors.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="premium-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="premium-btn-primary"
                >
                  {formSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
