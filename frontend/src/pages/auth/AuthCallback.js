import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const roleRoutes = {
  admin: '/admin/dashboard',
  agency_admin: '/agency/dashboard',
  driver: '/driver/dashboard',
  traveler: '/search',
};

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
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

        const res = await api.get('/auth/me');
        const userData = res.data;
        const role = userData?.role;
        if (!role || (role === 'traveler' && !userData?.phone)) {
          navigate('/auth/complete-profile', { replace: true });
        } else {
          navigate(roleRoutes[role] || '/search', { replace: true });
        }
      } catch (err) {
        navigate('/auth/complete-profile', { replace: true });
      }
    }

    handleCallback();

    return () => { cancelledRef.current = true; };
  }, [navigate]);

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
