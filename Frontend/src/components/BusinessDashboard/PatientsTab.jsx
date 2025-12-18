'use client';
import { API_URL } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaSearch, FaDownload, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Users, UserCheck, DollarSign, CheckCircle, Clock, Trash2, XCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl group hover:shadow-xl dark:hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 dark:opacity-20 blur-3xl rounded-full group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity`}></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3"><div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}><Icon className="text-white" size={20} /></div></div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default function PatientsTab({ businessId, currentPlan }) {
  const { t } = useTranslations();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0, paid: 0 });

  useEffect(() => {
    const fetchTickets = async () => {
      if (!businessId) return;
      try {
        const response = await fetch(`${API_URL}/api/v1/tickets/businesses/${businessId}/tickets`, { credentials: 'include' });
        if (response.ok) {
          const result = await response.json();
          const ticketsData = result.data || [];
          setTickets(ticketsData);
          setFilteredTickets(ticketsData);
          setStats({
            total: ticketsData.length,
            completed: ticketsData.filter(t => ['served', 'done', 'ended'].includes(t.status)).length,
            active: ticketsData.filter(t => ['waiting', 'called', 'in-progress'].includes(t.status)).length,
            paid: ticketsData.filter(t => t.paymentStatus === 'paid').length
          });
        }
      } catch (error) { toast.error(t('businessDashboard.patients.fetchError')); }
      finally { setLoading(false); }
    };
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  useEffect(() => {
    let filtered = [...tickets];
    if (searchTerm) filtered = filtered.filter(ticket => (ticket.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())) || (ticket.guestName?.toLowerCase().includes(searchTerm.toLowerCase())) || (ticket.userId?.phone?.includes(searchTerm)) || (ticket.guestPhone?.includes(searchTerm)) || (ticket.ticketNumber?.toString().includes(searchTerm)));
    if (statusFilter !== 'all') filtered = filtered.filter(ticket => ticket.status === statusFilter);
    if (paymentFilter !== 'all') filtered = filtered.filter(ticket => ticket.paymentStatus === paymentFilter);
    filtered.sort((a, b) => { let aVal = a[sortField]; let bVal = b[sortField]; if (sortField === 'name') { aVal = a.userId?.name || a.guestName || ''; bVal = b.userId?.name || b.guestName || ''; } return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1); });
    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, tickets, sortField, sortDirection]);

  const handleSort = (field) => { if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };
  const handleDelete = async (ticketId) => {
    if (!confirm(t('businessDashboard.patients.confirmDelete'))) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) { toast.success(t('businessDashboard.patients.deleteSuccess')); setTickets(tickets.filter(t => t._id !== ticketId)); }
      else { const error = await response.json(); toast.error(error.message || t('businessDashboard.patients.deleteFailed')); }
    } catch (error) { toast.error(t('businessDashboard.patients.deleteError')); }
  };
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) { toast.error(t('businessDashboard.patients.exportNoData')); return; }
    const csvData = filteredTickets.map(ticket => ({ [t('businessDashboard.patients.tableTicket')]: ticket.ticketNumber, [t('businessDashboard.patients.tableCustomer')]: ticket.userId?.name || ticket.guestName || t('businessDashboard.patients.guest'), [t('businessDashboard.patients.tableContact')]: ticket.userId?.phone || ticket.guestPhone || '', [t('businessDashboard.patients.tableStatus')]: ticket.status, [t('businessDashboard.patients.tablePayment')]: ticket.paymentStatus, [t('businessDashboard.patients.tableAmount')]: ticket.price || 0, [t('businessDashboard.patients.tableDate')]: new Date(ticket.createdAt).toLocaleDateString() }));
    const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`; a.click(); toast.success(t('businessDashboard.patients.exportSuccess'));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const SortIcon = ({ field }) => { if (sortField !== field) return <FaSort className="text-gray-400 dark:text-gray-500" />; return sortDirection === 'asc' ? <FaSortUp className="text-emerald-500" /> : <FaSortDown className="text-emerald-500" />; };

  const retentionStats = tickets.length > 0 ? (() => { const customerCounts = {}; tickets.forEach(t => { const id = t.userId?._id || t.guestPhone || 'unknown'; customerCounts[id] = (customerCounts[id] || 0) + 1; }); const returning = Object.values(customerCounts).filter(count => count > 1).length; const total = Object.keys(customerCounts).length; return { returning, total, rate: total > 0 ? (returning/total*100).toFixed(0) : 0 }; })() : { returning: 0, total: 0, rate: 0 };

  if (loading) return (<div className="min-h-[400px] flex items-center justify-center"><div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div></div>);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.patients.title')}</h1><p className="text-gray-500 dark:text-gray-400 mt-1">{t('businessDashboard.patients.subtitle')}</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('businessDashboard.patients.totalCustomers')} value={stats.total.toLocaleString()} icon={Users} color="bg-indigo-500" />
        <StatCard title={t('businessDashboard.patients.completed')} value={stats.completed.toLocaleString()} icon={UserCheck} color="bg-emerald-500" />
        <StatCard title={t('businessDashboard.patients.activeNow')} value={stats.active.toLocaleString()} icon={Clock} color="bg-amber-500" />
        <StatCard title={t('businessDashboard.patients.paidStats')} value={stats.paid.toLocaleString()} icon={DollarSign} color="bg-pink-500" />
      </div>

      {currentPlan === 'enterprise' && tickets.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 via-purple-600/50 to-pink-600/50 blur-xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div><div className="flex items-center gap-2 mb-2"><span className="px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{t('businessDashboard.patients.enterpriseBadge')}</span><h3 className="text-xl font-bold text-white">{t('businessDashboard.patients.retentionTitle')}</h3></div><p className="text-white/80">{t('businessDashboard.patients.retentionText', { returning: retentionStats.returning, total: retentionStats.total })}</p></div>
            <div className="text-right"><p className="text-5xl font-bold text-white">{retentionStats.rate}%</p><p className="text-white/70 text-sm">{t('businessDashboard.patients.retentionRate')}</p></div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1"><div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" /><input type="text" placeholder={t('businessDashboard.patients.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" /></div></div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"><option value="all">{t('businessDashboard.patients.statusAll')}</option><option value="waiting">{t('businessDashboard.patients.statusWaiting')}</option><option value="called">{t('businessDashboard.patients.statusCalled')}</option><option value="in-progress">{t('businessDashboard.patients.statusInProgress')}</option><option value="served">{t('businessDashboard.patients.statusServed')}</option><option value="done">{t('businessDashboard.patients.statusDone')}</option></select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"><option value="all">{t('businessDashboard.patients.paymentAll')}</option><option value="paid">{t('businessDashboard.patients.paymentPaid')}</option><option value="unpaid">{t('businessDashboard.patients.paymentUnpaid')}</option></select>
          <button onClick={handleExportCSV} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 font-medium shadow-lg shadow-emerald-500/20"><FaDownload />{t('businessDashboard.patients.export')}</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-lg dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('ticketNumber')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.patients.tableTicket')} <SortIcon field="ticketNumber" /></button></th>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('name')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.patients.tableCustomer')} <SortIcon field="name" /></button></th>
                <th className="px-5 py-4 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('businessDashboard.patients.tableContact')}</th>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('status')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.patients.tableStatus')} <SortIcon field="status" /></button></th>
                <th className="px-5 py-4 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('businessDashboard.patients.tablePayment')}</th>
                <th className="px-5 py-4 text-start"><button onClick={() => handleSort('createdAt')} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors">{t('businessDashboard.patients.tableDate')} <SortIcon field="createdAt" /></button></th>
                <th className="px-5 py-4 text-end text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('businessDashboard.patients.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {paginatedTickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-4"><span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-sm">#{ticket.ticketNumber}</span></td>
                  <td className="px-5 py-4"><div className="font-medium text-gray-900 dark:text-white">{ticket.userId?.name || ticket.guestName || t('businessDashboard.patients.guest')}</div></td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{ticket.userId?.phone || ticket.guestPhone || '-'}</td>
                  <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${['served', 'done', 'ended'].includes(ticket.status) ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : ticket.status === 'called' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : ['cancelled', 'no-show'].includes(ticket.status) ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>{['served', 'done', 'ended'].includes(ticket.status) && <CheckCircle size={12} />}{ticket.status === 'called' && <UserCheck size={12} />}{['waiting', 'in-progress'].includes(ticket.status) && <Clock size={12} />}{['cancelled', 'no-show'].includes(ticket.status) && <XCircle size={12} />}{ticket.status === 'pending_payment' && <DollarSign size={12} />}{['served', 'done', 'ended'].includes(ticket.status) ? t('businessDashboard.patients.statusServed') : ticket.status === 'called' ? t('businessDashboard.patients.statusCalled') : ticket.status === 'waiting' ? t('businessDashboard.patients.statusWaiting') : ticket.status === 'in-progress' ? t('businessDashboard.patients.statusInProgress') : ticket.status === 'cancelled' ? t('businessDashboard.patients.statusCancelled') : ticket.status === 'no-show' ? t('businessDashboard.patients.statusNoShow') : ticket.status === 'pending_payment' ? t('businessDashboard.patients.statusPendingPayment') : ticket.status}</span></td>
                  <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${ticket.paymentStatus === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'}`}>{ticket.paymentStatus === 'paid' ? `✓ ${t('businessDashboard.patients.paymentPaid')}` : t('businessDashboard.patients.paymentUnpaid')}</span></td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-end"><button onClick={() => handleDelete(ticket._id)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title={t('businessDashboard.patients.deleteTooltip')}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-transparent">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('businessDashboard.patients.showing', { start: indexOfFirstItem + 1, end: Math.min(indexOfLastItem, filteredTickets.length), total: filteredTickets.length })}</div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('businessDashboard.patients.previous')}</button>
            <span className="px-4 py-2 text-gray-500 dark:text-gray-400">{t('businessDashboard.patients.pageInfo', { current: currentPage, total: totalPages || 1 })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('businessDashboard.patients.next')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}



