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