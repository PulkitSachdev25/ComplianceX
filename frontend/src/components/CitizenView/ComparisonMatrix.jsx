import React from 'react';
import { Award, AlertCircle, ArrowRight } from 'lucide-react';

export default function ComparisonMatrix({ comparison, products }) {
  if (!comparison || !products || products.length < 2) return null;

  return (
    <div className="civic-card" style={{ marginTop: '1.5rem', border: '1px solid #1A365D' }}>
      <div className="civic-card-header" style={{ backgroundColor: '#EDF2F7', margin: '-1.25rem -1.25rem 1rem -1.25rem', padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} color="#1A365D" />
          <span className="civic-card-title" style={{ margin: 0 }}>
            Side-by-Side Product Comparison Matrix ({products.length} Products)
          </span>
        </div>
        <span className="civic-badge badge-neutral" style={{ fontSize: '0.7rem' }}>
          FSSAI Multi-Product Comparative Benchmark
        </span>
      </div>

      {/* Summary Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ backgroundColor: '#F0FFF4', border: '1px solid #9AE6B4', padding: '0.65rem', borderRadius: '2px' }}>
          <span style={{ fontSize: '0.7rem', color: '#22543D', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Healthiest Profile
          </span>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2F855A', marginTop: '0.15rem' }}>
            {comparison.best_nutri_grade_product}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', padding: '0.65rem', borderRadius: '2px' }}>
          <span style={{ fontSize: '0.7rem', color: '#9B2C2C', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Least Deceptive Marketing
          </span>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C53030', marginTop: '0.15rem' }}>
            {comparison.least_deceptive_product}
          </div>
        </div>
      </div>

      {/* Comparative Data Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="civic-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Comparative Metric</th>
              {products.map((p, i) => (
                <th key={i} style={{ textAlign: 'center' }}>
                  Product #{i + 1}: {p.product_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Nutri-Grade</strong></td>
              {products.map((p, i) => (
                <td key={i} style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      backgroundColor: p.grade_color,
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    Grade {p.nutri_grade}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Energy (Calories)</strong></td>
              {products.map((p, i) => (
                <td key={i} style={{ textAlign: 'center' }}>
                  {p.nutrition_summary.calories_kcal} kcal / 100g
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Added Sugars</strong></td>
              {products.map((p, i) => (
                <td
                  key={i}
                  style={{
                    textAlign: 'center',
                    color: p.nutrition_summary.added_sugars_g > 10 ? '#C53030' : 'inherit',
                    fontWeight: p.nutrition_summary.added_sugars_g > 10 ? 700 : 400
                  }}
                >
                  {p.nutrition_summary.added_sugars_g}g / 100g
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Protein Density</strong></td>
              {products.map((p, i) => (
                <td key={i} style={{ textAlign: 'center', color: '#2F855A', fontWeight: 600 }}>
                  {p.nutrition_summary.protein_g}g / 100g
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Saturated Fat</strong></td>
              {products.map((p, i) => (
                <td key={i} style={{ textAlign: 'center' }}>
                  {p.nutrition_summary.saturated_fat_g}g / 100g
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Sodium</strong></td>
              {products.map((p, i) => (
                <td key={i} style={{ textAlign: 'center' }}>
                  {p.nutrition_summary.sodium_mg}mg / 100g
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Deceptive Claims Flagged</strong></td>
              {products.map((p, i) => (
                <td key={i} style={{ textAlign: 'center' }}>
                  {p.critical_flags_count > 0 ? (
                    <span className="civic-badge badge-violation">
                      {p.critical_flags_count} Misleading Claim(s)
                    </span>
                  ) : (
                    <span className="civic-badge badge-compliant">
                      Zero Deceptions
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
