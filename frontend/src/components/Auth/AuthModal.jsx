import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Building, 
  Award, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Sparkles,
  Zap
} from 'lucide-react';
import { authDb } from '../../utils/authDb';
import shieldLogo from '../../assets/lmpc_shield_logo.png';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('inspector');
  const [regDept, setRegDept] = useState('');
  const [regJurisdiction, setRegJurisdiction] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const preseeded = authDb.getPreseededAccounts();

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const res = authDb.login(loginEmail, loginPassword);
    if (!res.success) {
      setError(res.error);
      return;
    }

    setSuccessMsg(`Welcome, ${res.user.name} (${res.user.badgeNumber})!`);
    setTimeout(() => {
      if (onLoginSuccess) onLoginSuccess(res.user);
      onClose();
    }, 600);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const res = authDb.registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      department: regDept,
      jurisdiction: regJurisdiction
    });

    if (!res.success) {
      setError(res.error);
      return;
    }

    // Auto-login the newly registered user
    const loginRes = authDb.login(regEmail, regPassword);
    setSuccessMsg(`Account created and authenticated! Badge ID: ${res.user.badgeNumber}`);
    setTimeout(() => {
      if (onLoginSuccess) onLoginSuccess(loginRes.user || res.user);
      onClose();
    }, 800);
  };

  const handleQuickDemoLogin = (account) => {
    setError(null);
    setSuccessMsg(null);

    const res = authDb.login(account.email, account.password);
    if (res.success) {
      setSuccessMsg(`Authenticated as ${account.name} (${account.badgeNumber})`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      }, 500);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="lmpc-auth-overlay" onClick={onClose}>
      <div className="lmpc-auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          className="lmpc-auth-close-btn" 
          onClick={onClose}
          title="Close Auth Portal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="lmpc-auth-header">
          <div className="lmpc-auth-emblem-wrap">
            <img src={shieldLogo} alt="LMPC Statutory Emblem" />
          </div>
          <h2 className="lmpc-auth-title">
            <span className="brand-accent">LMPC</span>
            <span className="brand-sub">Vision</span>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>| Officer Gateway</span>
          </h2>
          <p className="lmpc-auth-subtitle">
            National Legal Metrology Statutory Enforcement & Regulatory Division
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="lmpc-auth-tabs">
          <button
            className={`lmpc-auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(null); setSuccessMsg(null); }}
          >
            <Lock size={13} />
            Officer Sign In
          </button>
          <button
            className={`lmpc-auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(null); setSuccessMsg(null); }}
          >
            <User size={13} />
            Officer Register
          </button>
          <button
            className={`lmpc-auth-tab ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('demo'); setError(null); setSuccessMsg(null); }}
          >
            <Zap size={13} />
            1-Click Demo
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="lmpc-auth-alert error">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="lmpc-auth-alert success">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: Sign In */}
        {activeTab === 'login' && (
          <form className="lmpc-auth-form" onSubmit={handleLogin}>
            <div className="lmpc-input-group">
              <label>
                <Mail size={13} />
                Official Officer / Regulatory Email Address
              </label>
              <div className="lmpc-input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="e.g., inspector.delhi@lmpc.gov.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="lmpc-input-group">
              <label>
                <Lock size={13} />
                Statutory Access Password
              </label>
              <div className="lmpc-input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your security password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="lmpc-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lmpc-submit-btn">
              Authenticate Statutory Officer Session
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* TAB 2: Register */}
        {activeTab === 'register' && (
          <form className="lmpc-auth-form" onSubmit={handleRegister}>
            <div className="lmpc-input-group">
              <label>
                <User size={13} />
                Officer Full Name
              </label>
              <div className="lmpc-input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Inspector Ankit Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
            </div>

            <div className="lmpc-input-group">
              <label>
                <Mail size={13} />
                Official Govt / Industry Email
              </label>
              <div className="lmpc-input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="e.g., ankit.sharma@gov.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="lmpc-input-group">
              <label>
                <Award size={13} />
                Statutory Role & Clearance
              </label>
              <div className="lmpc-input-wrapper">
                <Award size={16} className="input-icon" />
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                >
                  <option value="inspector">Senior Legal Metrology Inspector (Govt)</option>
                  <option value="fssai">FSSAI Food Safety Officer (Govt)</option>
                  <option value="packager">Brand Packager / Regulatory Industry Officer</option>
                </select>
              </div>
            </div>

            <div className="lmpc-input-group">
              <label>
                <Building size={13} />
                Department / Circle
              </label>
              <div className="lmpc-input-wrapper">
                <Building size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="e.g., Dept of Consumer Affairs, Delhi Circle"
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                />
              </div>
            </div>

            <div className="lmpc-input-group">
              <label>
                <Lock size={13} />
                Set Security Password (min 6 characters)
              </label>
              <div className="lmpc-input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Create secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="lmpc-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lmpc-submit-btn">
              Create Persistent Account & Log In
              <Sparkles size={16} />
            </button>
          </form>
        )}

        {/* TAB 3: 1-Click Demo Profiles */}
        {activeTab === 'demo' && (
          <div className="lmpc-demo-grid">
            {preseeded.map((acc) => (
              <div
                key={acc.id}
                className="lmpc-demo-card"
                onClick={() => handleQuickDemoLogin(acc)}
              >
                <div className="lmpc-demo-info">
                  <span className={`lmpc-demo-badge-pill ${acc.role}`}>
                    {acc.badgeNumber} • {acc.role.toUpperCase()}
                  </span>
                  <h4>{acc.name}</h4>
                  <p>{acc.roleLabel}</p>
                  <p style={{ color: '#64748B', fontSize: '0.7rem' }}>{acc.email}</p>
                </div>
                <button
                  type="button"
                  className="lmpc-demo-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin(acc);
                  }}
                >
                  1-Click Access →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Legal Footer Note */}
        <div className="lmpc-auth-footer-note">
          Secured with SHA-256 Merkle Chain of Custody & Legal Metrology Act 2009 statutory encryption.
        </div>
      </div>
    </div>
  );
}
