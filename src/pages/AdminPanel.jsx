import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldAlert, ArrowLeft, Users, Calendar, Settings,
  Trash2, Edit, AlertCircle, CheckCircle2,
  Plus, Save, XCircle, Shuffle, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TABS = [
  { key: 'users',        label: 'Users',          Icon: Users },
  { key: 'reservations', label: 'Reservations',   Icon: Calendar },
  { key: 'spots',        label: 'Spot Settings',  Icon: Settings },
];

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers]               = useState([]);
  const [spots, setSpots]               = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error,   setError]             = useState('');
  const [success, setSuccess]           = useState('');
  const [userSearch, setUserSearch]     = useState('');
  const [editingRes, setEditingRes]     = useState(null);
  const [showCreate, setShowCreate]     = useState(false);

  /* ─── Create User Form ───── */
  const [createForm, setCreateForm] = useState({
    name: '', email: '', authorization_number: '', role: 'user'
  });
  const genCode = () => setCreateForm(p => ({
    ...p,
    authorization_number: Array.from({length:8}, () => Math.floor(Math.random()*10)).join('')
  }));

  /* ─── Proxy Booking Form ─── */
  const [adminBooking, setAdminBooking] = useState({
    user_id:'', spot_id:'',
    date: new Date().toISOString().split('T')[0],
    start_time:'', end_time:''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [u, s, r] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/reservations/spots'),
        api.get('/api/reservations'),
      ]);
      setUsers(u.data); setSpots(s.data); setReservations(r.data);
    } catch { setError('Failed to load administrative data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const notify = (msg, isErr=false) => {
    if (isErr) { setError(msg); setSuccess(''); }
    else       { setSuccess(msg); setError(''); }
  };

  /* ─── Create User ─────────────────────────── */
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const { name, email, authorization_number, role } = createForm;
    if (authorization_number.length !== 8) { notify('Authorization number must be exactly 8 digits.', true); return; }
    try {
      const r = await api.post('/api/auth/register', { authorization_number, name, email, role });
      notify(`Account created for ${r.data.user.name}.`);
      setShowCreate(false);
      setCreateForm({ name:'', email:'', authorization_number:'', role:'user' });
      fetchData();
    } catch (err) {
      notify(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Creation failed.', true);
    }
  };

  /* ─── Toggle user status ──────────────────── */
  const handleToggleUser = async (u) => {
    if (u.id === user.id) { notify('Cannot disable your own account.', true); return; }
    if (!window.confirm(`${u.is_enabled ? 'Disable' : 'Enable'} ${u.name}?`)) return;
    try {
      const r = await api.put(`/api/admin/users/${u.id}/status`, { is_enabled: !u.is_enabled });
      notify(r.data.message);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_enabled: !x.is_enabled } : x));
    } catch (err) { notify(err.response?.data?.error || 'Failed.', true); }
  };

  /* ─── Spot status ────────────────────────── */
  const handleToggleSpot = async (spotId, cur) => {
    const next = cur === 'available' ? 'maintenance' : 'available';
    if (!window.confirm(`Set to ${next}?`)) return;
    try {
      const r = await api.put(`/api/admin/spots/${spotId}/status`, { status: next });
      notify(r.data.message);
      setSpots(prev => prev.map(s => s.id === spotId ? { ...s, status: next } : s));
    } catch (err) { notify(err.response?.data?.error || 'Failed.', true); }
  };

  /* ─── Proxy Booking ──────────────────────── */
  const handleProxyBook = async (e) => {
    e.preventDefault();
    const { user_id, spot_id, date, start_time, end_time } = adminBooking;
    if (!user_id || !spot_id || !start_time || !end_time) { notify('All fields required.', true); return; }
    const s  = new Date(`${date}T${start_time}`);
    const en = new Date(`${date}T${end_time}`);
    if (s >= en) { notify('End must be after start.', true); return; }
    try {
      const r = await api.post('/api/admin/reservations', {
        user_id, charging_spot_id: spot_id,
        start_time: s.toISOString(), end_time: en.toISOString()
      });
      notify(r.data.message);
      setAdminBooking(p => ({ ...p, user_id:'', start_time:'', end_time:'' }));
      fetchData();
    } catch (err) {
      notify(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Overlap or scheduling error.', true);
    }
  };

  /* ─── Edit Reservation ───────────────────── */
  const startEdit = (res) => {
    const sd = new Date(res.start_time);
    const ed = new Date(res.end_time);
    setEditingRes({
      id: res.id,
      user_name: res.users?.name || '—',
      spot_id: res.charging_spot_id,
      date: sd.toISOString().split('T')[0],
      start_time: sd.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:false }),
      end_time  : ed.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:false }),
      status: res.status
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const { id, spot_id, date, start_time, end_time, status } = editingRes;
    const s  = new Date(`${date}T${start_time}`);
    const en = new Date(`${date}T${end_time}`);
    if (s >= en) { notify('End must be after start.', true); return; }
    try {
      const r = await api.put(`/api/admin/reservations/${id}`, {
        charging_spot_id: spot_id,
        start_time: s.toISOString(), end_time: en.toISOString(), status
      });
      notify(r.data.message);
      setEditingRes(null); fetchData();
    } catch (err) {
      notify(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Overlap or scheduling error.', true);
    }
  };

  const handleCancelRes = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try { const r = await api.put(`/api/reservations/${id}/cancel`); notify(r.data.message); fetchData(); }
    catch (err) { notify(err.response?.data?.error || 'Failed.', true); }
  };

  const handleDeleteRes = async (id) => {
    if (!window.confirm('Permanently delete this reservation?')) return;
    try { const r = await api.delete(`/api/admin/reservations/${id}`); notify(r.data.message); fetchData(); }
    catch (err) { notify(err.response?.data?.error || 'Failed.', true); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.authorization_number.includes(userSearch)
  );

  const fmt = iso => new Date(iso).toLocaleString([], { dateStyle:'medium', timeStyle:'short' });

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
      </div>
      <p className="text-slate-500 font-medium animate-pulse">Loading Admin Console…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── NavBar ──────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/emis-logo.png" alt="EMIS" className="h-9 object-contain" />
            <span className="hidden sm:block text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Console</span>
            <span className="badge-purple ml-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />Admin</span>
          </div>
          <Link to="/" className="btn-secondary py-2 px-4 text-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Alerts */}
        {error && (
          <div className="alert-error animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
            <button className="ml-auto" onClick={() => setError('')}>✕</button>
          </div>
        )}
        {success && (
          <div className="alert-success animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
            <button className="ml-auto" onClick={() => setSuccess('')}>✕</button>
          </div>
        )}

        {/* ─── Tabs ──────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {key === 'users' && <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab===key?'bg-white/25 text-white':'bg-slate-100 text-slate-500'}`}>{users.length}</span>}
              {key === 'reservations' && <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab===key?'bg-white/25 text-white':'bg-slate-100 text-slate-500'}`}>{reservations.length}</span>}
            </button>
          ))}
        </div>

        {/* ──────────────────────────────────────────────────────
            TAB 1: USERS
        ─────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" /> Registered Accounts
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="input py-2 text-sm w-56"
                />
                <button onClick={() => setShowCreate(!showCreate)} className="btn-primary py-2 px-4 text-sm gap-1.5">
                  <Plus className="w-4 h-4" />
                  New User
                </button>
              </div>
            </div>

            {/* Create User Form */}
            {showCreate && (
              <div className="card p-6 border-cyan-300 bg-cyan-50/30 animate-fadeInUp">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-700">Create New Account</h3>
                  <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="e.g. John Doe" value={createForm.name}
                      onChange={e => setCreateForm(p=>({...p, name:e.target.value}))} required />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input className="input" type="email" placeholder="john@example.com" value={createForm.email}
                      onChange={e => setCreateForm(p=>({...p, email:e.target.value}))} required />
                  </div>
                  <div>
                    <label className="label flex items-center justify-between">
                      Authorization Number (8 digits)
                      <button type="button" onClick={genCode} className="text-cyan-500 hover:text-cyan-600 flex items-center gap-1 text-xs font-normal normal-case">
                        <Shuffle className="w-3 h-3" /> Generate
                      </button>
                    </label>
                    <input
                      className="input font-mono tracking-widest text-lg"
                      placeholder="12345678"
                      value={createForm.authorization_number}
                      maxLength={8}
                      onChange={e => {
                        if (/^\d*$/.test(e.target.value) && e.target.value.length <= 8)
                          setCreateForm(p=>({...p, authorization_number:e.target.value}));
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select className="input" value={createForm.role}
                      onChange={e => setCreateForm(p=>({...p, role:e.target.value}))}>
                      <option value="user">Standard User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary py-2 px-5">Cancel</button>
                    <button type="submit" className="btn-primary py-2 px-6 gap-2" disabled={createForm.authorization_number.length !== 8}>
                      <Plus className="w-4 h-4" /> Create Account
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 font-semibold text-slate-500">User</th>
                      <th className="p-4 font-semibold text-slate-500">Auth Code</th>
                      <th className="p-4 font-semibold text-slate-500 text-center">Role</th>
                      <th className="p-4 font-semibold text-slate-500 text-center">Status</th>
                      <th className="p-4 font-semibold text-slate-500 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-400">No users found.</td></tr>
                    ) : filtered.map(u => (
                      <tr key={u.id} className="table-row">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm shrink-0">
                              {u.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-cyan-600 tracking-widest">{u.authorization_number}</td>
                        <td className="p-4 text-center">
                          <span className={u.role === 'admin' ? 'badge-purple' : 'badge-slate'}>{u.role}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={u.is_enabled ? 'badge-green' : 'badge-red'}>
                            {u.is_enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleUser(u)}
                            disabled={u.id === user.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              u.is_enabled
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                          >
                            {u.is_enabled ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────
            TAB 2: RESERVATIONS
        ─────────────────────────────────────────────────────── */}
        {activeTab === 'reservations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeInUp">

            {/* Left: Forms */}
            <div className="space-y-5">
              {editingRes ? (
                /* Edit Form */
                <div className="card p-6 border-cyan-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-cyan-500" /> Edit Reservation
                    </h3>
                    <button onClick={() => setEditingRes(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                  </div>
                  <p className="text-xs text-slate-500">Customer: <strong className="text-slate-700">{editingRes.user_name}</strong></p>
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                      <label className="label">Spot</label>
                      <select className="input" value={editingRes.spot_id}
                        onChange={e => setEditingRes(p=>({...p, spot_id:e.target.value}))}>
                        {spots.map(s => <option key={s.id} value={s.id}>Spot {s.spot_number}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input type="date" className="input" value={editingRes.date}
                        onChange={e => setEditingRes(p=>({...p, date:e.target.value}))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Start</label>
                        <input type="time" className="input" value={editingRes.start_time}
                          onChange={e => setEditingRes(p=>({...p, start_time:e.target.value}))} required />
                      </div>
                      <div>
                        <label className="label">End</label>
                        <input type="time" className="input" value={editingRes.end_time}
                          onChange={e => setEditingRes(p=>({...p, end_time:e.target.value}))} required />
                      </div>
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="input" value={editingRes.status}
                        onChange={e => setEditingRes(p=>({...p, status:e.target.value}))}>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary w-full py-2.5 gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </form>
                </div>
              ) : (
                /* Proxy Booking */
                <div className="card p-6 space-y-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-500" /> Proxy Booking
                  </h3>
                  <p className="text-xs text-slate-400">Book a spot on behalf of any user.</p>
                  <form onSubmit={handleProxyBook} className="space-y-4">
                    <div>
                      <label className="label">Customer</label>
                      <select className="input" value={adminBooking.user_id}
                        onChange={e => setAdminBooking(p=>({...p, user_id:e.target.value}))} required>
                        <option value="" disabled>Select user</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.authorization_number})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Spot</label>
                      <select className="input" value={adminBooking.spot_id}
                        onChange={e => setAdminBooking(p=>({...p, spot_id:e.target.value}))} required>
                        <option value="" disabled>Select spot</option>
                        {spots.map(s => <option key={s.id} value={s.id}>Spot {s.spot_number}{s.status==='maintenance'?' (Maintenance)':''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input type="date" className="input" value={adminBooking.date}
                        onChange={e => setAdminBooking(p=>({...p, date:e.target.value}))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">Start</label>
                        <input type="time" className="input" value={adminBooking.start_time}
                          onChange={e => setAdminBooking(p=>({...p, start_time:e.target.value}))} required /></div>
                      <div><label className="label">End</label>
                        <input type="time" className="input" value={adminBooking.end_time}
                          onChange={e => setAdminBooking(p=>({...p, end_time:e.target.value}))} required /></div>
                    </div>
                    <button type="submit" className="btn-primary w-full py-2.5 gap-2">
                      <Plus className="w-4 h-4" /> Schedule
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right: Reservations Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-500" /> All Reservations
                </h2>
                <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-semibold text-slate-500">Customer</th>
                        <th className="p-4 font-semibold text-slate-500">Spot</th>
                        <th className="p-4 font-semibold text-slate-500">Time Window</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Status</th>
                        <th className="p-4 font-semibold text-slate-500 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservations.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-400">No reservations yet.</td></tr>
                      ) : reservations.map(res => (
                        <tr key={res.id} className="table-row">
                          <td className="p-4">
                            <p className="font-semibold text-slate-700">{res.users?.name || '—'}</p>
                            <p className="text-xs text-slate-400 font-mono">{res.users?.authorization_number}</p>
                          </td>
                          <td className="p-4">
                            <span className="badge-cyan">Spot {res.charging_spots?.spot_number || '?'}</span>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-700 font-medium text-xs">{fmt(res.start_time)}</p>
                            <p className="text-slate-400 text-xs">→ {fmt(res.end_time)}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className={res.status === 'cancelled' ? 'badge-red' : 'badge-cyan'}>
                              {res.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => startEdit(res)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              {res.status !== 'cancelled' && (
                                <button onClick={() => handleCancelRes(res.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition" title="Cancel">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteRes(res.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────
            TAB 3: SPOTS
        ─────────────────────────────────────────────────────── */}
        {activeTab === 'spots' && (
          <div className="space-y-5 animate-fadeInUp">
            <div>
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-500" /> Charging Spot Configuration
              </h2>
              <p className="text-sm text-slate-400 mt-1">Toggle spots between available and maintenance mode.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {spots.map(spot => {
                const maintenance = spot.status === 'maintenance';
                return (
                  <div key={spot.id} className={`card p-6 flex flex-col items-center gap-5 text-center border-2 ${maintenance ? 'border-amber-200 bg-amber-50/30' : 'border-green-200 bg-green-50/20'}`}>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-700">Spot #{spot.spot_number}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono truncate w-40" title={spot.id}>{spot.id.slice(0,14)}…</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${maintenance ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">{spot.status}</span>
                    </div>
                    <button
                      onClick={() => handleToggleSpot(spot.id, spot.status)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition ${
                        maintenance
                          ? 'border-green-300 text-green-700 hover:bg-green-50'
                          : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      {maintenance ? '✓ Restore to Service' : '⚠ Set to Maintenance'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white mt-12 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} EMIS — Admin Console
      </footer>
    </div>
  );
};

export default AdminPanel;
