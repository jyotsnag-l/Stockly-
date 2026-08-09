import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchFromApi } from '../api/client';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const testAccounts = [
    { role: 'Admin', email: 'admin@erp.com' },
    { role: 'Sales', email: 'sales@erp.com' },
    { role: 'Warehouse', email: 'warehouse@erp.com' },
    { role: 'Accounts', email: 'accounts@erp.com' }
  ];

  const validateForm = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email format');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = await fetchFromApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123'); // Seeded password
    setEmailError(null);
    setPasswordError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-2">
            <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">Stockly</h2>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1">Run your business with clarity</p>
        </div>

        {/* Global Server Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  className={`premium-input pl-10 ${emailError ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20' : ''}`}
                  placeholder="name@company.com"
                />
              </div>
              {emailError && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  className={`premium-input pl-10 ${passwordError ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {passwordError && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {passwordError}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-navy-900 hover:bg-navy text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Quick Fill Box (Dev Helper) */}
        <div className="mt-8 border-t border-border-brand pt-6">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Quick Login (Demo Accounts)</p>
          <div className="grid grid-cols-2 gap-2">
            {testAccounts.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => handleQuickFill(account.email)}
                className="text-left px-3 py-2.5 border border-border-brand rounded-xl hover:bg-navy-50 hover:border-navy-200 text-xs font-medium text-gray-700 transition-all duration-150"
              >
                <div className="font-bold text-navy-900">{account.role}</div>
                <div className="text-[10px] text-gray-400 truncate">{account.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
