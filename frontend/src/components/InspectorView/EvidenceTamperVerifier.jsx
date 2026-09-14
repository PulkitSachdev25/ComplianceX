import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, UploadCloud, FileCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function EvidenceTamperVerifier({ panelHashes = {}, docketId = "GOI-LM-2026-ACTIVE" }) {
  const activeEntries = Object.entries(panelHashes).filter(([k, v]) => Boolean(v));
  
  const [selectedPanel, setSelectedPanel] = useState(activeEntries[0]?.[0] || 'panel_1');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [computedHash, setComputedHash] = useState(null);
  const [isHashing, setIsHashing] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // 'MATCH' | 'TAMPERED' | null

  const targetExpectedHash = panelHashes[selectedPanel] || "";

  // Compute raw byte-level SHA-256 directly in browser using Web Crypto API
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsHashing(true);
    setVerificationResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Also check dataUrl string hash in case docket stored dataUrl digest
      const reader = new FileReader();
      const dataUrlPromise = new Promise((resolve) => {
        reader.onload = (evt) => resolve(evt.target?.result);
        reader.readAsDataURL(file);
      });
      const dataUrl = await dataUrlPromise;
      const dataUrlHashBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataUrl || ''));
      const dataUrlHashHex = Array.from(new Uint8Array(dataUrlHashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

      const isMatch = (targetExpectedHash && (
        hashHex.toLowerCase() === targetExpectedHash.toLowerCase() ||
        dataUrlHashHex.toLowerCase() === targetExpectedHash.toLowerCase()
      ));

      if (isMatch) {
        setComputedHash(dataUrlHashHex.toLowerCase() === targetExpectedHash.toLowerCase() ? dataUrlHashHex : hashHex);
        setVerificationResult('MATCH');
      } else {
        setComputedHash(hashHex);
        setVerificationResult('TAMPERED');
      }
    } catch (err) {
      console.error("Client SHA-256 calculation failed:", err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleSimulateTamper = () => {
    if (!targetExpectedHash) return;
    // Corrupt one character of the hash to visually demonstrate tamper detection
    const fakeCorruptedHash = targetExpectedHash.slice(0, -4) + (targetExpectedHash.slice(-4) === "aaaa" ? "bbbb" : "aaaa");
    setComputedHash(fakeCorruptedHash);
    setVerificationResult('TAMPERED');
  };

  const handleReset = () => {
    setUploadedFile(null);
    setComputedHash(null);
    setVerificationResult(null);
  };

  if (activeEntries.length === 0) return null;

  return (
    <div className="civic-card" style={{ marginTop: '1.5rem', borderLeft: '4px solid #1A365D', backgroundColor: '#FFFFFF' }}>
      <div className="civic-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck color="#1A365D" size={18} />
          <span className="civic-card-title" style={{ fontWeight: 700, color: '#1A365D', fontSize: '0.9rem' }}>
            Court Evidentiary Verification & Tamper Detection Portal (Sec 63 BSA)
          </span>
        </div>
        <span className="civic-badge badge-compliant" style={{ fontSize: '0.7rem' }}>
          Real-Time Judicial Verification
        </span>
      </div>

      <p style={{ fontSize: '0.78rem', color: '#4A5568', margin: '0.5rem 0 1rem 0' }}>
        Verify electronic evidence submitted in court against the tamper-proof hash ledger locked in Docket <strong>{docketId}</strong>. Upload the evidentiary frame to verify byte-level mathematical authenticity.
      </p>

      {/* Target Panel Selector */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1A365D' }}>Select Verified Panel:</label>
        <select
          value={selectedPanel}
          onChange={(e) => {
            setSelectedPanel(e.target.value);
            handleReset();
          }}
          style={{ padding: '0.35rem 0.65rem', borderRadius: '3px', border: '1px solid #CBD5E0', fontSize: '0.8rem', color: '#1A365D', fontWeight: 600 }}
        >
          {activeEntries.map(([k], idx) => (
            <option key={k} value={k}>
              Panel {idx + 1} ({k.replace('_', ' ').toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Locked Docket Reference Hash */}
      <div style={{ backgroundColor: '#F7FAFC', border: '1px solid #E2E8F0', padding: '0.65rem 0.85rem', borderRadius: '3px', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#718096', fontWeight: 600 }}>LOCKED DOCKET HASH (FROM SEIZURE REPORT):</div>
        <div className="mono-hash" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1A365D', wordBreak: 'break-all', marginTop: '2px' }}>
          {targetExpectedHash || "NO RECORD REGISTERED"}
        </div>
      </div>

      {/* File Upload Zone & Simulation Trigger */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label
          className="civic-btn civic-btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.45rem 0.95rem', fontSize: '0.78rem' }}
        >
          <UploadCloud size={15} />
          <span>{uploadedFile ? uploadedFile.name : "Upload Evidence File to Test"}</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        <button
          type="button"
          className="civic-btn civic-btn-outline"
          onClick={handleSimulateTamper}
          style={{ fontSize: '0.78rem', padding: '0.45rem 0.95rem', color: '#C53030', borderColor: '#FEB2B2', backgroundColor: '#FFF5F5', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <AlertTriangle size={14} style={{ marginRight: '4px' }} />
          Simulate 1-Pixel Evidence Tampering
        </button>

        {verificationResult && (
          <button
            type="button"
            onClick={handleReset}
            style={{ border: 'none', background: 'none', color: '#718096', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <RefreshCw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Real-time Verdict Output Banner */}
      {isHashing && (
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#718096' }}>
          Calculating SHA-256 hash stream...
        </div>
      )}

      {verificationResult === 'MATCH' && (
        <div
          style={{
            marginTop: '1rem',
            backgroundColor: '#F0FFF4',
            border: '1px solid #9AE6B4',
            borderRadius: '3px',
            padding: '0.85rem 1rem',
            color: '#22543D'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <CheckCircle2 color="#2F855A" size={18} />
            <span>CRYPTOGRAPHIC INTEGRITY VERIFIED: PRISTINE EVIDENCE</span>
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#276749' }}>
            Calculated File Digest: <strong className="mono-hash">{computedHash}</strong>
          </div>
          <div style={{ fontSize: '0.72rem', marginTop: '0.3rem', color: '#2F855A' }}>
            ✓ Image is mathematically identical to initial capture down to the byte. Fully admissible under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.
          </div>
        </div>
      )}

      {verificationResult === 'TAMPERED' && (
        <div
          style={{
            marginTop: '1rem',
            backgroundColor: '#FFF5F5',
            border: '1px solid #FEB2B2',
            borderRadius: '3px',
            padding: '0.85rem 1rem',
            color: '#C53030'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <ShieldAlert color="#C53030" size={18} />
            <span>TAMPER DETECTED: EVIDENCE INADMISSIBLE IN COURT</span>
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#9B2C2C' }}>
            Calculated File Digest: <strong className="mono-hash">{computedHash}</strong>
          </div>
          <div style={{ fontSize: '0.72rem', marginTop: '0.3rem', color: '#C53030' }}>
            ⚠ SHA-256 digest divergence detected! The submitted file has been modified or edited post-seizure. Electronic record rejected under Section 63(4) BSA, 2023.
          </div>
        </div>
      )}
    </div>
  );
}
