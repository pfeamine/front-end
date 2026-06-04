import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Zap } from 'lucide-react';

const Login = () => {
  const [authNumber, setAuthNumber] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showCode, setShowCode]     = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleInput = (e) => {
    const v = e.target.value;
    if (/^\d*$/.test(v) && v.length <= 8) { setAuthNumber(v); setError(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authNumber.length !== 8) { setError('Authorization number must be exactly 8 digits.'); return; }
    setLoading(true); setError('');
    const res = await login(authNumber);
    setLoading(false);
    if (res.success) navigate('/');
    else setError(res.error);
  };

  const filled = authNumber.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 flex items-center justify-center px-4 py-12">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="w-full max-w-md relative">

        {/* Logo + Brand */}
        <div className="text-center mb-8 animate-fadeInUp">
          <img
            src="/emis-logo.png"
            alt="EMIS Logo"
            className="h-20 mx-auto mb-5 object-contain drop-shadow-md animate-float"
          />
          <h1 className="text-3xl font-extrabold text-slate-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Welcome to <span className="text-cyan-500">EMIS</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Electric Management Infrastructure System
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 animate-fadeInUp" style={{animationDelay:'0.1s'}}>
          <h2 className="text-xl font-bold text-slate-700 mb-6">Sign In to your account</h2>

          {error && (
            <div className="alert-error mb-5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Authorization Number */}
            <div>
              <label className="label">Authorization Number</label>
              <div className="relative">
                <input
                  id="auth-number"
                  type={showCode ? 'text' : 'password'}
                  value={authNumber}
                  onChange={handleInput}
                  placeholder="Enter 8-digit code"
                  className="input pr-12 text-center tracking-[0.3em] text-xl font-bold"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 transition"
                >
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Digit progress dots */}
              <div className="flex gap-1.5 mt-3 justify-center">
                {Array.from({length: 8}).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i < filled ? 'bg-cyan-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center mt-1.5">{filled}/8 digits</p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5 text-base mt-2"
              disabled={loading || filled !== 8}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing In…
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <span className="text-cyan-600 font-semibold">Contact your administrator.</span>
          </p>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          © {new Date().getFullYear()} EMIS — Electric Management Infrastructure System
        </p>
      </div>
    </div>
  );
};

export default Login;
