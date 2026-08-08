import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getCustomerById, 
  updateCustomer, 
  addCustomerNote, 
  Customer, 
  CustomerNote, 
  CustomerType, 
  CustomerStatus 
} from '../api/customers';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar, 
  Clock, 
  Send, 
  Edit, 
  X, 
  AlertCircle 
} from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWritable = user?.role === 'Admin' || user?.role === 'Sales';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note State
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const fetchCustomerData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getCustomerById(id);
      setCustomer(data);
      // Pre-populate form fields
      setName(data.name);
      setEmail(data.email);
      setMobile(data.mobile);
      setBusinessName(data.businessName);
      setGstNumber(data.gstNumber || '');
      setCustomerType(data.customerType);
      setAddress(data.address);
      setStatus(data.status);
      setFollowUpDate(data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || noteSubmitting) return;

    if (!newNote.trim()) {
      setNoteError('Note content cannot be empty.');
      return;
    }

    setNoteError(null);
    setNoteSubmitting(true);
    try {
      const addedNote = await addCustomerNote(id, newNote.trim());
      const noteWithUser: CustomerNote = {
        ...addedNote,
        createdByUser: {
          id: user?.id || '',
          name: user?.name || 'Active User',
          email: user?.email || ''
        }
      };

      setCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          notes: [noteWithUser, ...(prev.notes || [])]
        };
      });
      setNewNote('');
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    // Client validations
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
      const updated = await updateCustomer(id, payload);
      setCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updated
        };
      });
      setIsModalOpen(false);
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

  const getUserInitials = (userName?: string) => {
    if (!userName) return 'U';
    return userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded-2xl w-full"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded-2xl"></div>
              <div className="h-16 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <p className="font-semibold">{error || 'Customer profile not found.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </button>
        {isWritable && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="premium-btn-secondary"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Profile details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="premium-card space-y-6">
            {/* Initials & Name Block */}
            <div className="text-center pb-4 border-b border-gray-100 space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-2xl uppercase shadow-inner">
                {customer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{customer.name}</h2>
                <p className="text-xs text-gray-500 font-bold mt-0.5">{customer.businessName}</p>
              </div>
              <div className="flex justify-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  customer.status === 'Active' ? 'premium-badge-success' :
                  customer.status === 'Lead' ? 'premium-badge-info' : 'premium-badge-warning'
                }`}>
                  {customer.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-150">
                  {customer.customerType}
                </span>
              </div>
            </div>

            {/* Profile fields grid */}
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <Mail className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                  <p className="font-bold text-gray-800 break-all">{customer.email}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                  <p className="font-bold text-gray-800">{customer.mobile}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Building className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GST Reference</p>
                  <p className="font-bold text-gray-800 font-mono">{customer.gstNumber || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Billing Address</p>
                  <p className="font-semibold text-gray-800 leading-relaxed">{customer.address}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Next Follow-Up</p>
                  {customer.followUpDate ? (
                    <p className="font-bold text-brand-600">
                      {new Date(customer.followUpDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  ) : (
                    <p className="font-semibold text-gray-400 italic">No scheduled follow-up</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right timeline notes panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card flex flex-col min-h-[50vh] space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Follow-Up Timeline</h3>
              <p className="text-xs text-gray-500">History logs of communications, follow-ups, and customer feedback.</p>
            </div>

            {/* Note input form */}
            {isWritable && (
              <form onSubmit={handleAddNote} className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => {
                      setNewNote(e.target.value);
                      if (noteError) setNoteError(null);
                    }}
                    className={`w-full pl-4 pr-12 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-gray-50/20 ${
                      noteError ? 'border-rose-350 focus:ring-rose-500' : 'border-gray-250'
                    }`}
                    placeholder="Record call, log email, or schedule next action..."
                  />
                  <button
                    type="submit"
                    disabled={noteSubmitting}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 bg-brand-600 disabled:bg-gray-200 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    {noteSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {noteError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 pl-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    {noteError}
                  </p>
                )}
              </form>
            )}

            {/* Timeline Notes List */}
            <div className="flex-1 space-y-6 overflow-y-auto max-h-[55vh] pr-2">
              {customer.notes && customer.notes.length > 0 ? (
                <div className="relative border-l border-gray-150 pl-6 ml-4 space-y-6">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="relative group">
                      <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-brand-500 shadow-sm shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      </span>

                      <div className="bg-gray-55 hover:bg-gray-50 border border-gray-100 rounded-2xl p-4 transition-all duration-200 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-brand-50 text-[10px] font-bold text-brand-700 flex items-center justify-center uppercase shrink-0">
                              {getUserInitials(note.createdByUser?.name)}
                            </span>
                            <span className="font-bold text-gray-800">{note.createdByUser?.name || 'System Operator'}</span>
                          </div>
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(note.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed font-semibold pl-8 break-words whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16 space-y-4">
                  <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
                    <Clock className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-gray-900">No Activity Logged Yet</p>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">Write a message above to record call logs, follow-up items, or client feedback.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">Edit Customer Profile</h3>
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

            <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
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
                  />
                  {fieldErrors.name && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
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
                  />
                  {fieldErrors.email && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
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
                  />
                  {fieldErrors.mobile && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
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
                  />
                  {fieldErrors.businessName && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
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
                  />
                  {fieldErrors.gstNumber && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
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
                />
                {fieldErrors.address && (
                  <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => {
                      setFollowUpDate(e.target.value);
                      if (fieldErrors.followUpDate) setFieldErrors(prev => ({ ...prev, followUpDate: '' }));
                    }}
                    className={`premium-input ${fieldErrors.followUpDate ? 'border-rose-300 bg-rose-50/10' : ''}`}
                  />
                  {fieldErrors.followUpDate && (
                    <p className="text-[10px] text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.followUpDate}
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
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
