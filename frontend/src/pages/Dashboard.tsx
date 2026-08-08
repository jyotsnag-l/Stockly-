import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardData, DashboardStats, DashboardActivity } from '../api/dashboard';
import { 
  DollarSign, 
  Users, 
  Package, 
  FileText, 
  Clock, 
  Database,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time Filter State for the Revenue Chart
  const [timeFilter, setTimeFilter] = useState<'7D' | '30D' | '3M' | '1Y'>('30D');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardData();
      setStats(res.stats);
      setActivities(res.recentActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Mock revenue coordinates for custom B2B SVG line chart
  const chartDatasets = {
    '7D': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [1200, 1500, 800, 2200, 1700, 2500, stats?.totalRevenue ? Math.min(stats.totalRevenue, 3000) : 1900]
    },
    '30D': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      values: [3200, 5800, 4900, stats?.totalRevenue ? Math.min(stats.totalRevenue, 9000) : 6200]
    },
    '3M': {
      labels: ['June', 'July', 'August'],
      values: [15000, 18500, stats?.totalRevenue ? Math.max(stats.totalRevenue, 20000) : 22000]
    },
    '1Y': {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      values: [45000, 58000, 64000, stats?.totalRevenue ? Math.max(stats.totalRevenue, 80000) : 72000]
    }
  };

  const currentDataset = chartDatasets[timeFilter];
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Generate SVG coordinates for line & area charts
  const getPointsCoords = () => {
    const vals = currentDataset.values;
    const maxVal = Math.max(...vals, 1000);
    const minVal = 0;
    const valRange = maxVal - minVal;

    return vals.map((val, idx) => {
      const x = paddingX + (idx / (vals.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((val - minVal) / valRange) * (chartHeight - paddingY * 2);
      return { x, y, value: val };
    });
  };

  const points = getPointsCoords();
  
  // Create line SVG commands (D command)
  const lineD = points.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  
  // Create area SVG commands (closed shape down to chart base)
  const areaD = points.length > 0 
    ? `${lineD} L ${points[points.length - 1].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(chartHeight - paddingY).toFixed(1)} Z` 
    : '';

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-border-brand rounded-xl"></div>
          ))}
        </div>
        <div className="h-80 bg-white border border-border-brand rounded-xl"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 p-4 bg-rose-50 text-[#C94A4A] rounded-xl border border-rose-100 text-sm">
        <AlertCircle className="w-5 h-5 text-[#C94A4A] font-bold shrink-0" />
        <p className="font-semibold">{error || 'Failed to load system metrics.'}</p>
      </div>
    );
  }

  // Consistent KPI card metrics config
  const kpis = [
    {
      title: 'TOTAL REVENUE',
      value: formatCurrency(stats.totalRevenue),
      trendText: '↑ 12.4%',
      trendSub: 'vs last month',
      isPositive: true,
      icon: DollarSign
    },
    {
      title: 'ACTIVE CUSTOMERS',
      value: stats.totalCustomers.toString(),
      trendText: '↑ 8.2%',
      trendSub: 'vs last month',
      isPositive: true,
      icon: Users
    },
    {
      title: 'PRODUCTS',
      value: stats.totalProducts.toString(),
      trendText: '2 added',
      trendSub: 'this month',
      isPositive: true,
      icon: Package
    },
    {
      title: 'CHALLANS',
      value: stats.totalChallans.toString(),
      trendText: '1 pending',
      trendSub: 'in queue',
      isPositive: false,
      icon: FileText
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Main Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-[#17212B] tracking-tight">
            Good morning, {user?.role || 'Admin'}
          </h1>
          <p className="text-sm text-[#667085] mt-1 font-medium">
            Here's what's happening across your business.
          </p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={index}
              className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:border-brand-200 transition-colors duration-200"
            >
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-[#667085] tracking-wider uppercase">{kpi.title}</p>
                <Icon className="w-4.5 h-4.5 text-[#667085]" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-extrabold text-[#17212B] tracking-tight">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
                  <span className={kpi.isPositive ? 'text-[#176B4D]' : 'text-[#667085]'}>
                    {kpi.trendText}
                  </span>
                  <span className="text-[#667085] font-medium">{kpi.trendSub}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Line Chart Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#17212B] tracking-tight">Revenue Overview</h2>
            <p className="text-xs text-[#667085] mt-0.5">Consolidated invoicing sums matched across confirmation times.</p>
          </div>
          
          {/* Timeframe selector */}
          <div className="inline-flex rounded-lg border border-[#E5E7EB] p-1 bg-stone-50 text-[10px] font-bold text-[#667085]">
            {(['7D', '30D', '3M', '1Y'] as const).map(option => (
              <button
                key={option}
                onClick={() => setTimeFilter(option)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeFilter === option 
                    ? 'bg-white text-[#176B4D] shadow-sm border border-[#E5E7EB]/40' 
                    : 'hover:text-[#17212B]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Line SVG Graphic */}
        <div className="w-full overflow-x-auto pt-2">
          <div className="min-w-[650px]">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto text-text-secondary select-none"
              style={{ maxHeight: '250px' }}
            >
              <defs>
                {/* Emerald transparent gradient fill */}
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#176B4D" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#176B4D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Minimal Grid Lines (horizontal) */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#F1F3F5" strokeWidth="1" />
              <line x1={paddingX} y1={(chartHeight / 2)} x2={chartWidth - paddingX} y2={(chartHeight / 2)} stroke="#F1F3F5" strokeWidth="1" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#E5E7EB" strokeWidth="1.5" />

              {/* Area path */}
              {areaD && <path d={areaD} fill="url(#emeraldGrad)" />}

              {/* Line path */}
              {lineD && (
                <path 
                  d={lineD} 
                  fill="none" 
                  stroke="#176B4D" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Interactive Dots */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#FFFFFF" 
                    stroke="#176B4D" 
                    strokeWidth="2.5" 
                    className="transition-all duration-150 hover:r-5"
                  />
                  {/* Tooltip on hover (SVG text node) */}
                  <text 
                    x={p.x} 
                    y={p.y - 12} 
                    textAnchor="middle" 
                    className="text-[9px] font-bold fill-[#17212B] opacity-0 group-hover:opacity-100 transition-opacity bg-white"
                  >
                    ₹{p.value.toFixed(0)}
                  </text>
                </g>
              ))}

              {/* X Axis Labels */}
              {currentDataset.labels.map((lbl, idx) => {
                const x = paddingX + (idx / (currentDataset.labels.length - 1)) * (chartWidth - paddingX * 2);
                return (
                  <text
                    key={idx}
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-[#667085] uppercase tracking-wider"
                  >
                    {lbl}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Detail Operations Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Operations log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <h2 className="text-base font-bold text-[#17212B] tracking-tight">Recent Operations Log</h2>
            <p className="text-xs text-[#667085]">Automatic system trails compiled across transactions.</p>
          </div>
          
          <div className="flow-root flex-1">
            {activities.length > 0 ? (
              <ul className="divide-y divide-[#E5E7EB]">
                {activities.map((activity) => (
                  <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Minimal neutral indicator indicator dot */}
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-300 shrink-0"></div>
                        <div>
                          <p className="text-sm font-semibold text-[#17212B] leading-tight">{activity.action}</p>
                          <p className="text-xs text-[#667085] flex items-center gap-1.5 mt-1 font-medium">
                            <span>{activity.user}</span> &bull; 
                            <Clock className="w-3.5 h-3.5 text-gray-300" />
                            <span>{getRelativeTime(activity.time)}</span>
                          </p>
                        </div>
                      </div>
                      {activity.amount && (
                        <span className="text-xs font-bold text-[#17212B] bg-stone-50 px-2.5 py-1 border border-[#E5E7EB] rounded-lg">
                          {activity.amount}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12 space-y-2">
                <Clock className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">No system operations logged yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Database Status Card in Deep Navy accent */}
        <div className="bg-[#102A43] rounded-xl p-6 text-white shadow-sm flex flex-col justify-between border border-white/5">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-[#E8F3EE]/10 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm text-[#E8F3EE]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sync Active
            </span>
            <h3 className="text-lg font-bold leading-tight">Database & Systems Integration</h3>
            <p className="text-xs text-[#E8F3EE]/80 leading-relaxed font-medium">
              PostgreSQL connections are routed through the Prisma client in real time. Dynamic charts and logs synchronize as operations are performed.
            </p>
          </div>
          <div className="mt-8 border-t border-white/5 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-brand" /> DB Live
            </span>
            <span>API v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
