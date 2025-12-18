'use client';
import { API_URL } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaSearch, FaDownload, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { DollarSign, CreditCard, Banknote, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-2xl">
        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-gray-900 dark:text-white font-semibold text-sm">
            ${entry.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl group hover:shadow-xl dark:hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 dark:opacity-20 blur-3xl rounded-full group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity`}></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}><Icon className="text-white" size={20} /></div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default function PaymentsTab({ businessId, currentPlan }) {
  const { t } = useTranslations();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalRevenue: 0 });

  useEffect(() => {
    const fetchPayments = async () => {
      if (!businessId) return;
      try {
        const response = await fetch(`${API_URL}/api/v1/payments/businesses/${businessId}/payments`, { credentials: 'include' });
        if (response.ok) {
          const result = await response.json();
          const paymentsData = result.data?.payments || [];
          setPayments(paymentsData);
          setFilteredPayments(paymentsData);
          const completed = paymentsData.filter(p => p.status === 'completed').length;
          const pending = paymentsData.filter(p => p.status === 'pending').length;
          const totalRevenue = paymentsData.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
          setStats({ total: paymentsData.length, completed, pending, totalRevenue });
        }
      } catch (error) { toast.error(t('businessDashboard.payments.fetchError')); }
      finally { setLoading(false); }
    };
    fetchPayments();
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  useEffect(() => {
    let filtered = [...payments];
    if (searchTerm) filtered = filtered.filter(payment => (payment.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())) || (payment.ticketId?.guestName?.toLowerCase().includes(searchTerm.toLowerCase())) || (payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())));
    if (statusFilter !== 'all') filtered = filtered.filter(payment => payment.status === statusFilter);
    filtered.sort((a, b) => { let aVal = a[sortField]; let bVal = b[sortField]; if (sortField === 'customer') { aVal = a.userId?.name || a.ticketId?.guestName || ''; bVal = b.userId?.name || b.ticketId?.guestName || ''; } return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1); });
    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, payments, sortField, sortDirection]);

  const handleSort = (field) => { if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) { toast.error(t('businessDashboard.payments.exportNoData')); return; }
    const csvData = filteredPayments.map(payment => ({ [t('businessDashboard.payments.tableTransactionId')]: payment.transactionId || payment._id.slice(-8), [t('businessDashboard.payments.tableCustomer')]: payment.userId?.name || payment.ticketId?.guestName || t('businessDashboard.payments.guest'), [t('businessDashboard.payments.tableAmount')]: payment.amount, [t('businessDashboard.payments.tableStatus')]: payment.status, [t('businessDashboard.payments.tableMethod')]: payment.paymentMethod, [t('businessDashboard.payments.tableDate')]: new Date(payment.createdAt).toLocaleString() }));
    const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`; a.click(); toast.success(t('businessDashboard.payments.exportSuccess'));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const SortIcon = ({ field }) => { if (sortField !== field) return <FaSort className="text-gray-400 dark:text-gray-500" />; return sortDirection === 'asc' ? <FaSortUp className="text-emerald-500" /> : <FaSortDown className="text-emerald-500" />; };
  const chartData = payments.length > 0 ? Object.entries(payments.reduce((acc, p) => { const date = new Date(p.createdAt).toLocaleDateString(); acc[date] = (acc[date] || 0) + (p.amount || 0); return acc; }, {})).map(([date, amount]) => ({ date, amount })).slice(-14) : [];

  if (loading) return (<div className="min-h-[400px] flex items-center justify-center"><div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div></div>);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.payments.title')}</h1><p className="text-gray-500 dark:text-gray-400 mt-1">{t('businessDashboard.payments.subtitle')}</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('businessDashboard.payments.totalPayments')} value={stats.total.toLocaleString()} icon={CreditCard} color="bg-indigo-500" />
        <StatCard title={t('businessDashboard.payments.completed')} value={stats.completed.toLocaleString()} icon={CheckCircle} color="bg-emerald-500" />
        <StatCard title={t('businessDashboard.payments.pending')} value={stats.pending.toLocaleString()} icon={Clock} color="bg-amber-500" />
        <StatCard title={t('businessDashboard.payments.totalRevenue')} value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="bg-pink-500" />
      </div>

      {currentPlan === 'enterprise' && payments.length > 0 && (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl">
          <div className="mb-4"><h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('businessDashboard.payments.revenueTrend')}</h3><p className="text-gray-500 text-sm">{t('businessDashboard.payments.trendSubtitle')}</p></div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.4}/><stop offset="100%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} fill="url(#paymentGradient)" name={t('businessDashboard.payments.totalRevenue')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1"><div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" /><input type="text" placeholder={t('businessDashboard.payments.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" /></div></div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"><option value="all">{t('businessDashboard.payments.statusAll')}</option><option value="completed">{t('businessDashboard.payments.statusCompleted')}</option><option value="pending">{t('businessDashboard.payments.statusPending')}</option><option value="failed">{t('businessDashboard.payments.statusFailed')}</option><option value="refunded">{t('businessDashboard.payments.statusRefunded')}</option></select>
          <button onClick={handleExportCSV} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 font-medium shadow-lg shadow-emerald-500/20"><FaDownload />{t('businessDashboard.payments.export')}</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-lg dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-4 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('businessDashboard.payments.tableTransactionId')}</th>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('customer')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.payments.tableCustomer')} <SortIcon field="customer" /></button></th>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('amount')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.payments.tableAmount')} <SortIcon field="amount" /></button></th>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('status')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.payments.tableStatus')} <SortIcon field="status" /></button></th>
                <th className="px-5 py-4 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('businessDashboard.payments.tableMethod')}</th>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('createdAt')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.payments.tableDate')} <SortIcon field="createdAt" /></button></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {paginatedPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-sm text-gray-500 dark:text-gray-400">{payment.transactionId || payment._id.slice(-8)}</td>
                  <td className="px-5 py-4"><div className="font-medium text-gray-900 dark:text-white">{payment.userId?.name || payment.ticketId?.guestName || t('businessDashboard.payments.guest')}</div><div className="text-sm text-gray-500">{payment.userId?.email || payment.ticketId?.guestEmail || ''}</div></td>
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">${payment.amount?.toFixed(2)}</td>
                  <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${payment.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : payment.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : payment.status === 'refunded' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>{payment.status === 'completed' && <CheckCircle size={12} />}{payment.status === 'pending' && <Clock size={12} />}{payment.status === 'failed' && <XCircle size={12} />}{payment.status === 'completed' ? t('businessDashboard.payments.statusCompleted') : payment.status === 'pending' ? t('businessDashboard.payments.statusPending') : payment.status === 'refunded' ? t('businessDashboard.payments.statusRefunded') : payment.status === 'failed' ? t('businessDashboard.payments.statusFailed') : payment.status}</span></td>
                  <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 capitalize">{payment.paymentMethod === 'card' ? <CreditCard size={14} /> : <Banknote size={14} />}{payment.paymentMethod || t('businessDashboard.payments.notAvailable')}</span></td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(payment.createdAt).toLocaleDateString()}<div className="text-xs text-gray-400 dark:text-gray-500">{new Date(payment.createdAt).toLocaleTimeString()}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-transparent">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('businessDashboard.payments.showing', { start: indexOfFirstItem + 1, end: Math.min(indexOfLastItem, filteredPayments.length), total: filteredPayments.length })}</div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('businessDashboard.payments.previous')}</button>
            <span className="px-4 py-2 text-gray-500 dark:text-gray-400">{t('businessDashboard.payments.pageInfo', { current: currentPage, total: totalPages || 1 })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('businessDashboard.payments.next')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}



