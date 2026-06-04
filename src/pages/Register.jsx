import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Shuffle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    authorization_number: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Strict digit filtering for authorization code
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'authorization_number') {
      if (/^\d*$/.test(value) && value.length <= 8) {
        setFormData({ ...formData, [name]: value });
        setError('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
      setError('');
    }
  };

  // Helper to generate a random 8-digit numeric code
  const generateRandomCode = () => {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    setFormData({ ...formData, authorization_number: code });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { authorization_number, name, email, role } = formData;

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (authorization_number.length !== 8) {
      setError('Authorization number must be exactly 8 digits.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await register(authorization_number, name, email, role);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 text-cyan-400 bg-cyan-950/40 rounded-3xl border border-cyan-800/30 shadow-cyan-glow animate-float">
            <Zap className="w-8 h-8 fill-cyan-400" />
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white font-display">
            Volt<span className="text-cyan-400">Station</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Create your account and secure your charging spot
          </p>
        </div>

        {/* Register Card */}
        <div className="p-8 rounded-3xl glass-panel shadow-2xl relative overflow-hidden">
          {/* Gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10" />

          <h3 className="text-xl font-bold text-white mb-6 text-center">Register Portal</h3>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-200 bg-red-950/40 border border-red-800/50 rounded-2xl animate-pulse">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-4 text-sm text-cyan-200 bg-cyan-950/40 border border-cyan-850/50 rounded-2xl">
              {successMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-slate-600"
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. john@example.com"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-slate-600"
              />
            </div>

            {/* Authorization Code (8 digits) */}
            <div>
              <label htmlFor="authorization_number" className="block text-sm font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Authorization Number (8 digits)</span>
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  title="Generate a random 8-digit code"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Generate
                </button>
              </label>
              <div className="relative">
                <input
                  id="authorization_number"
                  name="authorization_number"
                  type="text"
                  required
                  value={formData.authorization_number}
                  onChange={handleInputChange}
                  placeholder="8-digit numeric code"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-slate-600 tracking-wider font-semibold"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 text-right">
                {formData.authorization_number.length}/8 digits
              </p>
            </div>

            {/* Role Select (for easy dev testing) */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1">
                Portal Role (For Testing)
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white cursor-pointer"
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || formData.authorization_number.length !== 8}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-base font-semibold text-black bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-cyan-glow hover:shadow-cyan-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registering...
                  </span>
                ) : 'Register Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-400">Already registered? </span>
            <Link to="/login" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
