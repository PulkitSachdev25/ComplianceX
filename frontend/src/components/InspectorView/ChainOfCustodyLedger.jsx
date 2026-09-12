import React from 'react';
import { Lock, MapPin, Hash, CheckCircle2, ShieldCheck, UserCheck, Layers } from 'lucide-react';

const PANEL_NAME_MAP = {
  front: '1. Front Panel',
  back: '2. Back / Address Panel',
  top: '3. Top / MRP Stamp',
  bottom: '4. Bottom / Barcode',
  panel_1: '1. Front Panel',
  panel_2: '2. Back / Address Panel',
  panel_3: '3. Top / MRP Stamp',
  panel_4: '4. Bottom / Barcode',
  panel_5: '5. Side Panel A',
  panel_6: '6. Side Panel B'
};

export default function ChainOfCustodyLedger({ auditData, geolocation }) {
  if (!auditData) return null;

  const {
    docket_id,
    timestamp_utc,
    inspector_id = 'LM-INSP-DEL-4091',
    panel_hashes = {},
    total_panels_hashed,
    merkle_root,
    raw_merkle_root,
    master_evidence_sha256,
    evidentiary_standard,
    statutory_evidence_clause
  } = auditData;

  const lat = geolocation?.latitude || auditData.gps_coordinates?.latitude || auditData.geolocation?.latitude || 28.6139;
  const lon = geolocation?.longitude || auditData.gps_coordinates?.longitude || auditData.geolocation?.longitude || 77.2090;
  const locationName = geolocation?.display_name || auditData.gps_coordinates?.formatted_address || auditData.geolocation?.display_name || 'Ministry of Consumer Affairs, New Delhi';

  const hashEntries = Object.entries(panel_hashes);
  const panelCount = total_panels_hashed || hashEntries.length || 0;

  return (
    <div className="civic-card">
      <div className="civic-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} color="#1A365D" />
          <span className="civic-card-title">Section 63 BSA / 65B Cryptographic Chain of Custody</span>
        </div>
        <span className="civic-badge badge-compliant" style={{ fontSize: '0.7rem' }}>
          <ShieldCheck size={12} /> {panelCount}-Leaf Merkle Sealed
        </span>
      </div>

      {/* Geolocation & Officer Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F7FAFC', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '2px' }}>
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
            <Layers size={12} /> Evidentiary Panels:
          </span>
          <strong style={{ fontSize: '0.85rem', color: '#2D3748' }}>{panelCount} Panel(s) Hashed</strong>
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={12} /> Geolocation:
          </span>
          <strong style={{ fontSize: '0.8rem', color: '#2D3748' }}>
            {Number(lat).toFixed(4)}° N, {Number(lon).toFixed(4)}° E
          </strong>
          <div style={{ fontSize: '0.68rem', color: '#718096', marginTop: '1px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {locationName}
          </div>
        </div>
      </div>

      {/* Dynamic Panels SHA-256 Hash Ledger */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Forensic Panel SHA-256 Hashes ({panelCount} Leaves)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {hashEntries.map(([panelKey, hashVal], idx) => {
            const displayName = PANEL_NAME_MAP[panelKey.toLowerCase()] || `Panel ${idx + 1}: ${panelKey.toUpperCase()}`;
            return (
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
                  {displayName}
                </div>
                <div className="mono-hash" style={{ fontSize: '0.68rem', marginTop: '2px', wordBreak: 'break-all' }}>
                  {hashVal || 'No Hash Generated'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Merkle Root & Master Digest */}
      <div style={{ backgroundColor: '#EDF2F7', padding: '0.65rem 0.85rem', borderRadius: '2px', borderLeft: '4px solid #1A365D' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase' }}>
          Master Cryptographic Merkle Root (Digital Seal)
        </div>
        <div className="mono-hash" style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '2px', wordBreak: 'break-all' }}>
          {master_evidence_sha256 || merkle_root || raw_merkle_root || 'N/A'}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#718096', marginTop: '0.35rem' }}>
          {statutory_evidence_clause || evidentiary_standard || 'Certified under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.'}
        </div>
      </div>
    </div>
  );
}
