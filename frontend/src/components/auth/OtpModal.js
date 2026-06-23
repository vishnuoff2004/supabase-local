import React, { useState, useRef, useEffect } from 'react';
import supabase from '../../services/supabase';
import api from '../../services/api';

function OtpModal({ email, onComplete, onError, onCancel }) {
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [sendingStatus, setSendingStatus] = useState('idle');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const sentRef = useRef(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendOtp();
  }, [email]);

  async function sendOtp() {
    setSendingStatus('sending');
    try {
      await supabase.auth.signInWithOtp({ email });
      setSendingStatus('sent');
      setCountdown(60);
    } catch (err) {
      if (err.status === 429) {
        setSendingStatus('rate_limited');
      } else {
        setSendingStatus('failed');
        onError?.(err.message || 'Failed to send OTP');
      }
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setSendingStatus('sending');
    try {
      await supabase.auth.signInWithOtp({ email });
      setSendingStatus('sent');
      setCountdown(60);
    } catch (err) {
      if (err.status === 429) {
        setSendingStatus('rate_limited');
      } else {
        setSendingStatus('failed');
        onError?.(err.message || 'Failed to resend OTP');
      }
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== otp.length) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        onError?.(error.message || 'Invalid OTP');
        return;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        onError?.('OTP verified but no session returned. Please try logging in.');
        return;
      }

      let payload = { email, accessToken };
      const stored = sessionStorage.getItem('pending_reg_data');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          payload = { ...payload, ...parsed };
        } catch (e) {
          console.error('Failed to parse pending_reg_data:', e);
        }
      }

      await api.post('/auth/complete-registration', payload);

      sessionStorage.removeItem('pending_reg_data');
      onComplete?.();
    } catch (err) {
      onError?.(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, otp.length);
    const newOtp = [...otp];
    text.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const nextIndex = Math.min(text.length, otp.length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20, opacity: 1, visibility: 'visible',
    }}>
      <div className="auth-card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">TP</span>
        </div>
        <h2 style={{ margin: '16px 0 8px' }}>Verify OTP</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
          {sendingStatus === 'sending' && 'Sending OTP to your email...'}
          {sendingStatus === 'sent' && `Enter the ${otp.length}-digit code sent to`}
          {sendingStatus === 'rate_limited' && 'Too many requests. Please wait before requesting a new code.'}
          {sendingStatus === 'failed' && 'Failed to send code. Click "Send OTP" to try again.'}
          {sendingStatus === 'idle' && 'Click "Send OTP" to receive a verification code at'}
          <br />
          <strong>{email}</strong>
        </p>
        {sendingStatus === 'rate_limited' && (
          <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: 12 }}>
            You can still enter a code from a previous email if you received one.
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              style={{
                width: 48, height: 56, textAlign: 'center', fontSize: '1.5rem',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none', caretColor: 'var(--color-accent)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== otp.length}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {sendingStatus === 'failed' || sendingStatus === 'idle' || sendingStatus === 'rate_limited' ? (
            <button
              onClick={sendOtp}
              style={{
                background: 'none', border: 'none', color: 'var(--color-accent)',
                cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline',
              }}
            >
              Send OTP
            </button>
          ) : countdown > 0 ? (
            <span>Resend code in <strong>{formatTime(countdown)}</strong></span>
          ) : (
            <button
              onClick={handleResend}
              style={{
                background: 'none', border: 'none', color: 'var(--color-accent)',
                cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline',
              }}
            >
              Resend OTP
            </button>
          )}
        </div>
        {onCancel && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={onCancel}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text-muted)',
                cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline',
              }}
            >
              Cancel & Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OtpModal;
