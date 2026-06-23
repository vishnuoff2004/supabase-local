import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Button from '../../components/common/Button';
import OtpModal from '../../components/auth/OtpModal';

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'traveler', vehicleType: '', vehicleReg: '', licenseNo: '', agencyId: '',
  });
  const [agencies, setAgencies] = useState([]);
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [vehicleRc, setVehicleRc] = useState(null);
  const [fileErrors, setFileErrors] = useState({ licenseDoc: '', vehicleRc: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    api.get('/routes/agencies')
      .then(r => setAgencies(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSizeBytes = 4 * 1024 * 1024;
    let err = '';
    if (!allowedTypes.includes(file.type)) {
      err = t('auth.invalidFileType', 'Only JPG, JPEG, PNG, and PDF files are allowed.');
    } else if (file.size > maxSizeBytes) {
      err = t('auth.fileTooLarge', 'File size must be under 4 MB.');
    }
    setFileErrors(prev => ({ ...prev, [name]: err }));
    if (!err) {
      if (name === 'licenseDoc') setLicenseDoc(file);
      if (name === 'vehicleRc') setVehicleRc(file);
    } else {
      if (name === 'licenseDoc') setLicenseDoc(null);
      if (name === 'vehicleRc') setVehicleRc(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.role === 'driver' && (!licenseDoc || !vehicleRc)) {
      setError(t('auth.docsRequired', 'Both Driving License and Vehicle RC documents are required.'));
      return;
    }
    setLoading(true);
    try {
      let regData = { ...form };
      if (form.role === 'driver') {
        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));
        formData.append('licenseDoc', licenseDoc);
        formData.append('vehicleRc', vehicleRc);
        const res = await api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        regData.licenseDocUrl = res.data.licenseDocUrl;
        regData.vehicleRcUrl = res.data.vehicleRcUrl;
      } else {
        await api.post('/auth/register', form);
      }
      sessionStorage.setItem('pending_reg_data', JSON.stringify(regData));
      setPendingEmail(form.email);
      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registrationFailed', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = () => {
    setShowOtp(false);
    navigate('/login');
  };

  const handleOtpError = (msg) => {
    setError(msg);
  };

  return (
    <>
    <div className="auth-page">
      <div className="auth-card animate-scale-in-on-load">
        <div className="auth-logo">
          <span className="auth-logo-icon">TP</span>
        </div>
        <h1 className="auth-title">{t('auth.createAccount', 'Create Account')}</h1>
        <p className="auth-subtitle">{t('auth.joinTravelPro', 'Join TravelPro today')}</p>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {success && <div className="auth-success" role="status">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">{t('auth.fullName', 'Full Name')}</label>
            <input id="reg-name" className="form-input" name="name"
              placeholder={t('auth.fullNamePlaceholder', 'John Doe')}
              value={form.name} onChange={handleChange} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">{t('auth.email', 'Email')}</label>
            <input id="reg-email" className="form-input" name="email" type="email"
              placeholder={t('auth.emailPlaceholder', 'you@example.com')}
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">{t('auth.password', 'Password')}</label>
            <input id="reg-password" className="form-input" name="password" type="password"
              placeholder={t('auth.passwordPlaceholder', 'Create a strong password')}
              value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">{t('auth.phone', 'Phone')}</label>
            <input id="reg-phone" className="form-input" name="phone" type="tel"
              placeholder={t('auth.phonePlaceholder', '+1 (555) 000-0000')}
              value={form.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">{t('auth.accountType', 'Account Type')}</label>
            <select id="reg-role" className="form-select" name="role"
              value={form.role} onChange={handleChange} required>
              <option value="traveler">{t('auth.traveler', 'Traveler')}</option>
              <option value="driver">{t('auth.driver', 'Driver')}</option>
              <option value="agency_admin">{t('auth.agencyAdmin', 'Agency Admin')}</option>
            </select>
          </div>

          {form.role === 'driver' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-vehicleType">{t('auth.vehicleType', 'Vehicle Type')}</label>
                <select id="reg-vehicleType" className="form-select" name="vehicleType"
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
                <label className="form-label" htmlFor="reg-vehicleReg">{t('auth.vehicleRegistration', 'Vehicle Registration')}</label>
                <input id="reg-vehicleReg" className="form-input" name="vehicleReg"
                  placeholder={t('auth.vehicleRegPlaceholder', 'KA-01-AB-1234')}
                  value={form.vehicleReg} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-licenseNo">{t('auth.licenseNumber', 'License Number')}</label>
                <input id="reg-licenseNo" className="form-input" name="licenseNo"
                  placeholder={t('auth.licensePlaceholder', 'DL-123456789')}
                  value={form.licenseNo} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-licenseDoc">
                  {t('auth.licenseDoc', 'Driving License')} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input id="reg-licenseDoc" type="file" name="licenseDoc"
                  accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange}
                  className="form-input" style={{ padding: '8px' }} required />
                {fileErrors.licenseDoc && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fileErrors.licenseDoc}</span>}
                {licenseDoc && <span style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>✓ {licenseDoc.name} ({Math.round(licenseDoc.size / 1024 / 1024 * 100) / 100} MB)</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-vehicleRc">
                  {t('auth.vehicleRc', 'Vehicle RC')} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input id="reg-vehicleRc" type="file" name="vehicleRc"
                  accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange}
                  className="form-input" style={{ padding: '8px' }} required />
                {fileErrors.vehicleRc && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fileErrors.vehicleRc}</span>}
                {vehicleRc && <span style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>✓ {vehicleRc.name} ({Math.round(vehicleRc.size / 1024 / 1024 * 100) / 100} MB)</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-agencyId">
                  {t('auth.agency', 'Agency')} <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>({t('common.optional', 'Optional')})</span>
                </label>
                <select id="reg-agencyId" className="form-select" name="agencyId"
                  value={form.agencyId} onChange={handleChange}>
                  <option value="">{t('auth.selectAgency', 'Select Agency')}</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                  {t('auth.agencyHelper', 'Select an agency to send a join request. You will be linked after approval.')}
                </span>
              </div>
            </>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('auth.createAccountButton', 'Create Account')}
          </Button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.orRegisterWith', 'or register with')}</span>
        </div>

        <Button
          type="button"
          onClick={async () => {
            setGoogleLoading(true);
            sessionStorage.setItem('google_reg_data', JSON.stringify({
              name: form.name,
              email: form.email,
              password: form.password,
              phone: form.phone,
              role: form.role,
              vehicleType: form.vehicleType,
              vehicleReg: form.vehicleReg,
              licenseNo: form.licenseNo,
              agencyId: form.agencyId,
            }));
            try {
              await loginWithGoogle();
            } catch {
              setGoogleLoading(false);
              sessionStorage.removeItem('google_reg_data');
            }
          }}
          loading={googleLoading}
          className="w-full"
          size="lg"
          variant="outline"
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth.registerWithGoogle', 'Register with Google')}
          </span>
        </Button>

        <div className="auth-footer">
          {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
          <Link to="/login">{t('auth.signInLink', 'Sign in')}</Link>
        </div>
      </div>
    </div>

    {showOtp && (
      <OtpModal
        email={pendingEmail}
        onComplete={handleOtpComplete}
        onError={handleOtpError}
      />
    )}
    </>
  );
}

export default RegisterPage;
