import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  UserCog,
  Menu, 
  X, 
  Bell, 
  Database,
  LogOut
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const isLinkActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-[#F7F6F2] overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#102A43] border-r border-[#E5E7EB]/10 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/5 bg-black/10">
          <Link to="/" className="flex items-center gap-2.5 tracking-tight text-white">
            <div className="p-1 bg-white rounded-lg shrink-0 border border-[#E5E7EB]/10">
              <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Bars (Light Steel Blue) */}
                <rect x="12" y="38" width="10" height="40" rx="1.5" fill="#60A5FA" />
                <rect x="26" y="26" width="10" height="52" rx="1.5" fill="#60A5FA" />
                <rect x="40" y="14" width="10" height="64" rx="1.5" fill="#60A5FA" />
                <rect x="54" y="2" width="10" height="76" rx="1.5" fill="#60A5FA" />
                
                {/* Arrow Stem (Deep Navy) */}
                <path d="M 8 75 H 44 L 74 45" fill="none" stroke="#102A43" strokeWidth="10" strokeLinecap="square" strokeLinejoin="miter" />
                
                {/* Arrow Head (Deep Navy) */}
                <polygon points="86,20 62,20 74,32 86,44" fill="#102A43" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-wider uppercase">STOCKLY</span>
              <span className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">Run your business with clarity</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-white/10 text-gray-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto">
          {/* OVERVIEW GROUP */}
          <div className="space-y-1.5">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overview</p>
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isLinkActive('/') 
                  ? 'bg-[#E8F3EE] text-[#176B4D] font-bold shadow-sm' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${isLinkActive('/') ? 'text-[#176B4D]' : 'text-gray-400'}`} />
              Dashboard
            </Link>
          </div>

          {/* OPERATIONS GROUP */}
          <div className="space-y-1.5">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operations</p>
            <Link
              to="/customers"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isLinkActive('/customers') 
                  ? 'bg-[#E8F3EE] text-[#176B4D] font-bold shadow-sm' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className={`w-5 h-5 ${isLinkActive('/customers') ? 'text-[#176B4D]' : 'text-gray-400'}`} />
              Customers
            </Link>
            <Link
              to="/products"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isLinkActive('/products') 
                  ? 'bg-[#E8F3EE] text-[#176B4D] font-bold shadow-sm' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Package className={`w-5 h-5 ${isLinkActive('/products') ? 'text-[#176B4D]' : 'text-gray-400'}`} />
              Products
            </Link>
            <Link
              to="/challans"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isLinkActive('/challans') 
                  ? 'bg-[#E8F3EE] text-[#176B4D] font-bold shadow-sm' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FileText className={`w-5 h-5 ${isLinkActive('/challans') ? 'text-[#176B4D]' : 'text-gray-400'}`} />
              Challans
            </Link>
          </div>

          {/* MANAGEMENT GROUP */}
          {user?.role === 'Admin' && (
            <div className="space-y-1.5">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Management</p>
              <Link
                to="/users"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isLinkActive('/users') 
                    ? 'bg-[#E8F3EE] text-[#176B4D] font-bold shadow-sm' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <UserCog className={`w-5 h-5 ${isLinkActive('/users') ? 'text-[#176B4D]' : 'text-gray-400'}`} />
                Users (Admin)
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Footer / User Section */}
        {user && (
          <div className="border-t border-white/5 p-6 bg-black/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8F3EE] text-[#176B4D] font-bold flex items-center justify-center text-xs shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider font-semibold mt-0.5">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
          {/* Menu Toggle / Title Area */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">STOCKLY PORTAL</p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* API Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F3EE] text-[#176B4D] rounded-full border border-[#A3CDBB] text-xs font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DB Connected</span>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl border border-[#E5E7EB] shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#176B4D]"></span>
            </button>

            {/* Profile Dropdown / Sign Out Button */}
            {user && (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-[#17212B]">{user.name}</p>
                  <p className="text-[10px] text-[#667085]">{user.email}</p>
                </div>
                <button 
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-[#C94A4A] hover:bg-rose-50 border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
