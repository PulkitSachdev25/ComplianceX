import React, { useState } from 'react';
import Header from './components/Header';
import CitizenMode from './components/CitizenView/CitizenMode';
import InspectorMode from './components/InspectorView/InspectorMode';
import OfflineQueueModal from './components/InspectorView/OfflineQueueModal';
import AnimatedList from './AnimatedList';
import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';

export default function App() {
  const [currentMode, setCurrentMode] = useState('citizen'); // default to citizen or inspector
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);

  const complianceRules = [
    'Rule 6(1)(a) – Manufacturer / Packer Address & Mandatory 6-Digit PIN',
    'Rule 6(1)(b) – Generic Commodity Common Name Verification',
    'Rule 6(1)(c) – Strict SI Metric Unit Enforcement (Rejects gms, gm, ml.)',
    'Rule 6(1)(d) – Month & Year of Manufacture / Pre-packing / Import',
    'Rule 6(1)(e) – Maximum Retail Price (MRP) "Inclusive of all taxes"',
    '2021 Second Amendment – Mandatory Unit Sale Price (USP) for packs > 1kg / 1L',
    'FSSAI Regulation 2020 – Deceptive Front-of-Pack Nutritional Claims',
    'Section 36(1) Compounding – Statutory Legal Metrology Liability Notices',
    'Rule 7 & Table 1 – Principal Display Panel (PDP) Numeral Font Height Standards'
  ];

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

        {/* Live Statutory Checklist using AnimatedList */}
        <section style={{ maxWidth: '1280px', margin: '2.5rem auto 1rem', padding: '0 1rem', width: '100%' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '1.5rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ borderBottom: '1px solid #EDF2F7', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A365D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📋</span>
                <VariableFontHoverByLetter
                  label="Statutory Rule & Verification Matrix"
                  staggerDuration={0.02}
                  fromFontVariationSettings="'wght' 700, 'slnt' 0"
                  toFontVariationSettings="'wght' 900, 'slnt' -10"
                />
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#718096', margin: '0.25rem 0 0' }}>
                Interactive scroll-animated statutory checklist powered by <strong>AnimatedList</strong>. Use arrow keys (<kbd>↑</kbd> <kbd>↓</kbd>) or click items to inspect.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AnimatedList
                items={complianceRules}
                onItemSelect={(item, index) => console.log('Selected statutory rule:', item, index)}
                showGradients={true}
                enableArrowNavigation={true}
                displayScrollbar={true}
              />
            </div>
          </div>
        </section>
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
              LMPC Vision – Legal Metrology & Packaged Commodities Regulatory Portal (भारत सरकार)
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
