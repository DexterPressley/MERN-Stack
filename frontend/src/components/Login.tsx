import React, { useState } from 'react';

const app_name = 'colorsdigitalocean.xyz';

function buildPath(route: string): string {
  // When running "npm run dev" locally:
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000/' + route;
  }
  // When running the built site on the droplet (HTTPS enabled)
  return 'https://' + app_name + '/' + route;
}

function Login() {
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');

  function handleSetLoginName(e: React.ChangeEvent<HTMLInputElement>): void {
    setLoginName(e.target.value);
  }

  function handleSetPassword(e: React.ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  // Make doLogin async
  async function doLogin(
    event: React.MouseEvent<HTMLInputElement, MouseEvent>
  ): Promise<void> {
    event.preventDefault();

    const obj = { login: loginName, password: loginPassword };
    const js = JSON.stringify(obj);

    try {
      // If you set a Vite proxy for /api, you can use '/api/login' instead of the full URL.
      const response = await fetch(buildPath('api/login'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });

      const res = JSON.parse(await response.text());

      if (res.id <= 0) {
        setMessage('User/Password combination incorrect');
      } else {
        const user = {
          firstName: res.firstName,
          lastName: res.lastName,
          id: res.id,
        };
        localStorage.setItem('user_data', JSON.stringify(user));
        setMessage('');
        window.location.href = '/cards'; // follows your professor’s example
        // (Alternative with react-router: navigate('/cards'))
      }
    } catch (error: any) {
      alert(error.toString());
      return;
    }
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">PLEASE LOG IN</span>
      <br />
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

