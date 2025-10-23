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

  function handleSetLoginName(e: React.ChangeEvent<HTMLInputElement>) {
    setLoginName(e.target.value);
  }
  function handleSetPassword(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  async function doLogin(
    event: React.MouseEvent<HTMLInputElement, MouseEvent>
  ): Promise<void> {
    event.preventDefault();

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
      setMessage('Network or server error logging in.');
    }
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">PLEASE LOG IN</span><br />
      Username:{' '}
      <input
        type="text"
        id="loginName"
        placeholder="Username"
        onChange={handleSetLoginName}
      />
      <br />
      Password:{' '}
      <input
        type="password"
        id="loginPassword"
        placeholder="Password"
        onChange={handleSetPassword}
      />
      <br />
      <input
        type="submit"
        id="loginButton"
        className="buttons"
        value="Do It"
        onClick={doLogin}
      />
      <span id="loginResult">{message}</span>
    </div>
  );
}

export default Login;

