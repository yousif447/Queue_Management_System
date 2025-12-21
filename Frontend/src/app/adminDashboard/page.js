"use client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ProtectedRoute from "@/components/ProtectedRoute";
import ThemeToggle from "@/components/ThemeToggle";
import { useTranslations } from "@/hooks/useTranslations";
import { API_URL } from '@/lib/api';
import { useEffect, useMemo, useState } from "react";
import { FaBan, FaBars, FaBox, FaBuilding, FaBullhorn, FaChartBar, FaCheckCircle, FaCheckSquare, FaChevronLeft, FaChevronRight, FaCircle, FaClock, FaCreditCard, FaCrown, FaDollarSign, FaDownload, FaEdit, FaEye, FaPlus, FaSearch, FaSignOutAlt, FaSquare, FaStar, FaSync, FaTicketAlt, FaTimes, FaTimesCircle, FaTrash, FaUserSecret, FaUserShield, FaUsers } from "react-icons/fa";

const API = `${API_URL}/api/v1/admin`;

export default function Page() {
  const { t } = useTranslations();
  const [data, setData] = useState({});
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [businessForm, setBusinessForm] = useState({});
  const [viewBusiness, setViewBusiness] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: "", message: "", targetAudience: "all" });
  const [filter, setFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const perPage = 12;

  const showToast = (m, t = "success") => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000); };
  const api = async (url, opts = {}) => fetch(url, { credentials: "include", ...opts, headers: { "Content-Type": "application/json", ...opts.headers } });

  const refresh = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const eps = ["users", "dashboard", "businesses", "tickets", "reviews", "categories", "payments", "staff", "subscriptions", "queue-monitoring", "system-health"];
      const res = await Promise.all(eps.map(e => api(`${API}/${e}`).then(r => r.ok ? r.json() : null).catch(() => null)));
      setData({ users: res[0], dashboard: res[1], businesses: res[2], tickets: res[3], reviews: res[4], categories: res[5], payments: res[6], staff: res[7], subscriptions: res[8], queues: res[9], health: res[10] });
      if (showLoading) showToast(t('adminDashboard.common.refresh'));
    } catch (e) { showToast(t('toast.failed'), "error"); }
    if (showLoading) setLoading(false);
  };


  useEffect(() => { refresh(); api(`${API_URL}/api/v1/auth/me`).then(r => r.ok ? r.json() : null).then(d => setAdminInfo(d?.data || d?.user)); }, []);

  const d = data.dashboard?.data || {};
  const users = useMemo(() => (data.users?.users || []).filter(u => u && u.role === "user"), [data]);
  const admins = useMemo(() => (data.users?.users || []).filter(u => u && u.role === "admin"), [data]);
  const owners = useMemo(() => (data.users?.users || []).filter(u => u && u.role === "owner"), [data]);
  const staff = useMemo(() => (data.staff?.staff || []).filter(s => s), [data]);
  const businesses = useMemo(() => (data.businesses?.businesses || []).filter(b => b), [data]);
  const tickets = useMemo(() => (data.tickets?.tickets || []).filter(t => t), [data]);
  const reviews = useMemo(() => (data.reviews?.reviews || []).filter(r => r), [data]);
  const categories = useMemo(() => (data.categories?.categories || []).filter(c => c), [data]);
  const payments = useMemo(() => (data.payments?.payments || []).filter(p => p), [data]);
  const subs = useMemo(() => (data.subscriptions?.subscriptions || []).filter(s => s), [data]);
  const subStats = data.subscriptions?.stats || {};
  const queues = useMemo(() => (data.queues?.queues || []).filter(q => q), [data]);
  const health = data.health?.health || {};

  const filterFn = (items, fields) => items.filter(i => i && fields.some(f => i[f]?.toString().toLowerCase().includes(search.toLowerCase())));
  const paginate = (items) => items.slice((page - 1) * perPage, page * perPage);
  const totalPages = (items) => Math.ceil(items.length / perPage);
  const statusColor = (s) => ({ waiting: "bg-amber-500/10 text-amber-600", completed: "bg-emerald-500/10 text-emerald-600", cancelled: "bg-red-500/10 text-red-600", active: "bg-emerald-500/10 text-emerald-600", inactive: "bg-gray-500/10 text-gray-600" }[s] || "bg-gray-500/10 text-gray-600");

  const deleteUser = async (id) => { if (!id) return; setSubmitting(true); const r = await api(`${API}/users/${id}`, { method: "DELETE" }); if (r.ok) { showToast(t('toast.deleted')); refresh(false); } else showToast(t('toast.failed'), "error"); setSubmitting(false); setDeleteConfirm(null); };
  const banUser = async (id, isBanned) => { if (!id || submitting) return; setSubmitting(true); try { const r = await api(`${API}/users/${id}/${isBanned ? "unban" : "ban"}`, { method: "PATCH", body: JSON.stringify({}) }); if (r.ok) { showToast(isBanned ? t('toast.unbanned') : t('toast.banned')); refresh(false); } else showToast(t('toast.failed'), "error"); } catch (e) { showToast(t('toast.failed'), "error"); } setSubmitting(false); };
  const updateUser = async () => { if (!editingUser?._id) return; setSubmitting(true); const r = await api(`${API}/users/${editingUser._id}`, { method: "PUT", body: JSON.stringify(editForm) }); if (r.ok) { showToast(t('toast.updated')); refresh(false); setEditingUser(null); } else showToast(t('toast.failed'), "error"); setSubmitting(false); };

  const updateBusiness = async () => { if (!editingBusiness?._id) return; setSubmitting(true); const r = await api(`${API_URL}/api/v1/businesses/business/${editingBusiness._id}`, { method: "PUT", body: JSON.stringify(businessForm) }); if (r.ok) { showToast(t('toast.updated')); refresh(false); setEditingBusiness(null); } else showToast(t('toast.failed'), "error"); setSubmitting(false); };
  const deleteBusiness = async (id) => { if (!id) return; setSubmitting(true); const r = await api(`${API_URL}/api/v1/businesses/business/${id}`, { method: "DELETE" }); if (r.ok) { showToast(t('toast.deleted')); refresh(false); } else showToast(t('toast.failed'), "error"); setSubmitting(false); setDeleteConfirm(null); };
  const toggleStatus = async (b) => { if (!b?._id || submitting) return; setSubmitting(true); await api(`${API_URL}/api/v1/businesses/business/${b._id}`, { method: "PUT", body: JSON.stringify({ status: b.status === "active" ? "inactive" : "active" }) }); showToast(t('toast.updated')); refresh(false); setSubmitting(false); };
  const deleteReview = async (id) => { if (!id) return; setSubmitting(true); await api(`${API}/reviews/${id}`, { method: "DELETE" }); showToast(t('toast.deleted')); refresh(false); setSubmitting(false); setDeleteConfirm(null); };
  const createAdmin = async () => { if (!newAdmin.name || !newAdmin.email || !newAdmin.password) { showToast(t('adminDashboard.common.fillFields'), "error"); return; } setSubmitting(true); const r = await api(`${API}/create-admin`, { method: "POST", body: JSON.stringify(newAdmin) }); if (r.ok) { showToast(t('toast.created')); setShowCreateAdmin(false); setNewAdmin({ name: "", email: "", password: "" }); refresh(false); } else { const e = await r.json(); showToast(e.message || t('toast.failed'), "error"); } setSubmitting(false); };
  const sendAnnouncement = async () => { if (!announcement.title || !announcement.message) { showToast(t('adminDashboard.common.fillFields'), "error"); return; } setSubmitting(true); const r = await api(`${API}/announcements`, { method: "POST", body: JSON.stringify(announcement) }); if (r.ok) { const d = await r.json(); showToast(d.message); setShowAnnouncement(false); setAnnouncement({ title: "", message: "", targetAudience: "all" }); } else showToast(t('toast.failed'), "error"); setSubmitting(false); };
  const bulkAction = async (action, type) => { if (selected.length === 0) { showToast(t('adminDashboard.common.selectItems'), "error"); return; } setSubmitting(true); const r = await api(`${API}/bulk-action`, { method: "POST", body: JSON.stringify({ action, type, ids: selected }) }); if (r.ok) { const d = await r.json(); showToast(d.message); setSelected([]); refresh(false); } else showToast(t('toast.failed'), "error"); setSubmitting(false); };

  const exportData = (type) => { window.open(`${API}/export/${type}`, "_blank"); };


  const toggleSelect = (id) => { if (!id) return; setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); };
  const selectAll = (items) => setSelected(s => s.length === items.length ? [] : items.filter(i => i?._id).map(i => i._id));

  const tabs = [{ id: "dashboard", label: t('adminDashboard.tabs.overview'), icon: FaChartBar }, { id: "users", label: t('adminDashboard.tabs.users'), icon: FaUsers }, { id: "businesses", label: t('adminDashboard.tabs.businesses'), icon: FaBuilding }, { id: "tickets", label: t('adminDashboard.tabs.tickets'), icon: FaTicketAlt }, { id: "reviews", label: t('adminDashboard.tabs.reviews'), icon: FaStar }, { id: "payments", label: t('adminDashboard.tabs.payments'), icon: FaCreditCard }, { id: "subscriptions", label: t('adminDashboard.tabs.subscriptions'), icon: FaBox }, { id: "queues", label: t('adminDashboard.tabs.queueMonitor'), icon: FaClock }, { id: "admins", label: t('adminDashboard.tabs.admins'), icon: FaUserSecret }];


  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 admin-bg-gradient flex items-center justify-center">
      <div className="card-admin-glass p-10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 animate-pulse">{t('adminDashboard.common.loading') || 'Loading...'}</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 admin-bg-gradient flex items-center justify-center">
      <div className="card-admin-glass p-10 text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <FaTimesCircle className="text-red-500 text-4xl" />
        </div>
        <p className="text-lg font-medium mb-6 text-gray-700 dark:text-gray-300">{error}</p>
        <button onClick={refresh} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">{t('adminDashboard.common.retry')}</button>
      </div>
    </div>
  );


  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 admin-bg-gradient text-gray-900 dark:text-white">
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center z-50"><button onClick={() => setSidebarOpen(true)}><FaBars /></button><span className="font-bold gradient-text">{t('adminDashboard.sidebar.adminRole')}</span><div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">{adminInfo?.name?.charAt(0) || "A"}</div></div>
        <div className="flex">
          {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
          <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${sidebarCollapsed ? "w-20" : "w-64"}`}>
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <FaCrown />
                    </div>
                    <span className="font-bold text-lg tracking-tight">{t('adminDashboard.title')}</span>
                  </div>
                )}
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <FaChevronLeft className={`transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
                </button>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FaTimes /></button>
              </div>
              
              <nav className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-thin">
                {tabs.map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); setSearch(""); setPage(1); setSelected([]); setSelectedBusiness(null); }} 
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                      activeTab === tab.id 
                        ? "sidebar-tab-active text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30" : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 group-hover:text-gray-700 dark:group-hover:text-gray-200"}`}>
                      <tab.icon className="text-base" />
                    </div>
                    {!sidebarCollapsed && <span className="font-medium">{tab.label}</span>}
                    {activeTab === tab.id && !sidebarCollapsed && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />}
                  </button>
                ))}
              </nav>

              {!sidebarCollapsed && (
                <div className="p-4 mx-4 mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-500">{t('adminDashboard.sidebar.theme')}</span>
                    <ThemeToggle />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-500">{t('adminDashboard.sidebar.lang')}</span>
                    <LanguageSwitcher dropUp={true} />
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className={`flex items-center gap-3 mb-4 ${sidebarCollapsed ? "justify-center" : ""}`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                    {adminInfo?.name?.charAt(0) || "A"}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{adminInfo?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{adminInfo?.email}</p>
                    </div>
                  )}
                </div>
                {!sidebarCollapsed ? (
                  <button 
                    onClick={() => { localStorage.removeItem('accessToken'); document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; api(`${API_URL}/api/v1/auth/logout`, { method: "POST" }); window.location.href = "/admin/login"; }} 
                    className="w-full px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <FaSignOutAlt /> {t('adminDashboard.sidebar.logout')}
                  </button>
                ) : (
                  <button onClick={() => { localStorage.removeItem('accessToken'); window.location.href = "/admin/login"; }} className="w-10 h-10 mx-auto flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl">
                    <FaSignOutAlt />
                  </button>
                )}
              </div>
            </div>
          </aside>
          <main className="flex-1 min-h-screen pt-20 lg:pt-8 p-6 lg:p-8">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{tabs.find(tab => tab.id === activeTab)?.label}</h1>
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowAnnouncement(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold flex items-center gap-2.5 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300">
                  <FaBullhorn /> {t('adminDashboard.announcement.button')}
                </button>
                <button onClick={refresh} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold flex items-center gap-2.5 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300">
                  <FaSync className={loading ? "animate-spin" : ""} /> {t('adminDashboard.common.refresh')}
                </button>
              </div>

            </div>


            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { l: t('adminDashboard.overview.totalUsers'), v: d.userCount || users.length, gradient: "icon-gradient-emerald", i: FaUsers, trend: "+12%", trendUp: true },
                    { l: t('adminDashboard.overview.totalBusinesses'), v: d.businessCount || businesses.length, gradient: "icon-gradient-teal", i: FaBuilding, trend: "+8%", trendUp: true },
                    { l: t('adminDashboard.overview.totalTickets'), v: d.ticketStats?.total || tickets.length, gradient: "icon-gradient-indigo", i: FaTicketAlt, trend: "+15%", trendUp: true },
                    { l: t('adminDashboard.overview.totalRevenue'), v: "$" + (d.totalRevenue || 0), gradient: "icon-gradient-amber", i: FaDollarSign, trend: "+22%", trendUp: true }
                  ].map((s, i) => (
                    <div key={i} className="card-admin-glass p-6 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-16 h-16 rounded-2xl ${s.gradient} flex items-center justify-center text-white`}>
                          <s.i className="text-2xl" />
                        </div>
                        <div className={`px-3 py-1.5 rounded-full ${s.trendUp ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'} text-xs font-bold flex items-center gap-1`}>
                          <span className={s.trendUp ? "" : "rotate-180"}>↑</span>{s.trend}
                        </div>
                      </div>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{s.v}</p>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.l}</p>
                    </div>
                  ))}
                </div>

                
                {/* Today's Activity Section */}
                <div className="mt-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500"></div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('adminDashboard.overview.todayActivity')}</h2>
                    <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                      { l: t('adminDashboard.overview.todayUsers'), v: d.todayStats?.users || 0, icon: FaUsers, color: "from-purple-500 to-indigo-600" },
                      { l: t('adminDashboard.overview.todayBiz'), v: d.todayStats?.businesses || 0, icon: FaBuilding, color: "from-cyan-500 to-blue-600" },
                      { l: t('adminDashboard.overview.todayTickets'), v: d.todayStats?.tickets || 0, icon: FaTicketAlt, color: "from-orange-500 to-amber-600" },
                      { l: t('adminDashboard.overview.completed'), v: d.ticketStats?.completed || 0, icon: FaCheckCircle, color: "from-emerald-500 to-green-600" }
                    ].map((s, i) => (
                      <div key={i} className="card-admin-glass p-5 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                          <s.icon className="text-xl" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.v}</p>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.l}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6 animate-fade-in">
                <div className="card-admin-glass p-5 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex gap-3">
                    <div className="search-modern relative">
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        placeholder={t('adminDashboard.users.searchPlaceholder')} 
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1); }} 
                        className="input-enterprise pl-11 text-sm w-72 !rounded-xl" 
                      />
                    </div>
                    <button onClick={() => exportData("users")} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
                      <FaDownload className="text-emerald-500" /> {t('adminDashboard.users.export')}
                    </button>
                  </div>
                  {selected.length > 0 && (
                    <div className="flex gap-2 animate-fade-in">

                      <button onClick={() => bulkAction("delete", "users")} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400 text-sm font-medium hover:from-red-500/20 hover:to-rose-500/20 transition-all border border-red-200/50 dark:border-red-800/50">
                        {t('adminDashboard.users.delete')} ({selected.length})
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginate(filterFn(users, ["name", "email"])).length === 0 ? (
                    <div className="col-span-full text-center py-16 card-admin-glass">
                      <FaUsers className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : paginate(filterFn(users, ["name", "email"])).map((u, idx) => (
                    <div key={u._id} className={`card-admin-glass p-0 overflow-hidden ${u.isBanned ? "border-red-300/50 dark:border-red-900/30" : ""}`}>
                      {/* Gradient header bar */}
                      <div className={`h-1.5 w-full ${u.isBanned ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'}`}></div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleSelect(u._id)} className="text-gray-400 hover:text-emerald-500">
                              {selected.includes(u._id) ? <FaCheckSquare className="text-emerald-500 text-xl" /> : <FaSquare className="text-xl" />}
                            </button>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl ${u.isBanned ? "bg-gradient-to-br from-red-500 to-rose-600" : "icon-gradient-emerald"}`}>
                              {u.name?.charAt(0)}
                            </div>

                            <div className="overflow-hidden">
                              <p className="font-bold text-gray-900 dark:text-white truncate text-lg">{u.name}</p>
                              <p className="text-sm text-gray-500 truncate">{u.email}</p>
                              {u.isBanned && <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full uppercase tracking-wider badge-glow-danger"><FaBan size={8} />{t('adminDashboard.users.banned')}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                          <button disabled={submitting} onClick={() => { setEditingUser(u); setEditForm({ name: u.name, email: u.email, phone: u.phone || "" }); }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:from-indigo-500/20 hover:to-purple-500/20 transition-all flex items-center justify-center gap-2 border border-indigo-200/50 dark:border-indigo-800/30 disabled:opacity-50 disabled:cursor-not-allowed">
                            <FaEdit /> {t('adminDashboard.common.edit')}
                          </button>
                          <button disabled={submitting} onClick={() => setDeleteConfirm({ t: "user", id: u._id, n: u.name })} className="w-12 py-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-500 text-xs font-semibold hover:from-red-500/20 hover:to-rose-500/20 transition-all flex items-center justify-center border border-red-200/50 dark:border-red-800/30 disabled:opacity-50 disabled:cursor-not-allowed">
                            <FaTrash />
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>


                {totalPages(filterFn(users, ["name", "email"])) > 1 && (
                  <div className="flex justify-center gap-3 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105"><FaChevronLeft className="rtl:rotate-180" /></button>
                    <span className="flex items-center px-6 font-semibold text-gray-700 dark:text-gray-200 card-admin-glass rounded-xl" dir="ltr">{page} / {totalPages(filterFn(users, ["name", "email"]))}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages(filterFn(users, ["name", "email"]))} className="w-12 h-12 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105"><FaChevronRight className="rtl:rotate-180" /></button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "businesses" && (
              <div className="space-y-6 animate-fade-in">
                <div className="card-admin-glass p-5 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex gap-3">
                    <div className="search-modern relative">
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        placeholder={t('adminDashboard.businesses.searchPlaceholder')} 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="input-enterprise pl-11 text-sm w-72 !rounded-xl" 
                      />
                    </div>
                    <button onClick={() => exportData("businesses")} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700">
                      <FaDownload className="text-teal-500" /> {t('adminDashboard.users.export')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginate(filterFn(businesses, ["name"])).length === 0 ? (
                    <div className="col-span-full text-center py-16 card-admin-glass">
                      <FaBuilding className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No businesses found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : paginate(filterFn(businesses, ["name"])).map((b, idx) => (
                    <div key={b._id} className="card-admin-glass p-0 overflow-hidden">
                      {/* Gradient header with status */}
                      <div className={`h-2 w-full ${b.status === 'active' ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl icon-gradient-teal flex items-center justify-center text-white font-bold text-xl">
                              {b.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white truncate max-w-[180px] text-lg">{b.name}</p>
                              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full mt-1.5">
                                <FaBuilding size={10} />{t('specializations.' + b.specialization)}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleStatus(b)} 
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                              b.status === 'active' 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'

                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${b.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            {t(`adminDashboard.statuses.${b.status}`)}
                          </button>
                        </div>
                        
                        <div className="flex gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                          <button onClick={() => setViewBusiness(b)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold hover:from-cyan-500/20 hover:to-blue-500/20 transition-all flex items-center justify-center gap-2 border border-cyan-200/50 dark:border-cyan-800/30">
                            <FaEye /> {t('adminDashboard.common.view')}
                          </button>
                          <button onClick={() => { setEditingBusiness(b); setBusinessForm({ name: b.name, email: b.email, status: b.status }); }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:from-indigo-500/20 hover:to-purple-500/20 transition-all flex items-center justify-center gap-2 border border-indigo-200/50 dark:border-indigo-800/30">
                            <FaEdit /> {t('adminDashboard.common.edit')}
                          </button>
                          <button onClick={() => setDeleteConfirm({ t: "business", id: b._id, n: b.name })} className="w-12 py-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-500 text-xs font-semibold hover:from-red-500/20 hover:to-rose-500/20 transition-all flex items-center justify-center border border-red-200/50 dark:border-red-800/30">
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages(filterFn(businesses, ["name"])) > 1 && (
                  <div className="flex justify-center gap-3 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"><FaChevronLeft className="rtl:rotate-180" /></button>
                    <span className="flex items-center px-6 font-semibold text-gray-700 dark:text-gray-200 card-admin-glass rounded-xl" dir="ltr">{page} / {totalPages(filterFn(businesses, ["name"]))}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages(filterFn(businesses, ["name"]))} className="w-12 h-12 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"><FaChevronRight className="rtl:rotate-180" /></button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="space-y-6">
                {!selectedBusiness ? (
                  <>
                    {/* Business Selection View */}
                    <div className="card-admin-glass p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl icon-gradient-indigo flex items-center justify-center text-white">
                          <FaTicketAlt />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{t('adminDashboard.tabs.tickets')}</h3>
                          <p className="text-sm text-gray-500">{t('adminDashboard.businesses.selectBusiness') || 'Select a business to view tickets'}</p>
                        </div>
                      </div>
                      <div className="relative w-full md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          value={search} 
                          onChange={e => { setSearch(e.target.value); setPage(1); }}
                          placeholder={t('adminDashboard.businesses.searchPlaceholder') || 'Search businesses...'}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {paginate(filterFn(businesses, ["name"])).map(b => (
                        <button key={b._id} onClick={() => setSelectedBusiness(b)} className="card-admin-glass p-5 text-left hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl icon-gradient-indigo flex items-center justify-center text-white font-bold text-xl">
                              {b.name?.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-gray-900 dark:text-white truncate">{b.name}</p>
                              <p className="text-sm text-gray-500 truncate">{t('specializations.' + b.specialization)}</p>
                              <p className="text-xs text-indigo-500 mt-1">{tickets.filter(t => t.businessId?._id === b._id).length} tickets</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {totalPages(filterFn(businesses, ["name"])) > 1 && (
                      <div className="flex justify-center gap-3 mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronLeft className="rtl:rotate-180" /></button>
                        <span className="flex items-center px-4 font-semibold text-gray-700 dark:text-gray-200 card-admin-glass rounded-xl" dir="ltr">{page} / {totalPages(filterFn(businesses, ["name"]))}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages(filterFn(businesses, ["name"]))} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronRight className="rtl:rotate-180" /></button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Tickets for Selected Business */}
                    <div className="card-admin-glass p-5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedBusiness(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <FaChevronLeft />
                        </button>
                        <div className="w-10 h-10 rounded-xl icon-gradient-indigo flex items-center justify-center text-white font-bold">
                          {selectedBusiness.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedBusiness.name}</h3>
                          <p className="text-sm text-gray-500">{t('specializations.' + selectedBusiness.specialization)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-enterprise py-2.5 text-sm w-40 !mt-0 !rounded-xl bg-white/50 dark:bg-gray-800/50">
                          <option value="all">{t('adminDashboard.tickets.filterAll')}</option>
                          <option value="waiting">{t('adminDashboard.tickets.filterWaiting')}</option>
                          <option value="completed">{t('adminDashboard.tickets.filterCompleted')}</option>
                          <option value="cancelled">{t('adminDashboard.tickets.filterCancelled')}</option>
                        </select>
                        <button onClick={() => exportData("tickets")} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                          <FaDownload className="text-indigo-500" /> {t('adminDashboard.users.export')}
                        </button>
                      </div>
                    </div>

                    <div className="card-admin-glass overflow-hidden !p-0">
                      <div className="overflow-x-auto">
                        <table className="admin-table text-sm w-full">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.tickets.customer')}</th>
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.users.status')}</th>
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.tickets.date')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {tickets.filter(tk => tk.businessId?._id === selectedBusiness._id && (filter === "all" || tk.status === filter)).map(tk => (
                              <tr key={tk._id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5">
                                <td className="p-5">
                                  <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">#{tk.ticketNumber}</span>
                                </td>
                                <td className="p-5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                      {(tk.userId?.name || tk.guestName || "?").charAt(0)}
                                    </div>
                                    <span>{tk.userId?.name || tk.guestName || t('adminDashboard.tickets.guest')}</span>
                                  </div>
                                </td>
                                <td className="p-5">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColor(tk.status)}`}>
                                    {t(`adminDashboard.statuses.${tk.status}`)}
                                  </span>
                                </td>
                                <td className="p-5 text-gray-500">{new Date(tk.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {tickets.filter(tk => tk.businessId?._id === selectedBusiness._id).length === 0 && (
                          <div className="text-center py-16">
                            <FaTicketAlt className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No tickets found for this business</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}


            {activeTab === "reviews" && (
              <div className="space-y-6">
                {!selectedBusiness ? (
                  <>
                    {/* Business Selection View */}
                    <div className="card-admin-glass p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl icon-gradient-amber flex items-center justify-center text-white">
                          <FaStar />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{t('adminDashboard.tabs.reviews')}</h3>
                          <p className="text-sm text-gray-500">{t('adminDashboard.businesses.selectBusiness') || 'Select a business to view reviews'}</p>
                        </div>
                      </div>
                      <div className="relative w-full md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          value={search} 
                          onChange={e => { setSearch(e.target.value); setPage(1); }}
                          placeholder={t('adminDashboard.businesses.searchPlaceholder') || 'Search businesses...'}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {paginate(filterFn(businesses, ["name"])).map(b => (
                        <button key={b._id} onClick={() => setSelectedBusiness(b)} className="card-admin-glass p-5 text-left hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl icon-gradient-amber flex items-center justify-center text-white font-bold text-xl">
                              {b.name?.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-gray-900 dark:text-white truncate">{b.name}</p>
                              <p className="text-sm text-gray-500 truncate">{t('specializations.' + b.specialization)}</p>
                              <p className="text-xs text-amber-500 mt-1">{reviews.filter(r => r.businessId?._id === b._id).length} reviews</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {totalPages(filterFn(businesses, ["name"])) > 1 && (
                      <div className="flex justify-center gap-3 mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronLeft className="rtl:rotate-180" /></button>
                        <span className="flex items-center px-4 font-semibold text-gray-700 dark:text-gray-200 card-admin-glass rounded-xl" dir="ltr">{page} / {totalPages(filterFn(businesses, ["name"]))}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages(filterFn(businesses, ["name"]))} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronRight className="rtl:rotate-180" /></button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Reviews for Selected Business */}
                    <div className="card-admin-glass p-5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedBusiness(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <FaChevronLeft />
                        </button>
                        <div className="w-10 h-10 rounded-xl icon-gradient-amber flex items-center justify-center text-white font-bold">
                          {selectedBusiness.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedBusiness.name}</h3>
                          <p className="text-sm text-gray-500">{reviews.filter(r => r.businessId?._id === selectedBusiness._id).length} reviews</p>
                        </div>
                      </div>
                      <button onClick={() => exportData("reviews")} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                        <FaDownload className="text-amber-500" /> {t('adminDashboard.users.export')}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {reviews.filter(r => r.businessId?._id === selectedBusiness._id).map((r, idx) => (
                        <div key={r._id} className="card-admin-glass p-0 overflow-hidden flex flex-col justify-between">
                          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
                          <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl icon-gradient-indigo flex items-center justify-center text-white text-lg font-bold">
                                  {(r.userId?.name || "?").charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{r.userId?.name || t('adminDashboard.reviews.anonymous')}</p>
                                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar key={i} className={`text-sm ${i < r.rating ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}`} />
                                ))}
                              </div>
                            </div>
                            <div className="bg-gray-50/80 dark:bg-gray-800/30 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 italic">
                              {r.comment}
                            </div>
                          </div>
                          <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20">
                            <button onClick={() => setDeleteConfirm({ t: "review", id: r._id, n: "review" })} className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {reviews.filter(r => r.businessId?._id === selectedBusiness._id).length === 0 && (
                      <div className="card-admin-glass text-center py-16">
                        <FaStar className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">No reviews found for this business</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}



            {activeTab === "payments" && (
              <div className="space-y-6">
                {!selectedBusiness ? (
                  <>
                    {/* Business Selection View */}
                    <div className="card-admin-glass p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl icon-gradient-emerald flex items-center justify-center text-white">
                          <FaCreditCard />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{t('adminDashboard.tabs.payments')}</h3>
                          <p className="text-sm text-gray-500">{t('adminDashboard.businesses.selectBusiness') || 'Select a business to view payments'}</p>
                        </div>
                      </div>
                      <div className="relative w-full md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          value={search} 
                          onChange={e => { setSearch(e.target.value); setPage(1); }}
                          placeholder={t('adminDashboard.businesses.searchPlaceholder') || 'Search businesses...'}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {paginate(filterFn(businesses, ["name"])).map(b => (
                        <button key={b._id} onClick={() => setSelectedBusiness(b)} className="card-admin-glass p-5 text-left hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl icon-gradient-emerald flex items-center justify-center text-white font-bold text-xl">
                              {b.name?.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-gray-900 dark:text-white truncate">{b.name}</p>
                              <p className="text-sm text-gray-500 truncate">{t('specializations.' + b.specialization)}</p>
                              <p className="text-xs text-emerald-500 mt-1">{payments.filter(p => p.businessId?._id === b._id).length} payments</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {totalPages(filterFn(businesses, ["name"])) > 1 && (
                      <div className="flex justify-center gap-3 mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronLeft className="rtl:rotate-180" /></button>
                        <span className="flex items-center px-4 font-semibold text-gray-700 dark:text-gray-200 card-admin-glass rounded-xl" dir="ltr">{page} / {totalPages(filterFn(businesses, ["name"]))}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages(filterFn(businesses, ["name"]))} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronRight className="rtl:rotate-180" /></button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Payments for Selected Business */}
                    <div className="card-admin-glass p-5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedBusiness(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <FaChevronLeft />
                        </button>
                        <div className="w-10 h-10 rounded-xl icon-gradient-emerald flex items-center justify-center text-white font-bold">
                          {selectedBusiness.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedBusiness.name}</h3>
                          <p className="text-sm text-gray-500">{payments.filter(p => p.businessId?._id === selectedBusiness._id).length} payments</p>
                        </div>
                      </div>
                    </div>

                    <div className="card-admin-glass overflow-hidden !p-0">
                      <div className="overflow-x-auto">
                        <table className="admin-table text-sm w-full">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.tickets.customer') || 'Customer'}</th>
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.payments.amount')}</th>
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.payments.method')}</th>
                              <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.payments.date')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {payments.filter(p => p.businessId?._id === selectedBusiness._id).map(p => (
                              <tr key={p._id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5">
                                <td className="p-5">
                                  <span className="font-mono font-bold text-gray-600 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">#{p.ticketNumber}</span>
                                </td>
                                <td className="p-5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                      {(p.userId?.name || p.guestName || "?").charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{p.userId?.name || p.guestName || t('adminDashboard.tickets.guest')}</p>
                                      {p.userId?.email && <p className="text-xs text-gray-500">{p.userId.email}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-5">
                                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">${p.price || 0}</span>
                                </td>
                                <td className="p-5">
                                  <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/30">
                                    {p.paymentMethod}
                                  </span>
                                </td>
                                <td className="p-5 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {payments.filter(p => p.businessId?._id === selectedBusiness._id).length === 0 && (
                          <div className="text-center py-16">
                            <FaCreditCard className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No payments found for this business</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}


            {activeTab === "subscriptions" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[
                    { l: t('adminDashboard.subscriptions.stats.total'), v: subStats.total, gradient: "from-gray-400 to-gray-600", i: FaCircle }, 
                    { l: t('adminDashboard.subscriptions.stats.active'), v: subStats.active, gradient: "from-emerald-400 to-teal-600", i: FaCheckCircle }, 
                    { l: t('adminDashboard.subscriptions.stats.trial'), v: subStats.trial, gradient: "from-blue-400 to-indigo-600", i: FaClock }, 
                    { l: t('adminDashboard.subscriptions.stats.inactive'), v: subStats.inactive, gradient: "from-gray-300 to-gray-500", i: FaTimesCircle }
                  ].map((s, i) => (
                    <div key={i} className={`card-admin-glass p-5`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.v || 0}</p>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">{s.l}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white`}>
                          <s.i className="text-xl" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Search Bar */}
                <div className="card-admin-glass p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{subs.length} {t('adminDashboard.tabs.subscriptions')}</span>
                  <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      value={search} 
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                      placeholder={t('adminDashboard.businesses.searchPlaceholder') || 'Search businesses...'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </div>
                
                {/* Subscriptions Table */}
                <div className="card-admin-glass overflow-hidden !p-0">
                  <div className="overflow-x-auto">
                    <table className="admin-table text-sm w-full">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.subscriptions.business')}</th>
                          <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.subscriptions.plan')}</th>
                          <th className="text-start p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('adminDashboard.subscriptions.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {paginate(subs.filter(s => !search || s.businessName?.toLowerCase().includes(search.toLowerCase()))).map(s => (
                          <tr key={s._id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {(s.businessName || "?").charAt(0)}
                                </div>
                                <span className="font-medium">{s.businessName}</span>
                              </div>
                            </td>
                            <td className="p-5"><span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase border border-indigo-200/50 dark:border-indigo-800/30">{s.plan}</span></td>
                            <td className="p-5"><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColor(s.status)}`}>{t(`adminDashboard.statuses.${s.status}`)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Pagination */}
                {totalPages(subs.filter(s => !search || s.businessName?.toLowerCase().includes(search.toLowerCase()))) > 1 && (
                  <div className="flex justify-center gap-3">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronLeft className="rtl:rotate-180" /></button>
                    <span className="flex items-center px-4 font-semibold text-gray-700 dark:text-gray-200 card-admin-glass rounded-xl" dir="ltr">{page} / {totalPages(subs.filter(s => !search || s.businessName?.toLowerCase().includes(search.toLowerCase())))}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages(subs.filter(s => !search || s.businessName?.toLowerCase().includes(search.toLowerCase())))} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronRight className="rtl:rotate-180" /></button>
                  </div>
                )}
              </div>
            )}



            {activeTab === "queues" && (
              <div className="space-y-6">
                {!selectedBusiness ? (
                  <>
                    {/* Business Selection View */}
                    <div className="card-admin-glass p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl icon-gradient-indigo flex items-center justify-center text-white">
                          <FaClock />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{t('adminDashboard.tabs.queueMonitor')}</h3>
                          <p className="text-sm text-gray-500">{t('adminDashboard.businesses.selectBusiness') || 'Select a business to view queue'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-full md:w-64">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" 
                            value={search} 
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder={t('adminDashboard.businesses.searchPlaceholder') || 'Search businesses...'}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                          </span>
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('adminDashboard.queues.liveStatus')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {paginate(filterFn(businesses, ["name"])).map(b => {
                        const queue = queues.find(q => q.businessId === b._id || q.businessName === b.name);
                        return (
                          <button key={b._id} onClick={() => setSelectedBusiness(b)} className="card-admin-glass p-5 text-left hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl icon-gradient-indigo flex items-center justify-center text-white font-bold text-xl">
                                {b.name?.charAt(0)}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-gray-900 dark:text-white truncate">{b.name}</p>
                                <p className="text-sm text-gray-500 truncate">{t('specializations.' + b.specialization)}</p>
                                <p className="text-xs text-indigo-500 mt-1">
                                  {queue ? `${queue.waiting || 0} waiting` : 'No active queue'}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {totalPages(filterFn(businesses, ["name"])) > 1 && (
                      <div className="flex justify-center gap-3 mt-6">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronLeft className="rtl:rotate-180" /></button>
                        <span className="flex items-center px-4 font-semibold text-gray-700 dark:text-gray-200 card-admin-glass rounded-xl" dir="ltr">{page} / {totalPages(filterFn(businesses, ["name"]))}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages(filterFn(businesses, ["name"]))} className="w-10 h-10 rounded-xl card-admin-glass flex items-center justify-center disabled:opacity-40"><FaChevronRight className="rtl:rotate-180" /></button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Queue for Selected Business */}
                    <div className="card-admin-glass p-5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedBusiness(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <FaChevronLeft />
                        </button>
                        <div className="w-10 h-10 rounded-xl icon-gradient-indigo flex items-center justify-center text-white font-bold">
                          {selectedBusiness.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedBusiness.name}</h3>
                          <p className="text-sm text-gray-500">{t('specializations.' + selectedBusiness.specialization)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('adminDashboard.queues.liveStatus')}</span>
                      </div>
                    </div>

                    {(() => {
                      const queue = queues.find(q => q.businessId === selectedBusiness._id || q.businessName === selectedBusiness.name);
                      if (!queue) {
                        return (
                          <div className="card-admin-glass text-center py-20">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <FaClock className="text-gray-400 text-3xl" />
                            </div>
                            <p className="text-gray-500 font-semibold text-lg">{t('adminDashboard.queues.noActiveQueues')}</p>
                          </div>
                        );
                      }
                      return (
                        <div className="card-admin-glass p-0 overflow-hidden">
                          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                              <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${statusColor(queue.status)}`}>
                                {t(`adminDashboard.statuses.${queue.status}`)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                                <p className="text-5xl font-bold text-amber-500">{queue.waiting}</p>
                                <p className="text-sm uppercase font-bold text-gray-400 tracking-wider mt-2">{t('adminDashboard.queues.waiting')}</p>
                              </div>
                              <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                                <p className="text-5xl font-bold text-emerald-500">{queue.serving}</p>
                                <p className="text-sm uppercase font-bold text-gray-400 tracking-wider mt-2">{t('adminDashboard.queues.serving')}</p>
                              </div>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${Math.min(((queue.serving + queue.waiting) / 20) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}


            {activeTab === "admins" && (
              <div className="space-y-6">
                <div className="card-admin-glass p-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl icon-gradient-emerald flex items-center justify-center text-white">
                      <FaUserShield />
                    </div>
                    <h3 className="font-bold text-lg">{t('adminDashboard.sidebar.adminRole')}</h3>
                  </div>
                  <button onClick={() => setShowCreateAdmin(true)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold flex items-center gap-2">
                    <FaPlus /> {t('adminDashboard.admins.addAdmin')}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {admins.map((a, idx) => (
                    <div key={a._id} className="card-admin-glass p-0 overflow-hidden">
                      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
                      <div className="p-5 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-emerald-500 p-1">
                          <div className="w-full h-full rounded-xl icon-gradient-emerald flex items-center justify-center text-white text-2xl">
                            <FaUserShield />
                          </div>
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="font-bold text-lg text-gray-900 dark:text-white truncate">{a.name}</p>
                          <p className="text-sm text-gray-500 truncate">{a.email}</p>
                          <span className="inline-flex mt-2 items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                            <FaCheckCircle size={10} /> Active
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2.5 p-5 pt-0 border-t border-gray-100 dark:border-gray-800/50 mt-4">
                        <button disabled={submitting} onClick={() => { setEditingUser(a); setEditForm({ name: a.name, email: a.email }); }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:from-indigo-500/20 hover:to-purple-500/20 transition-all flex items-center justify-center gap-2 border border-indigo-200/50 dark:border-indigo-800/30 disabled:opacity-50 disabled:cursor-not-allowed">
                          <FaEdit /> {t('adminDashboard.common.edit')}
                        </button>
                        <button disabled={submitting} onClick={() => setDeleteConfirm({ t: "user", id: a._id, n: a.name })} className="w-12 py-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-500 text-xs font-semibold hover:from-red-500/20 hover:to-rose-500/20 transition-all flex items-center justify-center border border-red-200/50 dark:border-red-800/30 disabled:opacity-50 disabled:cursor-not-allowed">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Modals with glass-morphism */}
        {editingUser && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="modal-glass w-full max-w-md"><div className="p-6"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-xl icon-gradient-emerald flex items-center justify-center text-white text-xl"><FaEdit /></div><h2 className="font-bold text-xl">{t('adminDashboard.users.edit')}</h2></div><div className="space-y-4"><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder={t('adminDashboard.admins.namePlaceholder')} className="input-enterprise !rounded-xl" /><input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} placeholder={t('adminDashboard.admins.emailPlaceholder')} className="input-enterprise !rounded-xl" /></div><div className="flex gap-3 mt-6"><button onClick={updateUser} disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">{submitting ? "..." : t('adminDashboard.common.update')}</button><button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">{t('adminDashboard.common.cancel')}</button></div></div></div></div>}
        {editingBusiness && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="modal-glass w-full max-w-md"><div className="p-6"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-xl icon-gradient-teal flex items-center justify-center text-white text-xl"><FaBuilding /></div><h2 className="font-bold text-xl">{t('adminDashboard.modals.editBusiness')}</h2></div><div className="space-y-4"><input value={businessForm.name} onChange={e => setBusinessForm(p => ({ ...p, name: e.target.value }))} placeholder={t('adminDashboard.admins.namePlaceholder')} className="input-enterprise !rounded-xl" /><select value={businessForm.status} onChange={e => setBusinessForm(p => ({ ...p, status: e.target.value }))} className="input-enterprise !rounded-xl"><option value="active">{t('common.active')}</option><option value="inactive">{t('common.inactive')}</option></select></div><div className="flex gap-3 mt-6"><button onClick={updateBusiness} disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">{submitting ? "..." : t('adminDashboard.common.update')}</button><button onClick={() => setEditingBusiness(null)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">{t('adminDashboard.common.cancel')}</button></div></div></div></div>}
        {viewBusiness && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="modal-glass w-full max-w-lg max-h-[80vh] overflow-y-auto"><div className="p-6"><div className="flex justify-between items-start mb-6"><div className="flex items-center gap-3"><div className="w-14 h-14 rounded-xl icon-gradient-teal flex items-center justify-center text-white text-2xl font-bold">{viewBusiness.name?.charAt(0)}</div><div><h2 className="font-bold text-xl">{viewBusiness.name}</h2><span className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusColor(viewBusiness.status)}`}>{t(`adminDashboard.statuses.${viewBusiness.status}`)}</span></div></div><button onClick={() => setViewBusiness(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><FaTimes /></button></div><div className="grid grid-cols-2 gap-4 text-sm">{[{ l: t('adminDashboard.categories.category'), v: viewBusiness.specialization }, { l: t('adminDashboard.admins.emailPlaceholder').replace(' *', ''), v: viewBusiness.email }, { l: t('contact.form.phone'), v: viewBusiness.mobilePhone }].map((f, i) => <div key={i} className="p-4 bg-gray-50/80 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800/50"><p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{f.l}</p><p className="font-medium">{f.v || "N/A"}</p></div>)}</div>{viewBusiness.service?.length > 0 && <div className="mt-6"><p className="font-bold mb-3">{t('homePage.services')}</p>{viewBusiness.service.map((s, i) => <div key={i} className="flex justify-between p-3 bg-gray-50/80 dark:bg-gray-800/30 rounded-xl mb-2 text-sm border border-gray-100 dark:border-gray-800/50"><span className="font-medium">{s.name}</span><span className="font-bold text-emerald-600">{s.price} EGP</span></div>)}</div>}</div></div></div>}
        {deleteConfirm && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="modal-glass w-full max-w-sm"><div className="p-6 text-center"><div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6"><FaTrash className="text-red-500 text-3xl" /></div><p className="text-lg font-medium mb-6">{t('adminDashboard.common.deleteConfirm', { name: deleteConfirm.n })}</p><div className="flex gap-3"><button onClick={() => { if (deleteConfirm.t === "user") deleteUser(deleteConfirm.id); else if (deleteConfirm.t === "business") deleteBusiness(deleteConfirm.id); else deleteReview(deleteConfirm.id); }} disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all">{submitting ? "..." : t('adminDashboard.users.delete')}</button><button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">{t('adminDashboard.common.cancel')}</button></div></div></div></div>}
        {showCreateAdmin && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="modal-glass w-full max-w-md"><div className="p-6"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-xl icon-gradient-emerald flex items-center justify-center text-white text-xl"><FaUserShield /></div><h2 className="font-bold text-xl">{t('adminDashboard.admins.createTitle')}</h2></div><div className="space-y-4"><input value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} placeholder={t('adminDashboard.admins.namePlaceholder')} className="input-enterprise !rounded-xl" /><input value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} placeholder={t('adminDashboard.admins.emailPlaceholder')} className="input-enterprise !rounded-xl" /><input type="password" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} placeholder={t('adminDashboard.admins.passwordPlaceholder')} className="input-enterprise !rounded-xl" /></div><div className="flex gap-3 mt-6"><button onClick={createAdmin} disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">{submitting ? "..." : t('adminDashboard.common.create')}</button><button onClick={() => setShowCreateAdmin(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">{t('adminDashboard.common.cancel')}</button></div></div></div></div>}
        {showAnnouncement && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="modal-glass w-full max-w-md"><div className="p-6"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl"><FaBullhorn /></div><h2 className="font-bold text-xl">{t('adminDashboard.announcement.title')}</h2></div><div className="space-y-4"><input value={announcement.title} onChange={e => setAnnouncement(p => ({ ...p, title: e.target.value }))} placeholder={t('adminDashboard.announcement.titlePlaceholder')} className="input-enterprise !rounded-xl" /><textarea value={announcement.message} onChange={e => setAnnouncement(p => ({ ...p, message: e.target.value }))} placeholder={t('adminDashboard.announcement.messagePlaceholder')} rows={3} className="input-enterprise !rounded-xl" /><select value={announcement.targetAudience} onChange={e => setAnnouncement(p => ({ ...p, targetAudience: e.target.value }))} className="input-enterprise !rounded-xl"><option value="all">{t('adminDashboard.announcement.targetAll')}</option><option value="users">{t('adminDashboard.announcement.targetUsers')}</option><option value="owners">{t('adminDashboard.announcement.targetOwners')}</option></select></div><div className="flex gap-3 mt-6"><button onClick={sendAnnouncement} disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all">{submitting ? "..." : t('adminDashboard.announcement.send')}</button><button onClick={() => setShowAnnouncement(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">{t('adminDashboard.common.cancel')}</button></div></div></div></div>}
        {toast && <div className="fixed bottom-6 right-6 z-50 animate-fade-in"><div className={`px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-red-500 to-rose-600"} text-white font-medium`}>{toast.type === "success" ? <FaCheckCircle className="text-xl" /> : <FaTimesCircle className="text-xl" />}{toast.message}</div></div>}

      </div>
    </ProtectedRoute>
  );
}



