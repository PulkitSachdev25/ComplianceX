import React, { useState, useEffect } from 'react';
import { Shield, Scale, HeartPulse, Wifi, WifiOff, Database, Clock } from 'lucide-react';
import { offlineStorage } from '../utils/offlineStorage';
import GooeyNav from '../GooeyNav';

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
      label: "Citizen Mode (Nutrition & Claims)",
      href: "#citizen",
      onClick: (e) => {
        if (e) e.preventDefault();
        onModeChange('citizen');
      }
    },
    {
      label: "Inspector Mode (Section 36 Enforcement)",
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
            <span>राष्ट्रीय विनियामक एवं उपभोक्ता संरक्षण पोर्टल</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span>National Food Safety & Legal Metrology Regulatory Portal</span>
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
              <h1>भारत सरकार | Government of India</h1>
              <p>Ministry of Consumer Affairs, Food & Public Distribution • FSSAI Division</p>
            </div>
          </div>

          {/* Civic Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <GooeyNav
              items={navItems}
              initialActiveIndex={currentMode === 'citizen' ? 0 : 1}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
