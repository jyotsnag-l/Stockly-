import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  Customer, 
  CustomerType, 
  CustomerStatus 
} from '../api/customers';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Building, 
  X, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Eye,
  User 
} from 'lucide-react';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isWritable = user?.role === 'Admin' || user?.role === 'Sales';

  // API query parameters
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Retail');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('Lead');
  const [followUpDate, setFollowUpDate] = useState('');

  const fetchCustomersList = async (page = currentPage) => {
    try {
      setLoading(true);
      const res = await getCustomers({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        customerType: typeFilter !== 'ALL' ? typeFilter : undefined
      });
      setCustomers(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchCustomersList(1);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCustomersList(currentPage);
  }, [currentPage]);

  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setName('');
    setEmail('');
    setMobile('');
    setBusinessName('');
    setGstNumber('');
    setCustomerType('Retail');
    setAddress('');
    setStatus('Lead');
    setFollowUpDate('');
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setModalMode('EDIT');
    setEditingId(customer.id);
    setName(customer.name);
    setEmail(customer.email);
    setMobile(customer.mobile);
    setBusinessName(customer.businessName);
    setGstNumber(customer.gstNumber || '');
    setCustomerType(customer.customerType);
    setAddress(customer.address);
    setStatus(customer.status);
    setFollowUpDate(customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : '');
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Customer name is required';
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!mobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(mobile.replace(/\s+/g, ''))) {
      errors.mobile = 'Invalid mobile number format';
    }
    if (!businessName) errors.businessName = 'Business name is required';
    if (!address) errors.address = 'Billing address is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please resolve the validation errors below.');
      setFormSubmitting(false);
      return;
    }

    const payload = {
      name,
      email,
      mobile,
      businessName,
      gstNumber: gstNumber.trim() || null,
      customerType,
      address,
      status,
      followUpDate: followUpDate || null
    };

    try {
      if (modalMode === 'CREATE') {
        await createCustomer(payload);
      } else if (editingId) {
        await updateCustomer(editingId, payload);
      }
      setIsModalOpen(false);
      fetchCustomersList(currentPage);
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500">Track business details, timeline history, and follow-up activities.</p>
        </div>
        {isWritable && (
          <button 
            onClick={handleOpenCreateModal}
            className="premium-btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input pl-10"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="premium-input font-semibold text-gray-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="premium-input font-semibold text-gray-700"
          >
            <option value="ALL">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
      </div>

      {/* Error Indicator */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Customer List Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="space-y-2 flex-1 max-w-[200px]">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-24 hidden sm:block"></div>
                <div className="h-4 bg-gray-200 rounded w-20 hidden md:block"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="premium-th">Client Details</th>
                  <th className="premium-th">Company</th>
                  <th className="premium-th">Contact Info</th>
                  <th className="premium-th">Type</th>
                  <th className="premium-th">Status</th>
                  <th className="premium-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-55 transition-colors">
                      <td className="premium-td">
                        <Link to={`/customers/${customer.id}`} className="flex items-center gap-3 group">
                          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{customer.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400" /> {customer.email}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="premium-td">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 border border-gray-100 text-xs font-medium">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            {customer.businessName}
                          </span>
                          {customer.gstNumber && (
                            <p className="text-[10px] text-gray-400 font-mono pl-1">GST: {customer.gstNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="premium-td">
                        <p className="text-gray-600 flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {customer.mobile}
                        </p>
                      </td>
                      <td className="premium-td text-gray-600 font-bold">
                        {customer.customerType}
                      </td>
                      <td className="premium-td">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          customer.status === 'Active' ? 'premium-badge-success' :
                          customer.status === 'Lead' ? 'premium-badge-info' : 'premium-badge-warning'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="premium-td text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            title="View Detail"
                            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-brand-600 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isWritable && (
                            <button
                              onClick={() => handleOpenEditModal(customer)}
                              title="Edit Profile"
                              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-amber-600 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                        <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
                          <User className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-gray-900">No Customers Found</p>
                          <p className="text-xs text-gray-500">We couldn't find any customers matching your current filters or search terms. Try adjusting your query.</p>
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

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === 'CREATE' ? 'Add New Customer' : 'Edit Customer Profile'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`premium-input ${fieldErrors.name ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="John Doe"
                  />
                  {fieldErrors.name && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`premium-input ${fieldErrors.email ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="john@example.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: '' }));
                    }}
                    className={`premium-input ${fieldErrors.mobile ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="+91 9876543210"
                  />
                  {fieldErrors.mobile && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      {fieldErrors.mobile}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (fieldErrors.businessName) setFieldErrors(prev => ({ ...prev, businessName: '' }));
                    }}
                    className={`premium-input ${fieldErrors.businessName ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="Acme Holdings"
                  />
                  {fieldErrors.businessName && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      {fieldErrors.businessName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">GST Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => {
                      setGstNumber(e.target.value);
                      if (fieldErrors.gstNumber) setFieldErrors(prev => ({ ...prev, gstNumber: '' }));
                    }}
                    className={`premium-input font-mono ${fieldErrors.gstNumber ? 'border-rose-300 bg-rose-50/10' : ''}`}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {fieldErrors.gstNumber && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      {fieldErrors.gstNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Customer Type</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                    className="premium-input font-semibold text-gray-700"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: '' }));
                  }}
                  rows={2}
                  className={`premium-input ${fieldErrors.address ? 'border-rose-300 bg-rose-50/10' : ''}`}
                  placeholder="Billing address details..."
                />
                {fieldErrors.address && (
                  <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                  className="premium-input font-semibold text-gray-700"
                >
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  {formSubmitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
