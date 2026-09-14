import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InspectorMode from './components/InspectorView/InspectorMode';
import OfflineQueueModal from './components/InspectorView/OfflineQueueModal';
import AnimatedList from './AnimatedList';
import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';
import { authDb } from './utils/authDb';
import { SignInPage } from './components/ui/sign-in';

export default function App() {
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    // Require user authentication before accessing website on each browser session
    const active = sessionStorage.getItem('lmpc_session_active');
    if (!active) {
      return null;
    }
    return authDb.getCurrentUser();
  });

  useEffect(() => {
    const handleAuthChange = () => {
      const active = sessionStorage.getItem('lmpc_session_active');
      setCurrentUser(active ? authDb.getCurrentUser() : null);
    };
    window.addEventListener('lmpc_auth_change', handleAuthChange);
    return () => window.removeEventListener('lmpc_auth_change', handleAuthChange);
  }, []);

  const handleSignIn = (credentials) => {
    setAuthError(null);
    setAuthStatus(null);
    let email = '';
    let password = '';
    let role = undefined;

    if (credentials && typeof credentials === 'object' && credentials.email !== undefined) {
      email = (credentials.email || '').trim();
      password = (credentials.password || '').trim();
      role = credentials.role;
    } else if (credentials && credentials.currentTarget) {
      credentials.preventDefault();
      const formData = new FormData(credentials.currentTarget);
      email = (formData.get('email') || '').toString().trim();
      password = (formData.get('password') || '').toString().trim();
      role = formData.get('role') || undefined;
    }

    if (!email) {
      setAuthError('Please enter your email address or Officer / Packager ID.');
      return;
    }

    const res = authDb.login(email, password, role);
    if (res.success) {
      sessionStorage.setItem('lmpc_session_active', 'true');
      setCurrentUser(res.user);
    } else {
      setAuthError(res.error || 'Failed to sign in.');
    }
  };

  const handleResetPassword = () => {
    setAuthStatus('Password reset instructions have been dispatched to your email address.');
  };

  const handleCreateAccount = (userData) => {
    setAuthError(null);
    setAuthStatus(null);
    const { name, email, password, role, department } = userData || {};

    if (!email) {
      setAuthError('Email address or Officer / Packager ID is required.');
      return;
    }
    if (!name) {
      setAuthError('Full Name is required to register an official account.');
      return;
    }

    const res = authDb.registerUser({
      name,
      email,
      password: password || 'Default@2026',
      role: role || 'senior_inspector',
      department: department || undefined
    });

    if (res.success) {
      sessionStorage.setItem('lmpc_session_active', 'true');
      setCurrentUser(res.user);
    } else {
      setAuthError(res.error || 'Failed to create account.');
    }
  };

  const handleQuickDemo = (role) => {
    setAuthError(null);
    let email = 'senior.inspector@lmpc.gov.in';
    let pass = 'Inspector@2026';
    if (role === 'junior_inspector' || role === 'junior_food_inspector' || role === 'fssai') {
      email = 'junior.inspector@gov.in';
      pass = 'Junior@2026';
    } else if (role === 'packager') {
      email = 'compliance@dabur.com';
      pass = 'Packager@2026';
    } else if (role === 'senior_inspector' || role === 'senior_food_inspector' || role === 'inspector') {
      email = 'senior.inspector@lmpc.gov.in';
      pass = 'Inspector@2026';
    }
    const loginRes = authDb.login(email, pass, role);
    if (loginRes.success) {
      sessionStorage.setItem('lmpc_session_active', 'true');
      setCurrentUser(loginRes.user);
    }
  };

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

  if (!currentUser) {
    return (
      <SignInPage
        onSignIn={handleSignIn}
        onCreateAccount={handleCreateAccount}
        onResetPassword={handleResetPassword}
        onQuickDemo={handleQuickDemo}
        errorMessage={authError}
        statusMessage={authStatus}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-slate)' }}>
      {/* Official Civic Header */}
      <Header
        onOpenOfflineQueue={() => setOfflineModalOpen(true)}
      />

      {/* Main Mode View */}
      <main style={{ flex: 1 }}>
        <InspectorMode currentUser={currentUser} />

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
