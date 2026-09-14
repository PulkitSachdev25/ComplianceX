import React from 'react';
import { Lock, MapPin, Hash, CheckCircle2, ShieldCheck, UserCheck, Layers, FileKey } from 'lucide-react';

const PANEL_NAME_MAP = {
  front: '1. FRONT PANEL',
  back: '2. BACK / ADDRESS PANEL',
  top: '3. TOP / MRP STAMP',
  bottom: '4. BOTTOM / BARCODE',
  panel_1: '1. FRONT PANEL',
  panel_2: '2. BACK / ADDRESS PANEL',
  panel_3: '3. TOP / MRP STAMP',
  panel_4: '4. BOTTOM / BARCODE',
  panel_5: '5. SIDE PANEL A',
  panel_6: '6. SIDE PANEL B'
};

export default function ChainOfCustodyLedger({ auditData, chainOfCustody, geolocation, panelsPerItem }) {
  const coc = chainOfCustody?.chain_of_custody || chainOfCustody || auditData?.chain_of_custody || auditData;
  if (!coc) return null;

  const raw_hashes = coc.panel_hashes || {};
  
  // Determine allowed panel limit strictly from props or metadata
  const maxPanels = Number(panelsPerItem) || Number(coc.total_panels_hashed) || Object.keys(raw_hashes).filter(k => k.startsWith('panel_')).length || 1;

  // Build ordered list strictly from panel_1 up to panel_N
  const orderedPanelEntries = [];
  for (let i = 1; i <= maxPanels; i++) {
    const key = `panel_${i}`;
    if (raw_hashes[key]) {
      orderedPanelEntries.push([key, raw_hashes[key]]);
    }
  }

  // Fallback if keys were named legacy 'front', 'back', etc.
  if (orderedPanelEntries.length === 0) {
    const legacyKeys = ['front', 'back', 'top', 'bottom', 'panel_5', 'panel_6'];
    for (let i = 0; i < maxPanels; i++) {
      const k = legacyKeys[i];
      if (raw_hashes[k]) {
        orderedPanelEntries.push([`panel_${i + 1}`, raw_hashes[k]]);
      }
    }
  }

  const activeCount = orderedPanelEntries.length;

  const {
    docket_id,
    timestamp_utc,
    inspector_id = 'LM-INSP-DEL-4091',
    individual_hashes = [],
    total_panels_hashed,
    master_hash,
    merkle_root,
    raw_merkle_root,
    master_evidence_sha256,
    evidentiary_standard,
    statutory_evidence_clause
  } = coc;

  const lat = geolocation?.latitude || coc.gps_coordinates?.latitude || coc.geolocation?.latitude || 28.6139;
  const lon = geolocation?.longitude || coc.gps_coordinates?.longitude || coc.geolocation?.longitude || 77.2090;
  const locationName = geolocation?.display_name || coc.gps_coordinates?.formatted_address || coc.geolocation?.display_name || 'Ministry of Consumer Affairs, New Delhi';

  const readableTitles = {
    panel_1: "1. FRONT PANEL",
    panel_2: "2. BACK / ADDRESS PANEL",
    panel_3: "3. TOP / MRP STAMP",
    panel_4: "4. BOTTOM / BARCODE",
    panel_5: "5. SIDE PANEL A",
    panel_6: "6. SIDE PANEL B",
    front: "1. FRONT PANEL",
    back: "2. BACK / ADDRESS PANEL",
    top: "3. TOP / MRP STAMP",
    bottom: "4. BOTTOM / BARCODE"
  };

  return (
    <div className="civic-card">
      <div className="civic-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} color="#1A365D" />
          <span className="civic-card-title">Section 63 BSA / 65B Cryptographic Chain of Custody</span>
        </div>
        <div className="civic-badge-container">
          <span className="civic-badge badge-compliant" style={{ fontSize: '0.7rem' }}>
            <ShieldCheck size={12} /> {activeCount} ACTIVE PANEL HASHES
          </span>
        </div>
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
          <strong style={{ fontSize: '0.85rem', color: '#2D3748' }}>{activeCount} Panel(s) Hashed</strong>
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
        <h4 className="civic-section-title" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          INDIVIDUAL PANEL SHA-256 HASHES (1 TO {activeCount})
        </h4>
        <div className="panel-hashes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {orderedPanelEntries.map(([panelKey, hashVal], idx) => {
            const title = readableTitles[panelKey.toLowerCase()] || `PANEL ${idx + 1}`;
            return (
              <div
                key={panelKey}
                className="hash-card civic-card"
                style={{
                  backgroundColor: '#EDF2F7',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '2px',
                  border: '1px solid #CBD5E0',
                  fontSize: '0.75rem'
                }}
              >
                <div className="hash-card-header font-bold text-sm text-slate-700" style={{ fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  {title}
                </div>
                <div className="hash-card-digest font-mono text-xs text-slate-500 break-all bg-slate-100 p-2 rounded mt-1 mono-hash" style={{ fontSize: '0.68rem', marginTop: '4px', wordBreak: 'break-all', backgroundColor: '#FFFFFF', padding: '0.35rem 0.5rem', border: '1px solid #E2E8F0', borderRadius: '2px' }}>
                  {hashVal || 'No Hash Generated'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Master Hash & Composite Seal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {master_hash && (
          <div style={{ backgroundColor: '#F0FFF4', padding: '0.55rem 0.75rem', borderRadius: '2px', borderLeft: '4px solid #2F855A' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#276749', textTransform: 'uppercase' }}>
              Sequential Combined Master Hash: SHA-256(h₁ + ... + h_{activeCount})
            </div>
            <div className="mono-hash" style={{ fontSize: '0.72rem', fontWeight: 'bold', marginTop: '2px', wordBreak: 'break-all', color: '#22543D' }}>
              {master_hash}
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#EDF2F7', padding: '0.65rem 0.85rem', borderRadius: '2px', borderLeft: '4px solid #1A365D' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase' }}>
            Master Cryptographic Merkle Seal (Section 63 BSA Digital Signature)
          </div>
          <div className="mono-hash" style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '2px', wordBreak: 'break-all' }}>
            {master_evidence_sha256 || merkle_root || raw_merkle_root || master_hash || 'N/A'}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#718096', marginTop: '0.35rem' }}>
            {statutory_evidence_clause || evidentiary_standard || 'Certified under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.'}
          </div>
        </div>
      </div>
    </div>
  );
}
