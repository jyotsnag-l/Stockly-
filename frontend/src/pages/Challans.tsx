import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getChallans, 
  Challan 
} from '../api/challans';
import { 
  Plus, 
  FileText, 
  Truck, 
  AlertTriangle, 
  X, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Eye 
} from 'lucide-react';

export default function Challans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isWritable = user?.role === 'Admin' || user?.role === 'Sales';

  // API parameters
  const [challans, setChallans] = useState<Challan[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter parameters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchChallansList = async (page = currentPage) => {
    try {
      setLoading(true);
      const res = await getChallans({
        page,
        limit: 10,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setChallans(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch challan logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchChallansList(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchChallansList(currentPage);
  }, [currentPage]);

  const itemStart = (meta.page - 1) * meta.limit + 1;
  const itemEnd = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivery Challans</h1>
          <p className="text-sm text-gray-500 font-medium">Track material dispatches, print receipts, and monitor active shipments.</p>
        </div>
        {isWritable && (
          <button 
            onClick={() => navigate('/challans/new')}
            className="premium-btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Challan
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="premium-input font-semibold text-gray-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Challan Ledger</span>
      </div>

      {/* Error Indicator */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 font-bold shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Challans Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-6">
                <div className="flex-1 space-y-2 max-w-[200px]">
                  <div className="h-4 bg-gray-250 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-24 hidden sm:block animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 hidden md:block animate-pulse"></div>
                <div className="h-6 bg-gray-250 rounded-full w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="premium-th">Challan Number</th>
                  <th className="premium-th">Customer Name</th>
                  <th className="premium-th">Issue Date</th>
                  <th className="premium-th">Total Shipped</th>
                  <th className="premium-th">Status</th>
                  <th className="premium-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {challans.length > 0 ? (
                  challans.map((challan) => (
                    <tr key={challan.id} className="hover:bg-gray-55 transition-colors">
                      <td className="premium-td font-bold text-brand-600 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4.5 h-4.5 text-gray-400" />
                          {challan.challanNumber}
                        </div>
                      </td>
                      <td className="premium-td">
                        <div>
                          <p className="font-bold text-gray-900">{challan.customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{challan.customer?.businessName}</p>
                        </div>
                      </td>
                      <td className="premium-td text-gray-500 font-semibold">
                        {new Date(challan.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="premium-td text-gray-700 font-bold">
                        {challan.totalQuantity} units
                      </td>
                      <td className="premium-td">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          challan.status === 'Confirmed' ? 'premium-badge-success' :
                          challan.status === 'Draft' ? 'premium-badge-warning' : 'premium-badge-danger'
                        }`}>
                          {challan.status === 'Confirmed' && <Truck className="w-3.5 h-3.5 text-emerald-500" />}
                          {challan.status === 'Draft' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {challan.status === 'Cancelled' && <X className="w-3.5 h-3.5 text-rose-500" />}
                          {challan.status}
                        </span>
                      </td>
                      <td className="premium-td text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`/challans/${challan.id}`)}
                            title="View Detail"
                            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-brand-600 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                        <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-gray-900">No Challans Found</p>
                          <p className="text-xs text-gray-500">We couldn't find any delivery challans matching your status query. Try modifying your filter dropdown.</p>
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
                className="premium-btn-secondary"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> Prev
              </button>
              <button
                disabled={currentPage === meta.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, meta.totalPages))}
                className="premium-btn-secondary"
              >
                Next <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
