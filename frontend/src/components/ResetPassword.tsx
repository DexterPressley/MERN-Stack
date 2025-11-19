import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildPath } from './Path';

function ResetPassword() {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Individual error states for each field
    const [newPasswordError, setNewPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    useEffect(() => {
        // Get token from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setMessage('Invalid or missing reset token. Please request a new password reset link.');
        }
    }, []);

    function handleSetNewPassword(e: React.ChangeEvent<HTMLInputElement>) {
        setNewPassword(e.target.value);
        setNewPasswordError('');
    }

    function handleSetConfirmPassword(e: React.ChangeEvent<HTMLInputElement>) {
        setConfirmPassword(e.target.value);
        setConfirmPasswordError('');
    }

    function clearAllErrors() {
        setNewPasswordError('');
        setConfirmPasswordError('');
        setMessage('');
    }

    async function handleResetPassword(
        event: React.MouseEvent<HTMLInputElement, MouseEvent>
    ): Promise<void> {
        event.preventDefault();

        clearAllErrors();

        let valid = true;

        // Validate new password (required, cannot be empty/whitespace)
        if (!newPassword || newPassword.trim() === '') {
            setNewPasswordError('New password is required');
            valid = false;
        } else if (newPassword.length < 6) {
            setNewPasswordError('Password must be at least 6 characters');
            valid = false;
        }

        // Validate confirm password (required)
        if (!confirmPassword || confirmPassword.trim() === '') {
            setConfirmPasswordError('Please confirm your password');
            valid = false;
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            valid = false;
        }

        // If validation failed, stop here
        if (!valid) {
            return;
        }

        if (!token) {
            setMessage('Missing reset token. Please request a new password reset link.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: res } = await axios.post(
                buildPath('api/reset-password'),
                { token, newPassword, confirmPassword },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (res?.success) {
                setIsSuccess(true);
                setMessage(res.message || 'Password reset successful! Redirecting to login...');
                
                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                setMessage(res?.message || 'Failed to reset password.');
                setIsSuccess(false);
            }
        } catch (err: any) {
            console.error('Reset password error:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setMessage(err.response.data.message);
            } else {
                setMessage('Error resetting password. Please try again.');
            }
            setIsSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    }

    function goToLogin() {
        window.location.href = '/';
    }

    return (
        <main style={{ display: 'contents' }}>
            <div id="resetPasswordDiv" style={{ width: '100%', minWidth: '300px', maxWidth: '300px', margin: '0 auto' }}>
                <div className="header-row" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '24px' 
                }}>
                    <span id="inner-title" style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 600, 
                        margin: 0,
                        flex: 1
                    }}>
                        Reset Password
                    </span>
                    <button
                        type="button"
                        className="btn btn-back"
                        onClick={goToLogin}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2d5016',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Back to Login
                    </button>
                </div>

                {!token ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        color: '#e74c3c'
                    }}>
                        <p>{message}</p>
                        <button
                            type="button"
                            onClick={goToLogin}
                            style={{
                                marginTop: '16px',
                                padding: '12px 24px',
                                backgroundColor: '#2d5016',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Go to Login
                        </button>
                    </div>
                ) : isSuccess ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px'
                    }}>
                        <div style={{ 
                            color: '#2ecc71', 
                            fontSize: '1.1rem',
                            marginBottom: '16px'
                        }}>
                            ✓ {message}
                        </div>
                        <p style={{ color: '#666' }}>
                            You will be redirected to the login page in a few seconds...
                        </p>
                    </div>
                ) : (
                    <>
                        <p style={{ 
                            marginBottom: '24px', 
                            color: '#666',
                            textAlign: 'center'
                        }}>
                            Enter your new password below.
                        </p>

                        <label htmlFor="newPassword" style={{ 
                            display: 'block',
                            fontWeight: 600,
                            marginTop: '12px',
                            fontSize: '14px',
                            marginBottom: '8px'
                        }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={handleSetNewPassword}
                            aria-invalid={newPasswordError ? 'true' : 'false'}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: newPasswordError ? '2px solid #e74c3c' : '2px solid rgb(79, 62, 45)',
                                borderRadius: '8px',
                                fontSize: '16px',
                                marginBottom: '8px',
                                boxSizing: 'border-box',
                                background: 'white'
                            }}
                        />
                        {newPasswordError && (
                            <div style={{ 
                                color: '#e74c3c', 
                                fontSize: '0.9em',
                                marginTop: '4px',
                                marginBottom: '8px'
                            }}>
                                {newPasswordError}
                            </div>
                        )}

                        <label htmlFor="confirmPassword" style={{ 
                            display: 'block',
                            fontWeight: 600,
                            marginTop: '12px',
                            fontSize: '14px',
                            marginBottom: '8px'
                        }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={handleSetConfirmPassword}
                            aria-invalid={confirmPasswordError ? 'true' : 'false'}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: confirmPasswordError ? '2px solid #e74c3c' : '2px solid rgb(79, 62, 45)',
                                borderRadius: '8px',
                                fontSize: '16px',
                                marginBottom: '8px',
                                boxSizing: 'border-box',
                                background: 'white'
                            }}
                        />
                        {confirmPasswordError && (
                            <div style={{ 
                                color: '#e74c3c', 
                                fontSize: '0.9em',
                                marginTop: '4px',
                                marginBottom: '8px'
                            }}>
                                {confirmPasswordError}
                            </div>
                        )}

                        <input
                            type="submit"
                            id="resetPasswordButton"
                            className="buttons"
                            value={isSubmitting ? 'Resetting...' : 'Reset Password'}
                            onClick={handleResetPassword}
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginTop: '20px',
                                backgroundColor: isSubmitting ? '#ccc' : '#2d5016',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                boxSizing: 'border-box'
                            }}
                        />

                        {message && !isSuccess && (
                            <div style={{ 
                                textAlign: 'center',
                                marginTop: '12px',
                                color: '#e74c3c',
                                fontSize: '0.95rem'
                            }}>
                                {message}
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

export default ResetPassword;