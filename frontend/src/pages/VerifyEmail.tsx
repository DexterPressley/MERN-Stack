import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { buildPath } from '../Path';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided.');
        return;
      }

      try {
        const response = await fetch(buildPath('api/verify-email'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('✅ Email verified successfully!');
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div id="verifyEmailDiv" style={styles.container}>
      <div style={styles.card}>
        <div style={styles.content}>
          {status === 'loading' && (
            <>
              <div style={styles.spinner}></div>
              <p style={styles.message}>{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={styles.successIcon}>✓</div>
              <p style={styles.message}>{message}</p>
              <p style={styles.subtext}>Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={styles.errorIcon}>✕</div>
              <p style={styles.message}>{message}</p>
              <button 
                onClick={() => navigate('/')}
                style={styles.button}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center' as const
  } as React.CSSProperties,
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  } as React.CSSProperties,
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  } as React.CSSProperties,
  successIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    color: 'white',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  } as React.CSSProperties,
  errorIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#f44336',
    color: 'white',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  } as React.CSSProperties,
  message: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#333',
    margin: '0'
  } as React.CSSProperties,
  subtext: {
    fontSize: '14px',
    color: '#666',
    margin: '0'
  } as React.CSSProperties,
  button: {
    backgroundColor: '#000',
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  } as React.CSSProperties
};

export default VerifyEmail;