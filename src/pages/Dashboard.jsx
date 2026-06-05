import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Zap, LogOut, Calendar, Clock, MapPin,
  CheckCircle2, XCircle, AlertTriangle, BatteryCharging,
  ShieldAlert, Plus, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [spots, setSpots]               = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [showBooking, setShowBooking]   = useState(false);

  const [bookingForm, setBookingForm] = useState({
    spot_id   : '',
    date      : new Date().toISOString().split('T')[0],
    start_time: '',
    end_time  : ''
  });

  /* ─── Fetch ──────────────────────────────────────────────── */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [spotsRes, resRes] = await Promise.all([
        api.get('/api/reservations/spots'),
        api.get('/api/reservations')
      ]);
      setSpots(spotsRes.data);
      setReservations(resRes.data);
      const first = spotsRes.data.find(s => s.status === 'available');
      if (first) setBookingForm(p => ({ ...p, spot_id: first.id }));
    } catch { setError('Could not retrieve station data.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ─── Spot occupancy ─────────────────────────────────────── */
  const getSpotStatus = (spotId) => {
    const { date, start_time, end_time } = bookingForm;
    if (!date || !start_time || !end_time) {
      const now = new Date();
      const hit = reservations.find(r =>
        r.charging_spot_id === spotId && r.status === 'confirmed' &&
        new Date(r.start_time) <= now && now <= new Date(r.end_time)
      );
      return hit ? { occupied: true, isLive: true, user: hit.users?.name || 'Customer' } : { occupied: false };
    }
    const s = new Date(`${date}T${start_time}`);
    const e = new Date(`${date}T${end_time}`);
    const hit = reservations.find(r =>
      r.charging_spot_id === spotId && r.status === 'confirmed' &&
      new Date(r.start_time) < e && new Date(r.end_time) > s
    );
    return hit ? { occupied: true, isLive: false, user: hit.users?.name || 'Customer' } : { occupied: false };
  };

  /* ─── Booking ────────────────────────────────────────────── */
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const { spot_id, date, start_time, end_time } = bookingForm;
    if (!spot_id || !start_time || !end_time) { setError('All booking fields are required.'); return; }
    const s = new Date(`${date}T${start_time}`);
    const en = new Date(`${date}T${end_time}`);
    if (s < new Date()) { setError('Start time must be in the future.'); return; }
    if (s >= en) { setError('End time must be after start time.'); return; }
    if ((en - s) / 60000 < 15) { setError('Minimum booking duration is 15 minutes.'); return; }

    setActionLoading(true); setError(''); setSuccess('');
    try {
      const r = await api.post('/api/reservations', {
        charging_spot_id: spot_id,
        start_time: s.toISOString(),
        end_time  : en.toISOString()
      });
      setSuccess(r.data.message);
      setShowBooking(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Booking failed.');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async (resId) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const r = await api.put(`/api/reservations/${resId}/cancel`);
      setSuccess(r.data.message); fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Cancel failed.');
    } finally { setActionLoading(false); }
  };

  /* ─── Computed ───────────────────────────────────────────── */
  const now               = new Date();
  const available         = spots.filter(s => s.status === 'available' && !getSpotStatus(s.id).occupied).length;
  const upcoming          = reservations.filter(r => r.status === 'confirmed' && new Date(r.start_time) > now)
                                        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const history           = reservations.filter(r => r.status === 'cancelled' || new Date(r.end_time) <= now)
                                        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const fmt = iso => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-cyan-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
      </div>
      <p className="text-slate-500 font-medium animate-pulse">Loading EMIS Dashboard…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── Top NavBar ─────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/emis-logo.png" alt="EMIS" className="h-9 object-contain" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">EMIS</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <Link to="/admin" className="btn-secondary py-2 px-4 text-sm gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 font-bold text-sm">
                {user.name[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-700 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Body ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Alerts */}
        {error && (
          <div className="alert-error animate-fadeIn">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
            <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError('')}>✕</button>
          </div>
        )}
        {success && (
          <div className="alert-success animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
            <button className="ml-auto text-green-400 hover:text-green-600" onClick={() => setSuccess('')}>✕</button>
          </div>
        )}

        {/* ─── Stats Row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp">
          <div className="stat-card">
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wide mb-1">Available Now</p>
            <p className="text-4xl font-extrabold text-slate-800">{available}</p>
            <p className="text-xs text-slate-400 mt-1">of {spots.length} total spots</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wide mb-1">Upcoming</p>
            <p className="text-4xl font-extrabold text-slate-800">{upcoming.length}</p>
            <p className="text-xs text-slate-400 mt-1">confirmed reservations</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wide mb-1">My Total</p>
            <p className="text-4xl font-extrabold text-slate-800">{reservations.length}</p>
            <p className="text-xs text-slate-400 mt-1">all-time bookings</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wide mb-1">Your RFID</p>
            <p className="text-2xl font-extrabold text-slate-800 font-mono tracking-widest">{user.rfid}</p>
            <p className="text-xs text-slate-400 mt-1">RFID Code</p>
          </div>
        </div>

        {/* ─── Spots + Booking ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Spot Cards (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-500" />
                Charging Spot Status
                {(bookingForm.start_time && bookingForm.end_time) && (
                  <span className="badge-cyan text-[10px] ml-1">Showing selected interval</span>
                )}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {spots.map((spot, idx) => {
                const st = getSpotStatus(spot.id);
                let cls = 'spot-available'; let badge = 'badge-green'; let badgeLabel = 'Available';
                let label = 'Ready to book'; let Icon = Zap; let iconCls = 'text-green-500';

                if (spot.status === 'maintenance') {
                  cls = 'spot-maintenance'; badge = 'badge-amber'; badgeLabel = 'Maintenance';
                  label = 'Under repairs'; Icon = AlertTriangle; iconCls = 'text-amber-500';
                } else if (st.occupied && st.isLive) {
                  cls = 'spot-charging'; badge = 'badge-cyan'; badgeLabel = 'Charging';
                  label = `In use — ${st.user}`; Icon = BatteryCharging; iconCls = 'text-cyan-500';
                } else if (st.occupied && !st.isLive) {
                  cls = 'spot-booked'; badge = 'badge-red'; badgeLabel = 'Booked';
                  label = `Taken — ${st.user}`; Icon = XCircle; iconCls = 'text-red-500';
                }

                return (
                  <div
                    key={spot.id}
                    className={`card border-2 ${cls} p-6 flex flex-col items-center text-center gap-3 animate-fadeInUp`}
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className="text-xs font-bold text-slate-400 self-end">#{spot.spot_number}</div>
                    <div className={`p-4 rounded-2xl bg-white/70 shadow-sm ${st.occupied && st.isLive ? 'animate-pulse' : ''}`}>
                      <Icon className={`w-9 h-9 ${iconCls} ${st.occupied && st.isLive ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">Spot {spot.spot_number}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[130px]" title={label}>{label}</p>
                    </div>
                    <span className={badge}>{badgeLabel}</span>
                  </div>
                );
              })}
            </div>

            <div className="alert-info">
              <BatteryCharging className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Select a date and time in the booking panel to see real-time availability for your chosen slot.</p>
            </div>
          </div>

          {/* Booking Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-500" />
                New Reservation
              </h2>
              <button
                onClick={() => setShowBooking(!showBooking)}
                className="btn-secondary py-1.5 px-3 text-sm gap-1"
              >
                <Plus className="w-4 h-4" />
                {showBooking ? 'Collapse' : 'Book'}
              </button>
            </div>

            <div className={`card p-6 space-y-4 transition-all duration-300 ${showBooking ? 'opacity-100' : 'opacity-70'}`}>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="label">Charging Spot</label>
                  <select
                    name="spot_id"
                    value={bookingForm.spot_id}
                    onChange={e => setBookingForm(p => ({ ...p, spot_id: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="" disabled>Choose a spot</option>
                    {spots.map(s => (
                      <option key={s.id} value={s.id} disabled={s.status === 'maintenance'}>
                        Spot {s.spot_number}{s.status === 'maintenance' ? ' (Maintenance)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={bookingForm.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start</label>
                    <input type="time" className="input" value={bookingForm.start_time}
                      onChange={e => setBookingForm(p => ({ ...p, start_time: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">End</label>
                    <input type="time" className="input" value={bookingForm.end_time}
                      onChange={e => setBookingForm(p => ({ ...p, end_time: e.target.value }))} required />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Booking…</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Confirm Reservation</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ─── Reservations ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Upcoming */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-500" /> Upcoming Bookings</span>
              <span className="badge-cyan">{upcoming.length}</span>
            </h3>
            <div className="divider" />
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No upcoming reservations</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {upcoming.map(res => (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 transition animate-fadeInUp">
                    <div className="space-y-1">
                      <span className="badge-cyan text-[11px]">Spot {res.charging_spots?.spot_number}</span>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{fmt(res.start_time).split(',')[0]}</p>
                      <p className="text-xs text-slate-400">{fmtTime(res.start_time)} – {fmtTime(res.end_time)}</p>
                    </div>
                    <button onClick={() => handleCancel(res.id)} disabled={actionLoading} className="btn-danger">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Reservation History</span>
              <span className="badge-slate">{history.length}</span>
            </h3>
            <div className="divider" />
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No history yet</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {history.map(res => {
                  const cancelled = res.status === 'cancelled';
                  return (
                    <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50/70 rounded-xl border border-slate-100 opacity-80">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">Spot {res.charging_spots?.spot_number || '—'}</p>
                        <p className="text-sm text-slate-600">{fmt(res.start_time)}</p>
                      </div>
                      {cancelled
                        ? <span className="badge-red">Cancelled</span>
                        : <span className="badge-slate">Completed</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} EMIS — Electric Management Infrastructure System
      </footer>
    </div>
  );
};

export default Dashboard;
