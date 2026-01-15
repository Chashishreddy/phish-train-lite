import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register } = useAuth();

  function togglePasswordVisibility(field) {
    if (field === 'password') {
      setShowPassword(true);
      setTimeout(() => setShowPassword(false), 2000);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(true);
      setTimeout(() => setShowConfirmPassword(false), 2000);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Signup validation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        await register(username, email, password);
      } else {
        // Login
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || (isSignup ? 'Registration failed. Please try again.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsSignup(!isSignup);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Phish Train Lite</h1>
          <p>Security Awareness Training Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
                disabled={loading}
                className="password-toggle-button"
                title="Show password for 2 seconds"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {isSignup && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-container">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Confirm your password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  disabled={loading}
                  className="password-toggle-button"
                  title="Show password for 2 seconds"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={toggleMode}
            className="toggle-mode-button"
          >
            {isSignup ? 'Already have an account? Log in' : 'Don\'t have an account? Sign up'}
          </button>
          {!isSignup && (
            <p>Default credentials: admin / (as configured in setup)</p>
          )}
          <p className="security-note">
            This is an internal security training platform. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
