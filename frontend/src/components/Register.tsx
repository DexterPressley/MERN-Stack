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

    // Individual error states for each field
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    function handleSetFirstName(e: React.ChangeEvent<HTMLInputElement>) {
        setFirstName(e.target.value);
        setFirstNameError(''); // Clear error on input
    }

    function handleSetLastName(e: React.ChangeEvent<HTMLInputElement>) {
        setLastName(e.target.value);
        setLastNameError(''); // Clear error on input
    }

    function handleSetUsername(e: React.ChangeEvent<HTMLInputElement>) {
        setUsername(e.target.value);
        setUsernameError(''); // Clear error on input
    }

    function handleSetEmail(e: React.ChangeEvent<HTMLInputElement>) {
        setEmail(e.target.value);
        setEmailError(''); // Clear error on input
    }

    function handleSetPassword(e: React.ChangeEvent<HTMLInputElement>) {
        setPassword(e.target.value);
        setPasswordError(''); // Clear error on input
    }

    function handleSetConfirmPassword(e: React.ChangeEvent<HTMLInputElement>) {
        setConfirmPassword(e.target.value);
        setConfirmPasswordError(''); // Clear error on input
    }

    // Email validation function
    function isEmail(str: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    // Clear all errors
    function clearAllErrors() {
        setFirstNameError('');
        setLastNameError('');
        setUsernameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setMessage('');
    }

    async function doRegister(
        event: React.MouseEvent<HTMLInputElement, MouseEvent>
    ): Promise<void> {
        event.preventDefault();

        // Clear all previous errors
        clearAllErrors();

        let valid = true;

        // Validate First Name (required, cannot be empty/whitespace)
        if (!firstName || firstName.trim() === '') {
            setFirstNameError('First name is required');
            valid = false;
        }

        // Validate Last Name (required, cannot be empty/whitespace)
        if (!lastName || lastName.trim() === '') {
            setLastNameError('Last name is required');
            valid = false;
        }

        // Validate Username (required, cannot be empty/whitespace)
        if (!username || username.trim() === '') {
            setUsernameError('Username is required');
            valid = false;
        }

        // Validate Email (required, cannot be empty/whitespace)
        if (!email || email.trim() === '') {
            setEmailError('Email is required');
            valid = false;
        } else if (!isEmail(email.trim())) {
            // Validate Email format
            setEmailError('Invalid email format');
            valid = false;
        }

        // Validate Password (required, cannot be empty/whitespace)
        if (!password || password.trim() === '') {
            setPasswordError('Password is required');
            valid = false;
        } else if (password.length < 6) {
            // Validate Password minimum length
            setPasswordError('Password must be at least 6 characters');
            valid = false;
        }

        // Validate Confirm Password (required)
        if (!confirmPassword || confirmPassword.trim() === '') {
            setConfirmPasswordError('Please confirm your password');
            valid = false;
        } else if (password !== confirmPassword) {
            // Check if passwords match
            setConfirmPasswordError('Passwords do not match');
            valid = false;
        }

        // If validation failed, stop here
        if (!valid) {
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
        <div id="registerDiv">
            <span id="inner-title">CREATE AN ACCOUNT</span><br />
            First Name:{' '}
            <input
                type="text"
                id="firstName"
                placeholder="First Name"
                value={firstName}
                onChange={handleSetFirstName}
                aria-invalid={firstNameError ? 'true' : 'false'}
            />
            {firstNameError && <div className="error">{firstNameError}</div>}
            <br />
            Last Name:{' '}
            <input
                type="text"
                id="lastName"
                placeholder="Last Name"
                value={lastName}
                onChange={handleSetLastName}
                aria-invalid={lastNameError ? 'true' : 'false'}
            />
            {lastNameError && <div className="error">{lastNameError}</div>}
            <br />
            Username:{' '}
            <input
                type="text"
                id="username"
                placeholder="Username"
                value={username}
                onChange={handleSetUsername}
                aria-invalid={usernameError ? 'true' : 'false'}
            />
            {usernameError && <div className="error">{usernameError}</div>}
            <br />
            Email:{' '}
            <input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={handleSetEmail}
                aria-invalid={emailError ? 'true' : 'false'}
            />
            {emailError && <div className="error">{emailError}</div>}
            <br />
            Password:{' '}
            <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={handleSetPassword}
                aria-invalid={passwordError ? 'true' : 'false'}
            />
            {passwordError && <div className="error">{passwordError}</div>}
            <br />
            Confirm Password:{' '}
            <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleSetConfirmPassword}
                aria-invalid={confirmPasswordError ? 'true' : 'false'}
            />
            {confirmPasswordError && <div className="error">{confirmPasswordError}</div>}
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