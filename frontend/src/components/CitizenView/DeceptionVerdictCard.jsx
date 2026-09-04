import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Zap, AlertCircle } from 'lucide-react';
import AnimatedList from '../../AnimatedList';
import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';

export default function DeceptionVerdictCard({ result, slotIndex }) {
  if (!result) return null;

  const {
    product_name,
    brand,
    nutri_grade,
    nutri_score_numeric,
    grade_color,
    verdict_badge,
    headline,
    actionable_advice,
    flags = [],
    critical_flags_count = 0,
    warning_flags_count = 0,
    positive_notes = [],
    fop_claims_detected = [],
    sweeteners_detected = [],
    allergens_detected = [],
    nutrition_summary = {}
  } = result;

  return (
    <div className="civic-card" style={{ borderTop: `4px solid ${grade_color}` }}>
      {/* Product Title & Nutri-Grade Ribbon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span
              style={{
                background: '#1A365D',
                color: '#FFFFFF',
                borderRadius: '2px',
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              PRODUCT #{slotIndex}
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A365D' }}>
              <VariableFontHoverByLetter
                label={product_name}
                staggerDuration={0.02}
                fromFontVariationSettings="'wght' 700, 'slnt' 0"
                toFontVariationSettings="'wght' 900, 'slnt' -10"
              />
            </h3>
          </div>
          {brand && <p style={{ fontSize: '0.8rem', color: '#718096' }}>Brand: {brand}</p>}
        </div>

        {/* Nutri-Grade Traffic Light Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              backgroundColor: grade_color,
              color: '#FFFFFF',
              padding: '0.4rem 0.8rem',
              borderRadius: '2px',
              textAlign: 'center',
              minWidth: '70px'
            }}
          >
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>NUTRI-GRADE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>{nutri_grade}</div>
          </div>
        </div>
      </div>

      {/* Plain-English Health Verdict Summary */}
      <div
        style={{
          backgroundColor: critical_flags_count > 0 ? '#FFF5F5' : '#F0FFF4',
          border: `1px solid ${critical_flags_count > 0 ? '#FEB2B2' : '#9AE6B4'}`,
          padding: '0.85rem 1rem',
          borderRadius: '2px',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          {critical_flags_count > 0 ? (
            <ShieldAlert size={20} color="#C53030" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <CheckCircle size={20} color="#2F855A" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: critical_flags_count > 0 ? '#9B2C2C' : '#22543D' }}>
              {headline}
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#2D3748', marginTop: '0.25rem' }}>
              {actionable_advice}
            </p>
          </div>
        </div>
      </div>

      {/* Detected Front Claims */}
      {fop_claims_detected.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4A5568', textTransform: 'uppercase' }}>
            Front-of-Pack Marketing Claims Audited:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
            {fop_claims_detected.map((claim, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: '#EDF2F7',
                  color: '#2D3748',
                  padding: '2px 8px',
                  borderRadius: '2px',
                  fontSize: '0.75rem',
                  border: '1px solid #CBD5E0'
                }}
              >
                "{claim}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deception Engine Red Flag Breakdown */}
      {flags.length > 0 ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#1A365D',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <AlertTriangle size={15} color="#C53030" />
            <VariableFontHoverByLetter
              label={`Statutory Red Flags & Deception Discrepancies (${flags.length})`}
              staggerDuration={0.015}
              fromFontVariationSettings="'wght' 700, 'slnt' 0"
              toFontVariationSettings="'wght' 900, 'slnt' -10"
            />
          </h4>
          <AnimatedList
            items={flags}
            showGradients={false}
            renderItem={(flag) => (
              <div
                style={{
                  backgroundColor: flag.severity === 'CRITICAL' ? '#FFF5F5' : '#FFFAF0',
                  borderLeft: `4px solid ${flag.severity === 'CRITICAL' ? '#C53030' : '#DD6B20'}`,
                  borderTop: '1px solid #E2E8F0',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: '1px solid #E2E8F0',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: flag.severity === 'CRITICAL' ? '#C53030' : '#DD6B20' }}>
                    {flag.title}
                  </span>
                  <span
                    className={`civic-badge ${flag.severity === 'CRITICAL' ? 'badge-violation' : 'badge-warning'}`}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {flag.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#2D3748', marginBottom: '0.25rem' }}>{flag.description}</p>
                <div style={{ fontSize: '0.72rem', color: '#4A5568', backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.25rem 0.5rem', borderRadius: '2px' }}>
                  <strong>Statutory Ref:</strong> {flag.regulation}
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#F0FFF4',
            border: '1px solid #9AE6B4',
            padding: '0.65rem 0.85rem',
            borderRadius: '2px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle size={16} color="#2F855A" />
          <span style={{ fontSize: '0.8rem', color: '#22543D', fontWeight: 600 }}>
            No deceptive marketing discrepancies detected under FSSAI Advertising Regulations.
          </span>
        </div>
      )}

      {/* Hidden Sweeteners & Allergens */}
      {sweeteners_detected.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#C53030', textTransform: 'uppercase' }}>
            Hidden / Non-Nutritive Sweeteners Disclosed:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
            {sweeteners_detected.map((sw, i) => (
              <span key={i} className="civic-badge badge-violation" style={{ fontSize: '0.7rem' }}>
                {sw.name} ({sw.description})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Table (Per 100g) */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          FSSAI Nutritional Declaration (Per 100g / 100ml)
        </h4>
        <table className="civic-table" style={{ fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th>Energy</th>
              <th>Carbs</th>
              <th>Added Sugar</th>
              <th>Protein</th>
              <th>Sat. Fat</th>
              <th>Trans Fat</th>
              <th>Sodium</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{nutrition_summary.calories_kcal} kcal</strong></td>
              <td>{nutrition_summary.carbs_g}g</td>
              <td style={{ color: nutrition_summary.added_sugars_g > 10 ? '#C53030' : 'inherit', fontWeight: nutrition_summary.added_sugars_g > 10 ? 700 : 400 }}>
                {nutrition_summary.added_sugars_g}g
              </td>
              <td style={{ color: '#2F855A', fontWeight: 600 }}>{nutrition_summary.protein_g}g</td>
              <td>{nutrition_summary.saturated_fat_g}g</td>
              <td>{nutrition_summary.trans_fat_g}g</td>
              <td style={{ color: nutrition_summary.sodium_mg > 400 ? '#DD6B20' : 'inherit' }}>
                {nutrition_summary.sodium_mg}mg
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
