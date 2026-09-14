import React, { useState, useEffect } from 'react';
import { Shield, Scale, HeartPulse, Wifi, WifiOff, Database, Clock, User, LogOut, Lock, KeyRound, History } from 'lucide-react';
import { offlineStorage } from '../utils/offlineStorage';
import { authDb } from '../utils/authDb';
import { scanHistory } from '../utils/scanHistory';
import AuthModal from './Auth/AuthModal';
import ScanHistoryModal from './History/ScanHistoryModal';
import PillNav from '../PillNav';
import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';
import shieldLogo from '../assets/lmpc_shield_logo.png';

export default function Header({ currentMode, onModeChange, onOpenOfflineQueue, onAuthModalToggle }) {
  const [currentUser, setCurrentUser] = useState(() => authDb.getCurrentUser());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const activeBadge = currentUser?.badgeNumber || 'LM-INSP-DEL-4091';
  const [historyCount, setHistoryCount] = useState(() => scanHistory.getHistoryByOfficer(activeBadge).length);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('lmpc_session_active');
    authDb.logout();
    setCurrentUser(null);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkAuth = () => {
      const active = sessionStorage.getItem('lmpc_session_active');
      const u = active ? authDb.getCurrentUser() : null;
      setCurrentUser(u);
      const b = u?.badgeNumber || 'LM-INSP-DEL-4091';
      setHistoryCount(scanHistory.getHistoryByOfficer(b).length);
    };

    const updateQueue = () => {
      const q = offlineStorage.getQueue();
      setQueuedCount(q.length);
    };

    const updateHistory = () => {
      const b = currentUser?.badgeNumber || 'LM-INSP-DEL-4091';
      setHistoryCount(scanHistory.getHistoryByOfficer(b).length);
    };

    updateQueue();
    updateHistory();
    checkAuth();

    window.addEventListener('lmpc_auth_change', checkAuth);
    window.addEventListener('lmpc_history_change', updateHistory);
    const interval = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
      updateQueue();
      updateHistory();
      checkAuth();
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('lmpc_auth_change', checkAuth);
      window.removeEventListener('lmpc_history_change', updateHistory);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    {
      label: "Citizen Mode",
      href: "#citizen",
      onClick: (e) => {
        if (e) e.preventDefault();
        onModeChange('citizen');
      }
    },
    {
      label: "Inspector Mode",
      href: "#inspector",
      onClick: (e) => {
        if (e) e.preventDefault();
        onModeChange('inspector');
      }
    },
    {
      label: "Scan History",
      href: "#history",
      onClick: (e) => {
        if (e) e.preventDefault();
        setHistoryModalOpen(true);
      }
    },
    {
      label: currentUser ? `${currentUser.badgeNumber || 'Officer'}` : "Officer Sign In",
      href: "#auth",
      onClick: (e) => {
        if (e) e.preventDefault();
        setAuthModalOpen(true);
      }
    }
  ];

  return (
    <header className="gov-header-wrapper">
      {/* Top Utility Ribbon */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-content">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <span>राष्ट्रीय विधिक माप विज्ञान एवं उपभोक्ता संरक्षण पोर्टल</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span>National Legal Metrology & Packaged Commodities Regulatory Portal</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} />
              {currentTime}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {isOnline ? (
                <span style={{ color: '#68D391', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Wifi size={12} /> ONLINE
                </span>
              ) : (
                <span style={{ color: '#FC8181', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <WifiOff size={12} /> OFFLINE MODE
                </span>
              )}
            </span>
            {queuedCount > 0 && (
              <button
                onClick={onOpenOfflineQueue}
                style={{
                  background: '#DD6B20',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Database size={11} /> {queuedCount} CACHED
              </button>
            )}

            {/* Statutory Scan History Button */}
            <button
              onClick={() => setHistoryModalOpen(true)}
              style={{
                background: 'rgba(56, 225, 217, 0.12)',
                border: '1px solid rgba(56, 225, 217, 0.35)',
                color: '#38E1D9',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.2s ease'
              }}
              title="View Statutory Scan & Audit History Ledger"
            >
              <History size={11} /> Scan History ({historyCount})
            </button>

            {/* Statutory Authentication Status */}
            {currentUser ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(56, 225, 217, 0.12)',
                border: '1px solid rgba(56, 225, 217, 0.35)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#38E1D9',
                  boxShadow: '0 0 6px #38E1D9'
                }} />
                <User size={12} color="#38E1D9" />
                <span style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.725rem' }}>
                  {currentUser.name} <span style={{ color: '#38E1D9', opacity: 0.85 }}>({currentUser.badgeNumber || 'AUTH'})</span>
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out of Statutory Session"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FC8181',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 2px',
                    marginLeft: '2px'
                  }}
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #38E1D9 0%, #0EA5E9 100%)',
                  color: '#06121E',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(56, 225, 217, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Lock size={11} />
                Officer / Inspector Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Civic Header */}
      <div className="gov-main-header">
        <div className="gov-header-inner">
          <div className="gov-brand">
            <div
              className="gov-emblem"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                padding: '3px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px'
              }}
              title="LMPC Vision - Statutory Compliance Shield"
            >
              <img
                src={shieldLogo}
                alt="LMPC Vision Official Shield Logo"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
            </div>
            <div className="gov-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: '#38E1D9' }}>
                    <VariableFontHoverByLetter
                      label="LMPC"
                      staggerDuration={0.03}
                      fromFontVariationSettings="'wght' 800, 'slnt' 0"
                      toFontVariationSettings="'wght' 900, 'slnt' -10"
                    />
                  </span>
                  <span style={{ color: '#93C5FD' }}>
                    <VariableFontHoverByLetter
                      label="Vision"
                      staggerDuration={0.03}
                      fromFontVariationSettings="'wght' 800, 'slnt' 0"
                      toFontVariationSettings="'wght' 900, 'slnt' -10"
                    />
                  </span>
                  <img
                    src={shieldLogo}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: '22px',
                      height: '22px',
                      objectFit: 'contain',
                      marginLeft: '0.2rem',
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))'
                    }}
                  />
                </h1>
                <span style={{
                  backgroundColor: 'rgba(56, 225, 217, 0.12)',
                  border: '1px solid rgba(56, 225, 217, 0.35)',
                  color: '#A5F3FC',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  textTransform: 'uppercase'
                }}>
                  Govt of India
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.725rem', color: '#CBD5E0', letterSpacing: '0.03em' }}>
                Ministry of Consumer Affairs, Food & Public Distribution • Legal Metrology & FSSAI Division
              </p>
            </div>
          </div>

          {/* Civic Mode PillNav Switcher */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PillNav
              logo={
                <img
                  src={shieldLogo}
                  alt="LMPC Vision Logo"
                  style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                />
              }
              logoAlt="LMPC Vision Logo"
              items={navItems}
              activeHref={currentMode === 'citizen' ? '#citizen' : '#inspector'}
              baseColor="#CBD5E0"
              pillColor="#0A192F"
              hoveredPillTextColor="#1A365D"
              pillTextColor="#1A365D"
            />
          </div>
        </div>
      </div>

      {/* Statutory Cruip Open PRO Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'senior_food_inspector' || user.role === 'junior_food_inspector' || user.role === 'inspector' || user.role === 'fssai') {
            onModeChange('inspector');
          } else {
            onModeChange('citizen');
          }
        }}
      />

      {/* Statutory Scan & Audit History Modal */}
      <ScanHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
    </header>
  );
}

