import React, { useState, useEffect } from 'react';
import { Shield, Scale, HeartPulse, Wifi, WifiOff, Database, Clock } from 'lucide-react';
import { offlineStorage } from '../utils/offlineStorage';
import PillNav from '../PillNav';
import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';

export default function Header({ currentMode, onModeChange, onOpenOfflineQueue }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateQueue = () => {
      const q = offlineStorage.getQueue();
      setQueuedCount(q.length);
    };

    updateQueue();
    const interval = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
      updateQueue();
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    }
  ];

  return (
    <header className="gov-header-wrapper">
      {/* Top Utility Ribbon */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>LMPC Vision | राष्ट्रीय विधिक माप विज्ञान एवं उपभोक्ता संरक्षण पोर्टल</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span>National Legal Metrology & Packaged Commodities Regulatory Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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
          </div>
        </div>
      </div>

      {/* Main Civic Header */}
      <div className="gov-main-header">
        <div className="gov-header-inner">
          <div className="gov-brand">
            <div className="gov-emblem" title="State Emblem of India">
              <Scale size={28} />
            </div>
            <div className="gov-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  <VariableFontHoverByLetter
                    label="LMPC Vision"
                    staggerDuration={0.03}
                    fromFontVariationSettings="'wght' 700, 'slnt' 0"
                    toFontVariationSettings="'wght' 900, 'slnt' -10"
                  />
                </h1>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#E2E8F0',
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
              logo={<Scale size={16} color="#FFFFFF" />}
              logoAlt="Government Emblem"
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
    </header>
  );
}
