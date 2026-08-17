import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ResetPassword.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[ResetPassword] Attempting password reset for token:', token);
    
    setMessage('');
    setIsError(false);

    if (newPassword !== confirmPassword) {
      console.warn('[ResetPassword] Passwords do not match.');
      setIsError(true);
      setMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      console.log('[ResetPassword] Server response:', data);

      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          console.log('[ResetPassword] Redirecting to login page.');
          navigate('/login');
        }, 2000);
      } else {
        setIsError(true);
        setMessage(data.message || 'Reset failed. The link may have expired.');
      }
    } catch (err) {
      console.error('[ResetPassword] Network or server error:', err);
      setIsError(true);
      setMessage('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h2>Reset Your Password</h2>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {message && (
            <div className={`message-box ${isError ? 'message-error' : 'message-success'}`}>
              {message}
            </div>
          )}

          <input
            type="password"
            placeholder="New Password (min. 6 characters)"
            minLength="6"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="auth-input"
          />
          
          <input
            type="password"
            placeholder="Confirm New Password"
            minLength="6"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="auth-input"
          />
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-submit-btn"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="back-to-login">
            <Link to="/login" className="login-link">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;