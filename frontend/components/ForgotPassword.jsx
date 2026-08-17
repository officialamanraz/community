import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`[ForgotPassword] Submitting reset request for email: ${email}`);
    
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log('[ForgotPassword] Server response:', data);

      if (res.ok) {
        setMessage(data.message || 'If that email exists, a reset link has been sent.');
      } else {
        setIsError(true);
        setMessage(data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('[ForgotPassword] Request error:', err);
      setIsError(true);
      setMessage('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2>Forgot Password</h2>
        <p className="subtitle-text">
          Enter your account email. We'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {message && (
            <div className={`message-box ${isError ? 'message-error' : 'message-success'}`}>
              {message}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-submit-btn"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;