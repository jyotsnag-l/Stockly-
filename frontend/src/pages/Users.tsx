import { Shield, Mail, KeyRound } from 'lucide-react';

const mockUsers = [
  { id: '1', name: 'System Admin', email: 'admin@erp.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Sales Executive', email: 'sales@erp.com', role: 'Sales', status: 'Active' },
  { id: '3', name: 'Warehouse Manager', email: 'warehouse@erp.com', role: 'Warehouse', status: 'Active' },
  { id: '4', name: 'Accountant', email: 'accounts@erp.com', role: 'Accounts', status: 'Active' }
];

export default function Users() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Users</h1>
        <p className="text-sm text-gray-500">Manage internal personnel, credentials, database access, and authorization roles.</p>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                  {user.role}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mt-1">{user.name}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
              <span className="flex items-center gap-1 font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                ● {user.status}
              </span>
              <span className="flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Password123
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
