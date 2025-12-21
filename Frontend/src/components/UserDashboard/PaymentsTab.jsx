"use client";
import { API_URL } from '@/lib/api';

import { CreditCard, DollarSign, Ticket } from 'lucide-react';

// Helper to handle both Cloudinary URLs and relative paths
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 dark:opacity-20 blur-3xl rounded-full`}></div>
    <div className="relative z-10">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-20 w-fit mb-3`}><Icon className="text-white" size={20} /></div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function PaymentsTab({ t, myPayments, loadingPayments }) {
  const totalSpent = myPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedPayments = myPayments.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><CreditCard className="text-emerald-500" /> {t('userDashboard.payments.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('userDashboard.payments.subtitle')}</p>
      </div>

      {myPayments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title={t('userDashboard.payments.totalSpent')} value={`$${totalSpent.toFixed(2)}`} icon={DollarSign} color="bg-emerald-500" />
          <StatCard title={t('userDashboard.payments.totalTransactions')} value={myPayments.length} icon={CreditCard} color="bg-indigo-500" />
          <StatCard title={t('userDashboard.payments.completed')} value={completedPayments} icon={Ticket} color="bg-purple-500" />
        </div>
      )}

      {loadingPayments ? (
        <div className="min-h-[400px] flex items-center justify-center"><div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div></div>
      ) : myPayments.length === 0 ? (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-20 text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-emerald-500/10"></div>
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
            <CreditCard className="text-gray-400 dark:text-gray-500" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('userDashboard.payments.noPayments')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-lg">{t('userDashboard.payments.noPayments')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {myPayments.map((payment) => (
            <div key={payment._id} className="group bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 hover:shadow-2xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
               
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                   {payment.businessId?.profileImage ? (
                      <img 
                        src={getImageUrl(payment.businessId.profileImage)}
                        alt={payment.businessId.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                   ) : null}
                   <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700" style={{ display: payment.businessId?.profileImage ? 'none' : 'flex' }}>
                      {payment.paymentMethod === 'card' ? <CreditCard className="text-indigo-500" size={24} /> : <DollarSign className="text-emerald-500" size={24} />}
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{payment.businessId?.name || 'Business'}</h3>
                     <p className="text-xs text-gray-500 font-mono mt-1">ID: #{payment.transactionId || payment._id.slice(-8)}</p>
                   </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide w-fit ${
                  payment.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/50' :
                  payment.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/50' :
                  'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/50'
                }`}>{payment.status}</span>
              </div>

              <div className="flex items-end justify-between mb-8 pb-8 border-b border-gray-100 dark:border-gray-700/50 relative z-10">
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('userDashboard.payments.totalAmount')}</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">${(payment.amount).toFixed(2)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('userDashboard.payments.date')}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                 </div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                     {payment.paymentMethod === 'card' ? (
                       <><CreditCard size={16} /> {t('userDashboard.payments.paidViaCard')}</>
                     ) : (
                       <><DollarSign size={16} /> {t('userDashboard.payments.paidViaCash')}</>
                     )}
                  </div>
                  <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                     {new Date(payment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



