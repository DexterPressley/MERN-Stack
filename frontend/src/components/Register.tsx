import React, { useState } from 'react';
import axios from 'axios';
import { buildPath } from './Path';

function Register() {
    const [message, setMessage] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function handleSetFirstName(e: React.ChangeEvent<HTMLInputElement>) {
        setFirstName(e.target.value);
    }

    function handleSetLastName(e: React.ChangeEvent<HTMLInputElement>) {
        setLastName(e.target.value);
    }

    function handleSetUsername(e: React.ChangeEvent<HTMLInputElement>) {
        setUsername(e.target.value);
    }

    function handleSetEmail(e: React.ChangeEvent<HTMLInputElement>) {
        setEmail(e.target.value);
    }

    function handleSetPassword(e: React.ChangeEvent<HTMLInputElement>) {
        setPassword(e.target.value);
    }

    async function doRegister(
        event: React.MouseEvent<HTMLInputElement, MouseEvent>
    ): Promise<void> {
        event.preventDefault();

        // Client-side validation
        if (!firstName || !lastName || !username || !email || !password) {
            setMessage('All fields are required');
            return;
        }

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters');
            return;
        }

        try {
            const { data: res } = await axios.post(
                buildPath('api/register'),
                { firstName, lastName, username, email, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (res?.success) {
                // Store user data temporarily (they'll need to log in, or we auto-log them in)
                setMessage('Registration successful! Redirecting...');


                // Redirect to logged in page after short delay
                setTimeout(() => {
                    window.location.href = '/cards';
                }, 1500);
            } else {
                setMessage(res?.message || 'Registration failed');
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.message) {
                setMessage(err.response.data.message);
            } else {
                setMessage('Network or server error during registration.');
            }
        }
    }

    return (
        <div id="registerDiv">
            <span id="inner-title">CREATE AN ACCOUNT</span><br />
            First Name:{' '}
            <input
                type="text"
                id="firstName"
                placeholder="First Name"
                onChange={handleSetFirstName}
            />
            <br />
            Last Name:{' '}
            <input
                type="text"
                id="lastName"
                placeholder="Last Name"
                onChange={handleSetLastName}
            />
            <br />
            Username:{' '}
            <input
                type="text"
                id="username"
                placeholder="Username"
                onChange={handleSetUsername}
            />
            <br />
            Email:{' '}
            <input
                type="email"
                id="email"
                placeholder="Email"
                onChange={handleSetEmail}
            />
            <br />
            Password:{' '}
            <input
                type="password"
                id="password"
                placeholder="Password (min 6 characters)"
                onChange={handleSetPassword}
            />
            <br />
            <input
                type="submit"
                id="registerButton"
                className="buttons"
                value="Sign Up"
                onClick={doRegister}
            />
            <span id="registerResult">{message}</span>
        </div>
    );
}

export default Register;