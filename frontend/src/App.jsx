import React, { useState } from 'react';
import Header from './components/Header';
import CitizenMode from './components/CitizenView/CitizenMode';
import InspectorMode from './components/InspectorView/InspectorMode';
import OfflineQueueModal from './components/InspectorView/OfflineQueueModal';

export default function App() {
  const [currentMode, setCurrentMode] = useState('citizen'); // default to citizen or inspector
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-slate)' }}>
      {/* Official Civic Header with GooeyNav */}
      <Header
        currentMode={currentMode}
        onModeChange={(mode) => setCurrentMode(mode)}
        onOpenOfflineQueue={() => setOfflineModalOpen(true)}
      />

      {/* Main Mode View */}
      <main style={{ flex: 1 }}>
        {currentMode === 'citizen' ? (
          <CitizenMode />
        ) : (
          <InspectorMode />
        )}
      </main>

      {/* Offline Safety Queue Modal */}
      <OfflineQueueModal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
      />

      {/* Official Government Footer */}
      <footer
        style={{
          backgroundColor: '#1A365D',
          color: '#CBD5E0',
          fontSize: '0.75rem',
          borderTop: '3px solid #CBD5E0',
          padding: '1.5rem 1rem',
          marginTop: '2rem'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.85rem' }}>
              National Food Safety & Legal Metrology Regulatory Portal (भारत सरकार)
            </div>
            <div style={{ marginTop: '0.2rem', color: '#A0AEC0' }}>
              Statutory Enforcement under Food Safety and Standards Act, 2006 & Legal Metrology Act, 2009.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ color: '#E2E8F0' }}>• FSSAI Labelling Regulations 2020</span>
            <span style={{ color: '#E2E8F0' }}>• Packaged Commodities Rules 2011</span>
            <span style={{ color: '#E2E8F0' }}>• Section 36(1) Compounding</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
