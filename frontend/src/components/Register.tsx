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
    const [confirmPassword, setConfirmPassword] = useState('');

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

    function handleSetConfirmPassword(e: React.ChangeEvent<HTMLInputElement>) {
        setConfirmPassword(e.target.value);
    }

    // Email validation function 
    function isEmail(str: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    async function doRegister(
        event: React.MouseEvent<HTMLInputElement, MouseEvent>
    ): Promise<void> {
        event.preventDefault();

        // Clear previous message
        setMessage('');

        // Validate First Name (required, cannot be empty/whitespace)
        if (!firstName || firstName.trim() === '') {
            setMessage('First name is required');
            return;
        }

        // Validate Last Name (required, cannot be empty/whitespace)
        if (!lastName || lastName.trim() === '') {
            setMessage('Last name is required');
            return;
        }

        // Validate Username (required, cannot be empty/whitespace)
        if (!username || username.trim() === '') {
            setMessage('Username is required');
            return;
        }

        // Validate Email (required, cannot be empty/whitespace)
        if (!email || email.trim() === '') {
            setMessage('Email is required');
            return;
        }

        // Validate Email format
        if (!isEmail(email.trim())) {
            setMessage('Invalid email format');
            return;
        }

        // Validate Password (required, cannot be empty/whitespace)
        if (!password || password.trim() === '') {
            setMessage('Password is required');
            return;
        }

        // Validate Password minimum length
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters');
            return;
        }

        // Validate Confirm Password (required)
        if (!confirmPassword || confirmPassword.trim() === '') {
            setMessage('Please confirm your password');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            // Step 1: Register the user
            const { data: registerRes } = await axios.post(
                buildPath('api/register'),
                { firstName, lastName, username, email, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (registerRes?.error && registerRes.error !== '') {
                setMessage(registerRes.error);
                return;
            }

            if (!registerRes?.success) {
                setMessage(registerRes?.message || 'Registration failed');
                return;
            }

            // Step 2: Automatically log in the user after successful registration
            try {
                const { data: loginRes } = await axios.post(
                    buildPath('api/login'),
                    { login: username, password: password },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                if (loginRes?.id && loginRes.id > 0) {
                    // Store user data in localStorage 
                    const userData = {
                        id: loginRes.id,
                        firstName: loginRes.firstName || firstName,
                        lastName: loginRes.lastName || lastName,
                        username: username
                    };
                    localStorage.setItem('user_data', JSON.stringify(userData));

                    setMessage('Registration successful! Redirecting...');

                    // Redirect to cards page after short delay
                    setTimeout(() => {
                        window.location.href = '/cards';
                    }, 1500);
                } else {
                    setMessage('Account created. Please log in.');
                    // Optionally redirect to login page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            } catch (loginErr: any) {
                console.error('Auto-login error:', loginErr);
                setMessage('Account created, but auto-login failed. Please log in.');
                // Optionally redirect to login page
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }

        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.response && err.response.data) {
                if (err.response.data.error) {
                    setMessage(err.response.data.error);
                } else if (err.response.data.message) {
                    setMessage(err.response.data.message);
                } else {
                    setMessage(`Registration failed (HTTP ${err.response.status})`);
                }
            } else {
                setMessage('Network or server error during registration.');
            }
        }
    }

    return (
        <div className="content-box">
            <div id="registerDiv">
                <span id="inner-title">CREATE AN ACCOUNT</span><br />
                First Name:{' '}
                <input
                    type="text"
                    id="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={handleSetFirstName}
                />
                <br />
                Last Name:{' '}
                <input
                    type="text"
                    id="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={handleSetLastName}
                />
                <br />
                Username:{' '}
                <input
                    type="text"
                    id="username"
                    placeholder="Username"
                    value={username}
                    onChange={handleSetUsername}
                />
                <br />
                Email:{' '}
                <input
                    type="email"
                    id="email"
                    placeholder="Email"
                    value={email}
                    onChange={handleSetEmail}
                />
                <br />
                Password:{' '}
                <input
                    type="password"
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={handleSetPassword}
                />
                <br />
                Confirm Password:{' '}
                <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={handleSetConfirmPassword}
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
        </div>
    );
}

export default Register;