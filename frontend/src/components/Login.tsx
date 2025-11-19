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
        setMessage(err.response.data.error);
      } else {
        setMessage('Network or server error logging in.');
      }
    }

  }

  function goToRegister() {
    window.location.href = '/register';
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