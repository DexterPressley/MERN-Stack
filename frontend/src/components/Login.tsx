import React, { useState } from 'react';
import axios from 'axios';
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';

type TokenPayload = {
  userId: number;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
};

function Login() {
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');

  // Individual error states for each field
  const [loginNameError, setLoginNameError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');

  // Resend verification states
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Forgot username/password states
  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);


  function handleSetLoginName(e: React.ChangeEvent<HTMLInputElement>) {
    setLoginName(e.target.value);
    setLoginNameError(''); // Clear error on input
  }

  function handleSetPassword(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    setLoginPasswordError(''); // Clear error on input
  }

  // Clear all errors
  function clearAllErrors() {
    setLoginNameError('');
    setLoginPasswordError('');
    setMessage('');
    setShowResendButton(false);
    setResendEmail('');
    setResendMessage('');
  }

  async function doLogin(
    event: React.MouseEvent<HTMLInputElement, MouseEvent>
  ): Promise<void> {
    event.preventDefault();

    //Clear all previous errors
    clearAllErrors();

    let valid = true;

    // Validate Username (required, cannot be empty/whitespace)
    if (!loginName || loginName.trim() === '') {
      setLoginNameError('Username is required.');
      valid = false;
    }

    // Validate Password (required, cannot be empty/whitespace)
    if (!loginPassword || loginPassword.trim() === '') {
      setLoginPasswordError('Password is required.');
      valid = false;
    }

    // If validation failed, stop here
    if (!valid) {
      return;
    }

    try {
      const { data: res } = await axios.post(
        buildPath('api/login'),
        { username: loginName, password: loginPassword },
        { headers: { 'Content-Type': 'application/json' } }
      );

      // expecting either { accessToken } or { error }
      if (res?.error) {
        setMessage('User/Password combination incorrect');
        return;
      }

      const accessToken: string | undefined = res?.accessToken;
      if (!accessToken) {
        setMessage('Unexpected server response (no access token).');
        return;
      }

      // store token (our helper accepts { accessToken })
      storeToken({ accessToken });

      // decode payload
      const payload = jwtDecode<TokenPayload>(accessToken);
      const userId = payload.userId;
      const firstName = payload.firstName;
      const lastName = payload.lastName;

      if (!userId || userId <= 0) {
        setMessage('User/Password combination incorrect');
        return;
      }

      // save both keys for compatibility (id + userId)
      const user = { firstName, lastName, id: userId, userId };
      localStorage.setItem('user_data', JSON.stringify(user));

      setMessage('');
      window.location.href = '/cards';
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        const errorMessage = err.response.data.error;
        setMessage(errorMessage);
        
        // Check if error is about email verification
        if (errorMessage.toLowerCase().includes('email not yet verified') || 
            errorMessage.toLowerCase().includes('not verified')) {
          // Store the email if provided in error response, otherwise we'll ask user
          if (err.response.data.email) {
            setResendEmail(err.response.data.email);
          }
          
          // Show resend button after 30 seconds
          setTimeout(() => {
            setShowResendButton(true);
          }, 30000);
        }
      } else {
        setMessage('Network or server error logging in.');
      }
    }

  }

  function goToRegister() {
    window.location.href = '/register';
  }

  async function handleResendVerification(): Promise<void> {
    let emailToUse = resendEmail;
    
    // If we don't have the email, prompt the user
    if (!emailToUse) {
      emailToUse = prompt('Please enter your email address:') || '';
      if (!emailToUse) return;
      setResendEmail(emailToUse);
    }

    setIsResending(true);
    setResendMessage('');

    try {
      console.log('Attempting to resend verification email to:', emailToUse);
      const { data: res } = await axios.post(
        buildPath('api/resend-verification'),
        { email: emailToUse },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('Resend response:', res);

      if (res?.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
        setShowResendButton(false);
      } else {
        setResendMessage(res?.message || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      console.error('Resend verification error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      if (err.response && err.response.data && err.response.data.message) {
        setResendMessage(err.response.data.message);
      } else if (err.response && err.response.status) {
        setResendMessage(`Error ${err.response.status}: Failed to resend verification email.`);
      } else {
        setResendMessage('Error resending verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  }

  async function handleForgotUsername(): Promise<void> {
    if (!forgotEmail || forgotEmail.trim() === '') {
      setForgotMessage('Please enter your email address.');
      return;
    }

    setIsSendingForgot(true);
    setForgotMessage('');

    try {
      const { data: res } = await axios.post(
        buildPath('api/forgot-username'),
        { email: forgotEmail },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res?.success) {
        setForgotMessage(res.message || 'Username recovery email sent! Please check your inbox.');
        setForgotEmail('');
      } else {
        setForgotMessage(res?.message || 'Failed to send username recovery email.');
      }
    } catch (err: any) {
      console.error('Forgot username error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setForgotMessage(err.response.data.message);
      } else {
        setForgotMessage('Error sending username recovery email.');
      }
    } finally {
      setIsSendingForgot(false);
    }
  }

  async function handleForgotPassword(): Promise<void> {
    if (!forgotEmail || forgotEmail.trim() === '') {
      setForgotMessage('Please enter your email address.');
      return;
    }

    setIsSendingForgot(true);
    setForgotMessage('');

    try {
      const { data: res } = await axios.post(
        buildPath('api/forgot-password'),
        { email: forgotEmail },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res?.success) {
        setForgotMessage(res.message || 'Password reset email sent! Please check your inbox.');
        setForgotEmail('');
      } else {
        setForgotMessage(res?.message || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setForgotMessage(err.response.data.message);
      } else {
        setForgotMessage('Error sending password reset email.');
      }
    } finally {
      setIsSendingForgot(false);
    }
  }

  return (
    <main style={{ display: 'contents' }}>
      <div id="loginDiv">
        <span id="inner-title">Please Log In</span>

        <label htmlFor="loginName">Username</label>
        <input
          type="text"
          id="loginName"
          placeholder="Username"
          value={loginName}
          onChange={handleSetLoginName}
          aria-invalid={loginNameError ? 'true' : 'false'}
        />
        {loginNameError && <div className="error">{loginNameError}</div>}

        <label htmlFor="loginPassword">Password</label>
        <input
          type="password"
          id="loginPassword"
          placeholder="Password"
          value={loginPassword}
          onChange={handleSetPassword}
          aria-invalid={loginPasswordError ? 'true' : 'false'}
        />
        {loginPasswordError && <div className="error">{loginPasswordError}</div>}

        <input
          type="submit"
          id="loginButton"
          className="buttons"
          value="Login"
          onClick={doLogin}
        />
        <span id="loginResult">{message}</span>

        {resendMessage && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '12px', 
            color: resendMessage.includes('sent') ? '#2ecc71' : '#e74c3c',
            fontSize: '0.95rem'
          }}>
            {resendMessage}
          </div>
        )}

        {showResendButton && (
          <button
            type="button"
            id="resendVerificationButton"
            className="buttons"
            onClick={handleResendVerification}
            disabled={isResending}
            style={{ 
              width: '100%', 
              marginTop: '12px',
              backgroundColor: isResending ? '#ccc' : '#2d5016'
            }}
          >
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        )}

        {/* Forgot Username/Password Links */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '16px',
          fontSize: '0.9rem'
        }}>
          <button
            type="button"
            onClick={() => {
              setShowForgotUsername(true);
              setShowForgotPassword(false);
              setForgotMessage('');
              setForgotEmail('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2d5016',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: '0',
              fontSize: '0.9rem'
            }}
          >
            Forgot Username?
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setShowForgotUsername(false);
              setForgotMessage('');
              setForgotEmail('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2d5016',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: '0',
              fontSize: '0.9rem'
            }}
          >
            Forgot Password?
          </button>
        </div>

        {/* Forgot Username Modal */}
        {showForgotUsername && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            border: '2px solid #2d5016',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ marginTop: '0', fontSize: '1.1rem', color: '#2d5016' }}>
              Forgot Username
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
              Enter your email address and we'll send you your username.
            </p>
            <input
              type="email"
              placeholder="Email Address"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid rgb(79, 62, 45)',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '12px',
                boxSizing: 'border-box'
              }}
            />
            {forgotMessage && (
              <div style={{
                marginBottom: '12px',
                color: forgotMessage.includes('sent') || forgotMessage.includes('email') ? '#2ecc71' : '#e74c3c',
                fontSize: '0.9rem'
              }}>
                {forgotMessage}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleForgotUsername}
                disabled={isSendingForgot}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: isSendingForgot ? '#ccc' : '#2d5016',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSendingForgot ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {isSendingForgot ? 'Sending...' : 'Send Username'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotUsername(false);
                  setForgotEmail('');
                  setForgotMessage('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            border: '2px solid #2d5016',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ marginTop: '0', fontSize: '1.1rem', color: '#2d5016' }}>
              Forgot Password
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
              Enter your email address and we'll send you a password reset link.
            </p>
            <input
              type="email"
              placeholder="Email Address"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid rgb(79, 62, 45)',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '12px',
                boxSizing: 'border-box'
              }}
            />
            {forgotMessage && (
              <div style={{
                marginBottom: '12px',
                color: forgotMessage.includes('sent') || forgotMessage.includes('email') ? '#2ecc71' : '#e74c3c',
                fontSize: '0.9rem'
              }}>
                {forgotMessage}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isSendingForgot}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: isSendingForgot ? '#ccc' : '#2d5016',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSendingForgot ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {isSendingForgot ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail('');
                  setForgotMessage('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div id="newUserSection">
          <span id="newUserText">New User?</span>
          <button
            type="button"
            id="signUpButton"
            className="buttons"
            onClick={goToRegister}
          >
            Sign Up Now!
          </button>
        </div>
    </div>
    </main>
  );
}

export default Login;