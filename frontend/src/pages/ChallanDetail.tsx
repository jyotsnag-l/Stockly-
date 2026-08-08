import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getChallanById, 
  confirmChallan, 
  cancelChallan, 
  Challan 
} from '../api/challans';
import { 
  ArrowLeft, 
  FileText, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit,
  Truck,
  HelpCircle
} from 'lucide-react';

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWritable = user?.role === 'Admin' || user?.role === 'Sales';

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Custom Modal Confirmation States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchChallanData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getChallanById(id);
      setChallan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve challan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallanData();
  }, [id]);

  const handleConfirm = async () => {
    if (!id || actionSubmitting) return;
    setActionError(null);
    setActionSubmitting(true);
    setShowConfirmModal(false);

    try {
      const updated = await confirmChallan(id);
      setChallan(updated);
    } catch (err) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message.replace(/^[^{]*/, ''));
          setActionError(parsed.message || parsed.error || err.message);
        } catch {
          setActionError(err.message);
        }
      } else {
        setActionError('Failed to confirm challan.');
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!id || actionSubmitting) return;
    setActionError(null);
    setActionSubmitting(true);
    setShowCancelModal(false);

    try {
      const updated = await cancelChallan(id);
      setChallan(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel challan.');
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-6 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-gray-250"></div>
            <div className="h-4 bg-gray-250 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="space-y-3 pt-4 border-t border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 space-y-6 animate-pulse">
            <div className="h-6 bg-gray-250 rounded w-1/4"></div>
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <p className="font-semibold">{error || 'Challan details not found.'}</p>
      </div>
    );
  }

  const invoiceTotal = challan.items.reduce(
    (sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/challans')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Challans
        </button>

        {/* Action Buttons Panel */}
        {isWritable && (
          <div className="flex items-center gap-2">
            {challan.status === 'Draft' && (
              <>
                <button
                  onClick={() => navigate(`/challans/${challan.id}/edit`)}
                  className="premium-btn-secondary py-2"
                >
                  <Edit className="w-4 h-4" /> Edit Items
                </button>
                <button
                  disabled={actionSubmitting}
                  onClick={() => setShowConfirmModal(true)}
                  className="premium-btn-primary py-2"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm & Dispatch
                </button>
              </>
            )}

            {(challan.status === 'Draft' || challan.status === 'Confirmed') && (
              <button
                disabled={actionSubmitting}
                onClick={() => setShowCancelModal(true)}
                className="premium-btn-danger py-2"
              >
                <XCircle className="w-4 h-4 text-rose-700" /> 
                {challan.status === 'Confirmed' ? 'Cancel & Restock' : 'Cancel Challan'}
              </button>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-bold">Transaction Failed</p>
            <p className="text-xs text-rose-600 mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="premium-card space-y-6">
            <div className="pb-4 border-b border-gray-100 space-y-3">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl w-12 h-12 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sequential Reference</span>
                <h2 className="text-lg font-extrabold text-gray-900 mt-0.5">{challan.challanNumber}</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-bold">Status: {challan.status}</p>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  challan.status === 'Confirmed' ? 'premium-badge-success' :
                  challan.status === 'Draft' ? 'premium-badge-warning' : 'premium-badge-danger'
                }`}>
                  {challan.status === 'Confirmed' && <Truck className="w-3.5 h-3.5" />}
                  {challan.status}
                </span>
              </div>
            </div>

            {/* Profile fields grid */}
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <Building className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client Business Name</p>
                  <p className="font-bold text-gray-800">{challan.customer?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{challan.customer?.businessName}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                  <p className="font-bold text-gray-800 break-all">{challan.customer?.email}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Number</p>
                  <p className="font-bold text-gray-800">{challan.customer?.mobile}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shipping Address</p>
                  <p className="font-semibold text-gray-800 leading-relaxed">{challan.customer?.address}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-150 text-xs">
                <User className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created By</p>
                  <p className="font-bold text-gray-800">{challan.createdByUser?.name || 'System Operator'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Snapshot Items Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card space-y-6 flex flex-col justify-between min-h-[50vh]">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Snapshot Dispatch Details</h3>
              <p className="text-xs text-gray-500">Historical records capturing unit prices and item descriptions at dispatch time.</p>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto min-h-[25vh]">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-bold">Product Name</th>
                    <th className="px-4 py-3 font-bold">SKU</th>
                    <th className="px-4 py-3 font-bold">Unit Price</th>
                    <th className="px-4 py-3 font-bold">Quantity</th>
                    <th className="px-4 py-3 text-right font-bold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {challan.items.map((item) => {
                    const price = Number(item.unitPriceSnapshot);
                    const subtotal = price * item.quantity;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-gray-900 font-bold">
                          {item.productNameSnapshot}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500">
                          {item.productSkuSnapshot}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          ${price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-bold">
                          {item.quantity} units
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-extrabold">
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Running Total card */}
            <div className="border-t border-gray-150 pt-6 flex justify-between items-center bg-white">
              <div>
                <p className="text-xs text-gray-400">Total Shipped Quantity</p>
                <p className="text-base font-bold text-gray-700">{challan.totalQuantity} pcs</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Challan Valuation</p>
                <p className="text-2xl font-extrabold text-brand-600 tracking-tight">${invoiceTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION OVERLAY MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center space-y-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-600">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Confirm Dispatch shipment?</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                This action is **irreversible**. It will check database stock levels, subtract inventory items count, and record outbound movements. Proceed?
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="premium-btn-secondary py-2"
              >
                No, Go Back
              </button>
              <button
                onClick={handleConfirm}
                className="premium-btn-primary py-2"
              >
                Yes, Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CANCELLATION OVERLAY MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center space-y-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">
                {challan.status === 'Confirmed' ? 'Cancel & Restock Items?' : 'Cancel Draft Challan?'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                {challan.status === 'Confirmed' 
                  ? 'Cancelling this confirmed challan will RESTOCK the items back to the warehouse catalog, increasing stock counts and logging audit entries.'
                  : 'Are you sure you want to cancel this draft challan? You will not be able to edit or confirm it again.'
                }
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCancelModal(false)}
                className="premium-btn-secondary py-2"
              >
                No, Go Back
              </button>
              <button
                onClick={handleCancel}
                className="premium-btn-danger py-2"
              >
                Yes, Cancel Challan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
