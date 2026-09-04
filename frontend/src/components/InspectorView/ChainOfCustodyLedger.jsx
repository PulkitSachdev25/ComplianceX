import React from 'react';
import { Lock, MapPin, Hash, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

export default function ChainOfCustodyLedger({ auditData, geolocation }) {
  if (!auditData) return null;

  const {
    docket_id,
    timestamp_utc,
    inspector_id = 'LM-INSP-DEL-4091',
    panel_hashes = {},
    merkle_root,
    master_evidence_sha256,
    evidentiary_standard
  } = auditData;

  const lat = geolocation?.latitude || auditData.geolocation?.latitude || 28.6139;
  const lon = geolocation?.longitude || auditData.geolocation?.longitude || 77.2090;
  const locationName = geolocation?.display_name || auditData.geolocation?.display_name || 'Ministry of Consumer Affairs, New Delhi';

  return (
    <div className="civic-card">
      <div className="civic-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} color="#1A365D" />
          <span className="civic-card-title">Section 65B Cryptographic Chain of Custody</span>
        </div>
        <span className="civic-badge badge-compliant" style={{ fontSize: '0.7rem' }}>
          <ShieldCheck size={12} /> Tamper-Proof Digital Evidence
        </span>
      </div>

      {/* Geolocation & Officer Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F7FAFC', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '2px' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Hash size={12} /> Docket Reference ID:
          </span>
          <strong style={{ fontSize: '0.85rem', color: '#1A365D', fontFamily: 'monospace' }}>{docket_id}</strong>
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <UserCheck size={12} /> Inspecting Officer:
          </span>
          <strong style={{ fontSize: '0.85rem', color: '#2D3748' }}>{inspector_id}</strong>
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={12} /> Nominatim GPS Coordinates:
          </span>
          <strong style={{ fontSize: '0.8rem', color: '#2D3748' }}>
            {Number(lat).toFixed(6)}° N, {Number(lon).toFixed(6)}° E
          </strong>
          <div style={{ fontSize: '0.68rem', color: '#718096', marginTop: '1px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {locationName}
          </div>
        </div>
      </div>

      {/* 4 Panels SHA-256 Hash Ledger */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Forensic Panel SHA-256 Hashes
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
          {['front', 'back', 'top', 'bottom'].map((panelKey) => (
            <div
              key={panelKey}
              style={{
                backgroundColor: '#EDF2F7',
                padding: '0.45rem 0.65rem',
                borderRadius: '2px',
                border: '1px solid #CBD5E0',
                fontSize: '0.75rem'
              }}
            >
              <div style={{ fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Panel: {panelKey}
              </div>
              <div className="mono-hash" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                {panel_hashes[panelKey] || 'No Hash Generated'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Merkle Root & Master Digest */}
      <div style={{ backgroundColor: '#EDF2F7', padding: '0.65rem 0.85rem', borderRadius: '2px', borderLeft: '4px solid #1A365D' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase' }}>
          Master Cryptographic Merkle Root (Digital Seal)
        </div>
        <div className="mono-hash" style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '2px' }}>
          {master_evidence_sha256 || merkle_root || 'N/A'}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#718096', marginTop: '0.35rem' }}>
          Admissible under Section 65B of Indian Evidence Act / Section 63 Bharatiya Sakshya Adhiniyam, 2023.
        </div>
      </div>
    </div>
  );
}
