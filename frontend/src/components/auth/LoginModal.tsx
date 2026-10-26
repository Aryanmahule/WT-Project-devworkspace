import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Shield, User } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser || !password) {
      setError('Please enter both email/username and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(emailOrUser, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (email: string) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(email);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#F5F6F8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E1E4EA',
          borderRadius: '10px',
          padding: '32px',
        }}
      >
        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#2B4ACB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontWeight: 600,
              fontSize: '18px',
            }}
          >
            A
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#16181D',
              margin: 0,
            }}
          >
            Apex Workspace
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: '#5B6270',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            Sign in to access your enterprise dashboard
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FEF3F2',
              border: '1px solid #FECDCA',
              color: '#B42318',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#16181D',
                marginBottom: '6px',
              }}
            >
              Email or Username
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#5B6270',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="login-email"
                type="text"
                required
                style={{
                  height: '40px',
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E1E4EA',
                  borderRadius: '8px',
                  padding: '0 12px 0 36px',
                  fontSize: '14px',
                  color: '#16181D',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="admin@apexcorp.internal"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#16181D',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#5B6270',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="login-password"
                type="password"
                required
                style={{
                  height: '40px',
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E1E4EA',
                  borderRadius: '8px',
                  padding: '0 12px 0 36px',
                  fontSize: '14px',
                  color: '#16181D',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '40px',
              width: '100%',
              backgroundColor: '#2B4ACB',
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '14px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#223ba4';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#2B4ACB';
            }}
          >
            {loading ? 'Authenticating...' : 'Sign in'}
          </button>
        </form>

        <div style={{ margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E1E4EA' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#5B6270',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Quick sign in
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E1E4EA' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleQuick('admin@apexcorp.internal')}
            style={{
              height: '38px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E1E4EA',
              borderRadius: '8px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#16181D',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F6F8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <Shield size={14} color="#2B4ACB" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Platform Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuick('alex.chen@apexcorp.internal')}
            style={{
              height: '38px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E1E4EA',
              borderRadius: '8px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#16181D',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F6F8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <User size={14} color="#5B6270" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>VP Engineering</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuick('sarah.jenkins@apexcorp.internal')}
            style={{
              height: '38px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E1E4EA',
              borderRadius: '8px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#16181D',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F6F8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <User size={14} color="#5B6270" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Product Director</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuick('elena.rostova@apexcorp.internal')}
            style={{
              height: '38px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E1E4EA',
              borderRadius: '8px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#16181D',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F6F8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <User size={14} color="#5B6270" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Senior Dev</span>
          </button>
        </div>
      </div>
    </div>
  );
};
