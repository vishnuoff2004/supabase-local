import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'traveler', vehicleType: '', vehicleReg: '', licenseNo: '', agencyId: '' });
  const [agencies, setAgencies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/routes/agencies').then(r => setAgencies(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in-on-load">
        <div className="auth-logo">
          <span className="auth-logo-icon">TP</span>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join TravelPro today</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="form-input"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="form-input"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="form-input"
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone</label>
            <input
              id="reg-phone"
              className="form-input"
              name="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">Account Type</label>
            <select
              id="reg-role"
              className="form-select"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="traveler">Traveler</option>
              <option value="driver">Driver</option>
              <option value="agency_admin">Agency Admin</option>
            </select>
          </div>

          {form.role === 'driver' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-vehicleType">Vehicle Type</label>
                <select
                  id="reg-vehicleType"
                  className="form-select"
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Van">Van</option>
                  <option value="Bus">Bus</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-vehicleReg">Vehicle Registration</label>
                <input
                  id="reg-vehicleReg"
                  className="form-input"
                  name="vehicleReg"
                  placeholder="KA-01-AB-1234"
                  value={form.vehicleReg}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-licenseNo">License Number</label>
                <input
                  id="reg-licenseNo"
                  className="form-input"
                  name="licenseNo"
                  placeholder="DL-123456789"
                  value={form.licenseNo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-agencyId">Agency</label>
                <select
                  id="reg-agencyId"
                  className="form-select"
                  name="agencyId"
                  value={form.agencyId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Agency</option>
                  {agencies.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
