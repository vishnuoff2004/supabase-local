import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';

const roleRoutes = {
  admin: '/admin/dashboard',
  agency_admin: '/agency/dashboard',
  driver: '/driver/dashboard',
  traveler: '/search',
};

function CompleteProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setupRole, completeOAuthSetup, user } = useAuth();

  const [form, setForm] = useState(() => {
    const stored = sessionStorage.getItem('google_reg_data');
    if (stored) {
      const data = JSON.parse(stored);
      return {
        name: data.name || user?.name || '',
        phone: data.phone || user?.phone || '',
        role: data.role || user?.role || 'traveler',
        vehicleType: data.vehicleType || '',
        vehicleReg: data.vehicleReg || '',
        licenseNo: data.licenseNo || '',
        agencyId: data.agencyId || '',
      };
    }
    return {
      name: user?.name || '',
      phone: user?.phone || '',
      role: user?.role || 'traveler',
      vehicleType: '',
      vehicleReg: '',
      licenseNo: '',
    };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (user) {
        await setupRole(form);
      } else {
        await completeOAuthSetup(form);
      }
      sessionStorage.removeItem('google_reg_data');
      const route = roleRoutes[form.role] || '/search';
      navigate(route, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Profile setup failed');
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
        <h1 className="auth-title">{t('auth.completeProfile', 'Complete Your Profile')}</h1>
        <p className="auth-subtitle">{t('auth.tellUsAboutYourself', 'Tell us a bit about yourself')}</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="cp-name">{t('auth.fullName', 'Full Name')}</label>
            <input id="cp-name" className="form-input" name="name"
              value={form.name} onChange={handleChange} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cp-phone">{t('auth.phone', 'Phone')}</label>
            <input id="cp-phone" className="form-input" name="phone" type="tel"
              value={form.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cp-role">{t('auth.accountType', 'Account Type')}</label>
            <select id="cp-role" className="form-select" name="role"
              value={form.role} onChange={handleChange} required>
              <option value="traveler">{t('auth.traveler', 'Traveler')}</option>
              <option value="driver">{t('auth.driver', 'Driver')}</option>
              <option value="agency_admin">{t('auth.agencyAdmin', 'Agency Admin')}</option>
            </select>
          </div>

          {form.role === 'driver' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="cp-vehicleType">{t('auth.vehicleType', 'Vehicle Type')}</label>
                <select id="cp-vehicleType" className="form-select" name="vehicleType"
                  value={form.vehicleType} onChange={handleChange} required>
                  <option value="">{t('auth.selectVehicleType', 'Select Vehicle Type')}</option>
                  <option value="Sedan">{t('auth.sedan', 'Sedan')}</option>
                  <option value="SUV">{t('auth.suv', 'SUV')}</option>
                  <option value="Hatchback">{t('auth.hatchback', 'Hatchback')}</option>
                  <option value="Van">{t('auth.van', 'Van')}</option>
                  <option value="Bus">{t('auth.bus', 'Bus')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cp-vehicleReg">{t('auth.vehicleRegistration', 'Vehicle Registration')}</label>
                <input id="cp-vehicleReg" className="form-input" name="vehicleReg"
                  value={form.vehicleReg} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cp-licenseNo">{t('auth.licenseNumber', 'License Number')}</label>
                <input id="cp-licenseNo" className="form-input" name="licenseNo"
                  value={form.licenseNo} onChange={handleChange} required />
              </div>
            </>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('auth.completeSetup', 'Complete Setup')}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfilePage;
