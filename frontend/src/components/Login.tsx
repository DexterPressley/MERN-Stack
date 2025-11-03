import React, { useState } from "react";
import axios from "axios";
import { buildPath } from "./Path";
import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "token_data";
function storeToken(val: string) { try { localStorage.setItem(TOKEN_KEY, val); } catch {} }

type TokenPayload = {
  userId: number;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
};

// set to true if you want to always skip the server during demo
const DEMO = false;

export default function Login() {
  const [message, setMessage] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function doRealLogin(): Promise<boolean> {
    try {
      const { data: res } = await axios.post(
        buildPath("api/login"),
        { username: loginName, password: loginPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res?.error) {
        setMessage("Invalid username or password");
        return false;
      }

      const accessToken: string | undefined = res?.accessToken;
      if (!accessToken) {
        setMessage("Unexpected server response (no access token)");
        return false;
      }

      storeToken(accessToken);
      const payload = jwtDecode<TokenPayload>(accessToken);
      if (!payload.userId) return false;

      localStorage.setItem("user_data", JSON.stringify({
        id: payload.userId, userId: payload.userId,
        firstName: payload.firstName, lastName: payload.lastName
      }));

      return true;
    } catch {
      return false;
    }
  }

  function doDemoLogin(): boolean {
    const ok = loginName.trim().toLowerCase() === "demo" &&
               (loginPassword.trim() === "demo" || loginPassword.trim() === "password");
    if (!ok && !DEMO) {
      setMessage("Server not reachable. Use demo/demo to preview, or enable DEMO in code.");
      return false;
    }
    const fake = {
      userId: 1, firstName: "Demo", lastName: "User",
      iat: Math.floor(Date.now()/1000),
      exp: Math.floor(Date.now()/1000) + 3600
    };
    const fakeToken = btoa(JSON.stringify(fake));
    storeToken(fakeToken);
    localStorage.setItem("user_data", JSON.stringify({
      id: fake.userId, userId: fake.userId, firstName: fake.firstName, lastName: fake.lastName
    }));
    return true;
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginName || !loginPassword) {
      setMessage("Please enter username and password");
      return;
    }
    setLoading(true);
    setMessage("Checking credentials…");

    if (DEMO) {
      const ok = doDemoLogin();
      setLoading(false);
      if (ok) window.location.href = "/dashboard";
      return;
    }

    const ok = await doRealLogin();
    setLoading(false);

    if (ok) {
      setMessage("");
      window.location.href = "/dashboard";
      return;
    }

    const fallback = doDemoLogin();
    if (fallback) {
      setMessage("Server unreachable — using demo account.");
      window.location.href = "/dashboard";
    }
  }

  function goToRegister() { window.location.href = "/register"; }

  return (
    <div className="layout center">
      <div className="card login-card" style={{ maxWidth: 480 }}>
        <h1 className="title">Sign In</h1>
        <p className="muted">Tip: use <code>demo / demo</code> to preview without a server.</p>

        <form onSubmit={doLogin} className="form-grid">
          <label>
            Username
            <input className="input" value={loginName} onChange={(e)=>setLoginName(e.target.value)}
                   autoComplete="username" placeholder="Enter your username" />
          </label>

          <label>
            Password
            <input className="input" type="password" value={loginPassword}
                   onChange={(e)=>setPassword(e.target.value)}
                   autoComplete="current-password" placeholder="Enter your password" />
          </label>

          <button type="submit" className="primary full" disabled={loading}>
            {loading ? "Signing in…" : "Log In"}
          </button>

          <div id="loginResult" className="muted center-text" style={{ minHeight: 20 }}>{message}</div>
        </form>

        <hr />
        <div className="center-text">
          <p className="muted">New user?</p>
          <button type="button" className="secondary" onClick={goToRegister}>Sign Up Now!</button>
        </div>
      </div>
    </div>
  );
}
