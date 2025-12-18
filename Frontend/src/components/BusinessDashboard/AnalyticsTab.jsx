'use client';
import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const CHART_COLORS = { primary: '#10B981', secondary: '#6366F1', accent: '#F59E0B', success: '#22C55E', info: '#3B82F6', gradient: ['#10B981', '#059669'] };
const PIE_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-2xl">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (<p key={index} className="text-gray-900 dark:text-white font-semibold text-sm">{entry.name}: <span style={{ color: entry.color }}>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span></p>))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl group hover:shadow-xl dark:hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 dark:opacity-20 blur-3xl rounded-full group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity`}></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}><Icon className="text-white" size={24} /></div>
        {trend && (<div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>{trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{trendValue}</div>)}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <div className={`bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl ${className}`}>
    <div className="mb-6"><h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>{subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}</div>
    {children}
  </div>
);

export default function AnalyticsTab({ businessData }) {
  const { t, locale } = useTranslations();
  const isRTL = locale === 'ar';
  const [revenueData, setRevenueData] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [revenueRes, bookingRes, customerRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/analytics/revenue?period=${period}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/v1/analytics/bookings?period=${period}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/v1/analytics/customers`, { credentials: 'include' })
      ]);
      if (revenueRes.ok) { const data = await revenueRes.json(); setRevenueData(data.data); }
      if (bookingRes.ok) { const data = await bookingRes.json(); setBookingData(data.data); }
      if (customerRes.ok) { const data = await customerRes.json(); setCustomerData(data.data); }
    } catch (error) { console.error('Error fetching analytics:', error); }
    finally { setLoading(false); }
  };

  if (loading) return (<div className="min-h-[600px] flex items-center justify-center"><div className="relative"><div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div></div></div>);

  const paymentMethodData = revenueData?.revenueByMethod ? Object.entries(revenueData.revenueByMethod).map(([method, amount]) => ({ name: method === 'card' ? t('businessDashboard.analytics.cardPayments') : t('businessDashboard.analytics.cashPayments'), value: amount })) : [];
  const retentionData = [{ name: t('businessDashboard.analytics.customerRetention'), value: customerData?.repeatRate || 0, fill: CHART_COLORS.primary }];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.analytics.title')}</h1><p className="text-gray-500 dark:text-gray-400 mt-1">{t('businessDashboard.analytics.subtitle')}</p></div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['7', '30', '90'].map((p) => (<button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === p ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{t('businessDashboard.analytics.lastDays', { period: p })}</button>))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('businessDashboard.analytics.totalRevenue')} value={`$${(revenueData?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="bg-emerald-500" trend="up" trendValue="+12.5%" subtitle={t('businessDashboard.analytics.lastDays', { period })} />
        <StatCard title={t('businessDashboard.analytics.totalBookings')} value={(bookingData?.totalBookings || 0).toLocaleString()} icon={Calendar} color="bg-indigo-500" trend="up" trendValue="+8.2%" subtitle={t('businessDashboard.analytics.lastDays', { period })} />
        <StatCard title={t('businessDashboard.analytics.uniqueCustomers')} value={(customerData?.totalCustomers || 0).toLocaleString()} icon={Users} color="bg-amber-500" trend="up" trendValue="+5.1%" subtitle={t('businessDashboard.analytics.allTime')} />
        <StatCard title={t('businessDashboard.analytics.avgLifetimeValue')} value={`$${(customerData?.avgLifetimeValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="bg-pink-500" subtitle={t('businessDashboard.analytics.perCustomer')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title={t('businessDashboard.analytics.revenueOverview')} subtitle={t('businessDashboard.analytics.revenueSubtitle')} className="lg:col-span-2">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData?.dailyRevenue || []}>
                <defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.4}/><stop offset="100%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#374151' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#374151' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fill="url(#revenueGradient)" name={t('businessDashboard.analytics.revenue')} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t('businessDashboard.analytics.customerRetention')} subtitle={t('businessDashboard.analytics.retentionSubtitle')}>
          <div className="h-[320px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={retentionData} startAngle={180} endAngle={0}>
                <RadialBar background={{ fill: '#374151' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-16"><p className="text-4xl font-bold text-gray-900 dark:text-white">{customerData?.repeatRate || 0}%</p><p className="text-gray-500 dark:text-gray-400 text-sm">{t('businessDashboard.analytics.repeatRate')}</p></div>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('businessDashboard.analytics.bookingActivity')} subtitle={t('businessDashboard.analytics.bookingSubtitle')}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingData?.dailyBookings || []} barSize={20}>
                <defs><linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={1}/><stop offset="100%" stopColor="#6366F1" stopOpacity={0.6}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#374151' }} />
                <YAxis allowDecimals={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#374151' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#bookingGradient)" radius={[6, 6, 0, 0]} name={t('businessDashboard.analytics.bookings')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t('businessDashboard.analytics.paymentDistribution')} subtitle={t('businessDashboard.analytics.paymentSubtitle')}>
          <div className="h-[280px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {paymentMethodData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 pl-4">
              {paymentMethodData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                  <div><p className="text-gray-900 dark:text-white text-sm font-medium">{entry.name}</p><p className="text-gray-500 dark:text-gray-400 text-xs">${entry.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('businessDashboard.analytics.peakHours')} subtitle={t('businessDashboard.analytics.peakSubtitle')}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingData?.peakHours || []} layout="vertical" barSize={16} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <defs><linearGradient id="peakGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8}/><stop offset="100%" stopColor="#F59E0B" stopOpacity={0.4}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#374151' }} reversed={isRTL} />
                <YAxis type="category" dataKey="hour" width={70} tickMargin={10} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#374151' }} tickFormatter={(value) => `${value}:00`} orientation={isRTL ? 'right' : 'left'} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#peakGradient)" radius={[0, 6, 6, 0]} name={t('businessDashboard.analytics.bookings')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t('businessDashboard.analytics.customerInsights')} subtitle={t('businessDashboard.analytics.insightsSubtitle')}>
          <div className="grid grid-cols-2 gap-4 h-[280px] content-center">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/30">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2">{t('businessDashboard.analytics.newThisMonth')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerData?.newCustomersThisMonth || 0}</p>
              <div className="flex items-center gap-1 mt-2 text-emerald-600 dark:text-emerald-400 text-xs"><TrendingUp size={14} /><span>{t('businessDashboard.analytics.newCustomers', { count: customerData?.newCustomersThisMonth || 0 })}</span></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/30">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2">{t('businessDashboard.analytics.repeatCustomers')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerData?.repeatCustomers || 0}</p>
              <div className="flex items-center gap-1 mt-2 text-indigo-600 dark:text-indigo-400 text-xs"><Users size={14} /><span>{t('businessDashboard.analytics.loyalCustomers')}</span></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/30">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2">{t('businessDashboard.analytics.avgBookings')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerData?.avgBookingsPerCustomer || 0}</p>
              <div className="flex items-center gap-1 mt-2 text-amber-600 dark:text-amber-400 text-xs"><Calendar size={14} /><span>{t('businessDashboard.analytics.perCustomer')}</span></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/30">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2">{t('businessDashboard.analytics.lifetimeValue')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${customerData?.avgLifetimeValue || 0}</p>
              <div className="flex items-center gap-1 mt-2 text-pink-600 dark:text-pink-400 text-xs"><DollarSign size={14} /><span>{t('businessDashboard.analytics.perCustomer')}</span></div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}



