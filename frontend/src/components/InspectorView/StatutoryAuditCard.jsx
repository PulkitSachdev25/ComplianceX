import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, Scale, Calculator, DollarSign } from 'lucide-react';
import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';

export default function StatutoryAuditCard({ auditData }) {
  if (!auditData) return null;

  const {
    is_compliant,
    overall_verdict,
    violations_count = 0,
    violations = [],
    compliant_rules = [],
    usp_math_audit = {},
    statutory_charge_sheet = {},
    commodity_name,
    manufacturer_details = {},
    net_quantity,
    mfg_date,
    mrp
  } = auditData;

  const mfg = manufacturer_details;
  const uspStatus = usp_math_audit.status || 'UNKNOWN';

  return (
    <div className="civic-card" style={{ borderTop: `4px solid ${is_compliant ? '#2F855A' : '#C53030'}` }}>
      {/* Statutory Header & Overall Verdict */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={20} color="#1A365D" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A365D' }}>
              <VariableFontHoverByLetter
                label="Legal Metrology (Packaged Commodities) Statutory Audit"
                staggerDuration={0.015}
                fromFontVariationSettings="'wght' 700, 'slnt' 0"
                toFontVariationSettings="'wght' 900, 'slnt' -10"
              />
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '2px' }}>
            Commodity: <strong>{commodity_name || 'Generic Commodity'}</strong> • Net Qty: <strong>{net_quantity || 'N/A'}</strong> • Declared MRP: <strong>₹{mrp}</strong>
          </p>
        </div>

        <div>
          <span
            className={`civic-badge ${is_compliant ? 'badge-compliant' : 'badge-violation'}`}
            style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
          >
            {is_compliant ? '✓ STATUTORY COMPLIANT' : `⚠ ${violations_count} VIOLATION(S) DETECTED`}
          </span>
        </div>
      </div>

      {/* Unit Sale Price (USP) Math Validation Panel */}
      <div
        style={{
          backgroundColor: uspStatus === 'COMPLIANT' ? '#F0FFF4' : '#FFF5F5',
          border: `1px solid ${uspStatus === 'COMPLIANT' ? '#9AE6B4' : '#FEB2B2'}`,
          padding: '0.85rem 1rem',
          borderRadius: '2px',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1A365D', fontSize: '0.85rem' }}>
            <Calculator size={16} />
            RULE 5: UNIT SALE PRICE (USP) MATHEMATICAL FRAUD AUDIT
          </div>
          <span
            className={`civic-badge ${uspStatus === 'COMPLIANT' ? 'badge-compliant' : 'badge-violation'}`}
            style={{ fontSize: '0.7rem' }}
          >
            {uspStatus}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          <div>
            <span style={{ color: '#718096', display: 'block', fontSize: '0.7rem' }}>Declared / Printed USP:</span>
            <strong>
              {usp_math_audit.declared_usp !== null && usp_math_audit.declared_usp !== undefined
                ? `₹${usp_math_audit.declared_usp} ${usp_math_audit.statutory_unit || ''}`
                : 'NOT PRINTED (Rule 6 Omission)'}
            </strong>
          </div>
          <div>
            <span style={{ color: '#718096', display: 'block', fontSize: '0.7rem' }}>Statutory Calculated USP:</span>
            <strong>
              ₹{usp_math_audit.calculated_usp} {usp_math_audit.statutory_unit || ''}
            </strong>
          </div>
          <div>
            <span style={{ color: '#718096', display: 'block', fontSize: '0.7rem' }}>Formula Applied:</span>
            <code style={{ fontSize: '0.75rem', color: '#1A365D' }}>MRP ÷ Normalized Qty</code>
          </div>
          <div>
            <span style={{ color: '#718096', display: 'block', fontSize: '0.7rem' }}>Math Disparity:</span>
            <strong style={{ color: usp_math_audit.disparity > 0 ? '#C53030' : '#2F855A' }}>
              {usp_math_audit.disparity ? `₹${usp_math_audit.disparity} Deviance` : '₹0.00 (Exact Match)'}
            </strong>
          </div>
        </div>
      </div>

      {/* 6 Mandatory Declarations Breakdown Table */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Rule 6 Mandatory Declarations Checklist
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="civic-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Mandatory Rule</th>
                <th style={{ width: '25%' }}>Declaration Requirement</th>
                <th style={{ width: '40%' }}>Inspected Package Evidence</th>
                <th style={{ width: '20%' }}>Statutory Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Rule 6(1)(a) */}
              <tr>
                <td><strong>Rule 6(1)(a)</strong></td>
                <td>Manufacturer Name, Address & 6-Digit PIN</td>
                <td>
                  {mfg?.name ? `${mfg.name}, ${mfg.address || ''} (PIN: ${mfg.pin_code || 'MISSING'})` : 'Omitted / Illegible'}
                </td>
                <td>
                  {mfg?.name && mfg?.pin_code && /^[1-9][0-9]{5}$/.test(mfg.pin_code) ? (
                    <span className="civic-badge badge-compliant">Compliant</span>
                  ) : (
                    <span className="civic-badge badge-violation">Violation (PIN/Addr)</span>
                  )}
                </td>
              </tr>

              {/* Rule 6(1)(b) */}
              <tr>
                <td><strong>Rule 6(1)(b)</strong></td>
                <td>Generic / Common Commodity Name</td>
                <td>{commodity_name || 'Not Declared'}</td>
                <td>
                  {commodity_name ? (
                    <span className="civic-badge badge-compliant">Compliant</span>
                  ) : (
                    <span className="civic-badge badge-violation">Violation (Omitted)</span>
                  )}
                </td>
              </tr>

              {/* Rule 6(1)(c) */}
              <tr>
                <td><strong>Rule 6(1)(c)</strong></td>
                <td>Net Quantity in Standard SI Units</td>
                <td>{net_quantity || 'Not Declared'}</td>
                <td>
                  {net_quantity ? (
                    <span className="civic-badge badge-compliant">Compliant</span>
                  ) : (
                    <span className="civic-badge badge-violation">Violation</span>
                  )}
                </td>
              </tr>

              {/* Rule 6(1)(d) */}
              <tr>
                <td><strong>Rule 6(1)(d)</strong></td>
                <td>Month & Year of Manufacture/Packing</td>
                <td>{mfg_date || 'Missing Date'}</td>
                <td>
                  {mfg_date ? (
                    <span className="civic-badge badge-compliant">Compliant</span>
                  ) : (
                    <span className="civic-badge badge-violation">Violation</span>
                  )}
                </td>
              </tr>

              {/* Rule 6(1)(e) */}
              <tr>
                <td><strong>Rule 6(1)(e)</strong></td>
                <td>MRP inclusive of all taxes</td>
                <td>₹{mrp}</td>
                <td>
                  {mrp > 0 ? (
                    <span className="civic-badge badge-compliant">Compliant</span>
                  ) : (
                    <span className="civic-badge badge-violation">Violation</span>
                  )}
                </td>
              </tr>

              {/* Rule 6(1)(f) */}
              <tr>
                <td><strong>Rule 6(1)(f)</strong></td>
                <td>Consumer Care Cell (Tel, Email, Address)</td>
                <td>
                  {auditData.consumer_care?.phone || auditData.consumer_care?.email
                    ? `Tel: ${auditData.consumer_care.phone || 'N/A'}, Email: ${auditData.consumer_care.email || 'N/A'}`
                    : 'Missing Grievance Details'}
                </td>
                <td>
                  {auditData.consumer_care?.phone && auditData.consumer_care?.email ? (
                    <span className="civic-badge badge-compliant">Compliant</span>
                  ) : (
                    <span className="civic-badge badge-violation">Violation (Care Cell)</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Charge Sheet & Compounding Penalty */}
      {statutory_charge_sheet && (
        <div style={{ backgroundColor: '#EDF2F7', padding: '0.75rem 1rem', borderRadius: '2px', border: '1px solid #CBD5E0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#4A5568', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Statutory Prosecution Authority:
              </span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A365D' }}>
                {statutory_charge_sheet.section} • {statutory_charge_sheet.prosecution_jurisdiction}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#4A5568', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Assessed Compounding Penalty:
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: statutory_charge_sheet.proposed_compounding_fine_inr > 0 ? '#C53030' : '#2F855A' }}>
                ₹{statutory_charge_sheet.proposed_compounding_fine_inr?.toLocaleString('en-IN') || 0} INR
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
