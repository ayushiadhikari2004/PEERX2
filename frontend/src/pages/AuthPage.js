import React from 'react';
import './AuthPage.css';

const AuthPage = ({
  isLogin,
  setIsLogin,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  regUsername,
  setRegUsername,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  handleAuth,
  loading,
  notification
}) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          <span className="icon">🌐</span> PeerX
        </h1>
        <p className="auth-subtitle">
          {isLogin ? "Welcome back! Please enter your details." : "Create an account to start sharing."}
        </p>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? "active" : ""}`} 
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Login
          </button>
          <button 
            className={`auth-tab ${!isLogin ? "active" : ""}`} 
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleAuth}>
          {!isLogin && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={isLogin ? loginEmail : regEmail}
              onChange={(e) => (isLogin ? setLoginEmail(e.target.value) : setRegEmail(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={isLogin ? loginPassword : regPassword}
              onChange={(e) =>
                isLogin ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)
              }
              required
            />
          </div>

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
};

export default AuthPage;
