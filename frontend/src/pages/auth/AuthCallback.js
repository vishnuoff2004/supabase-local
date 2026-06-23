import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OtpModal from '../../components/auth/OtpModal';
import { useAuth } from '../../contexts/AuthContext';

const roleRoutes = {
  admin: '/admin/dashboard',
  agency_admin: '/agency/dashboard',
  driver: '/driver/dashboard',
  traveler: '/search',
};

function AuthCallback() {
  const navigate = useNavigate();
  const { fetchUser, logout } = useAuth();
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const handledRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDesc = params.get('error_description');

    if (errorParam) {
      setErrorType('oauth_error');
      setError(errorDesc || `OAuth error: ${errorParam}. Please try again.`);
      return;
    }

    cancelledRef.current = false;

    async function waitForSession() {
      for (let i = 0; i < 60; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return session;
        await new Promise(r => setTimeout(r, 250));
      }
      return null;
    }

    async function handleCallback() {
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        const session = await waitForSession();
        if (cancelledRef.current) return;

        if (!session) {
          setErrorType('no_session');
          setError('No session found. Please try logging in again.');
          return;
        }

        localStorage.setItem('supabase_token', session.access_token);

        let oauthSetupData = {};
        const stored = sessionStorage.getItem('google_reg_data');
        if (stored) {
          try {
            oauthSetupData = JSON.parse(stored);
          } catch (e) {
            console.error('Failed to parse google_reg_data:', e);
          }
        }

        try {
          await api.post('/auth/oauth-setup', oauthSetupData);
        } catch (_) {
          /* user may already exist — ignore */
        }

        sessionStorage.removeItem('google_reg_data');

        const dbUser = await fetchUser();
        if (!dbUser) {
          throw new Error('User profile could not be loaded.');
        }

        if (!dbUser.isVerified) {
          setPendingEmail(dbUser.email);
          setShowOtp(true);
        } else {
          if (!dbUser.phone) {
            navigate('/auth/complete-profile', { replace: true });
          } else {
            navigate(roleRoutes[dbUser.role] || '/search', { replace: true });
          }
        }
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        setError(err.response?.data?.message || err.message || 'Authentication failed. Please try again.');
      }
    }

    handleCallback();

    return () => { cancelledRef.current = true; };
  }, [navigate, fetchUser]);

  const handleOtpComplete = async () => {
    setShowOtp(false);
    try {
      const dbUser = await fetchUser();
      if (!dbUser.phone) {
        navigate('/auth/complete-profile', { replace: true });
      } else {
        navigate(roleRoutes[dbUser.role] || '/search', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Verification succeeded, but profile fetch failed.');
    }
  };

  const handleOtpError = (msg) => {
    setError(msg);
  };

  const handleOtpCancel = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Logout failed.');
    }
  };

  if (showOtp) {
    return (
      <OtpModal
        email={pendingEmail}
        onComplete={handleOtpComplete}
        onError={handleOtpError}
        onCancel={handleOtpCancel}
      />
    );
  }

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Authentication Error</h2>
          <p>{error}</p>
          {errorType === 'oauth_error' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
              Make sure Google OAuth is configured in Supabase Dashboard and Google Cloud Console.
            </p>
          )}
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: 16 }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <LoadingSpinner text="Completing sign in..." />;
}

export default AuthCallback;
