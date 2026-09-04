import React, { useState, useEffect } from 'react';
import { Sliders, Search, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import ProductUploadCard from './ProductUploadCard';
import DeceptionVerdictCard from './DeceptionVerdictCard';
import ComparisonMatrix from './ComparisonMatrix';
import { AnimatedItem } from '../../AnimatedList';
import GooeyNav from '../../GooeyNav';

export default function CitizenMode({ 
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://compliancex.onrender.com' 
}) {
  const [productCount, setProductCount] = useState(2);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Products state array (up to 3 items)
  const [productsData, setProductsData] = useState([
    {
      product_id: 'prod_1',
      preset_key: 'zero_sugar_juice',
      front_image_b64: null,
      back_image_b64: null,
      manual_data: null
    },
    {
      product_id: 'prod_2',
      preset_key: 'atta_cookies',
      front_image_b64: null,
      back_image_b64: null,
      manual_data: null
    },
    {
      product_id: 'prod_3',
      preset_key: 'protein_bar',
      front_image_b64: null,
      back_image_b64: null,
      manual_data: null
    }
  ]);

  const [analysisResults, setAnalysisResults] = useState(null);

  // Fetch presets on mount
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/presets/citizen`)
      .then((res) => res.json())
      .then((data) => {
        if (data.presets) {
          setPresets(data.presets);
        }
      })
      .catch((err) => console.error('Failed to load presets:', err));
  }, [apiBaseUrl]);

  // Adjust product count via slider
  const handleSliderChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setProductCount(count);
  };

  const handleProductChange = (index, updatedItem) => {
    const updated = [...productsData];
    updated[index] = updatedItem;
    setProductsData(updated);
  };

  const handleApplyPreset = (index, presetKey) => {
    const selectedPreset = presets.find((p) => p.key === presetKey);
    const updated = [...productsData];
    updated[index] = {
      product_id: `prod_${index + 1}`,
      preset_key: presetKey || null,
      front_image_b64: null,
      back_image_b64: null,
      manual_data: selectedPreset ? { ...selectedPreset.preview } : null
    };
    setProductsData(updated);
  };

  // Run Gemini Nutrition & Deception Analysis
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeProducts = productsData.slice(0, productCount).map((p, idx) => ({
        product_id: `prod_${idx + 1}`,
        preset_key: p.preset_key,
        front_image_b64: p.front_image_b64,
        back_image_b64: p.back_image_b64,
        manual_data: p.manual_data
      }));

      const res = await fetch(`${apiBaseUrl}/api/citizen/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: activeProducts })
      });

      if (!res.ok) {
        throw new Error(`Analysis failed with status ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResults(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze products. Please check the backend connection or test presets.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run initial analysis on first load
  useEffect(() => {
    runAnalysis();
  }, [productCount]);

  return (
    <div className="civic-container">
      {/* Banner */}
      <div className="civic-section-banner">
        <div>
          <div className="banner-title">
            <Sparkles size={20} />
            Citizen Food Safety & Nutritional Deception Scanner
          </div>
          <div className="banner-desc">
            Cross-checks front-of-pack marketing claims against back-of-pack ingredients under FSSAI Advertising Regulations. Compare 1 to 3 items side-by-side.
          </div>
        </div>

        {/* Product Comparison GooeyNav Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#1A365D' }}>
            <Sliders size={15} />
            Compare Products:
          </div>
          <GooeyNav
            items={[
              {
                label: "1 Product",
                href: "#single",
                onClick: (e) => {
                  if (e) e.preventDefault();
                  setProductCount(1);
                }
              },
              {
                label: "2 Products (Side-by-Side)",
                href: "#compare2",
                onClick: (e) => {
                  if (e) e.preventDefault();
                  setProductCount(2);
                }
              },
              {
                label: "3 Multi-Compare",
                href: "#compare3",
                onClick: (e) => {
                  if (e) e.preventDefault();
                  setProductCount(3);
                }
              }
            ]}
            initialActiveIndex={productCount - 1}
          />
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', padding: '0.75rem 1rem', borderRadius: '2px', color: '#C53030', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Product Upload / Camera Modules Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${productCount}, 1fr)`,
          gap: '1.25rem',
          marginBottom: '1.25rem'
        }}
      >
        {productsData.slice(0, productCount).map((p, idx) => (
          <ProductUploadCard
            key={idx}
            slotIndex={idx + 1}
            productData={p}
            presets={presets}
            onChange={(updated) => handleProductChange(idx, updated)}
            onApplyPreset={handleApplyPreset}
            disabled={loading}
          />
        ))}
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
        <button
          className="civic-btn civic-btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          onClick={runAnalysis}
          disabled={loading}
          id="btn-run-citizen-analysis"
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Running Gemini FSSAI Deception Engine...
            </>
          ) : (
            <>
              <Search size={18} />
              Analyze {productCount} {productCount === 1 ? 'Product' : 'Products'} for Deceptive Claims
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Display */}
      {analysisResults && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ borderBottom: '2px solid #1A365D', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase' }}>
              Statutory Nutrition Verdicts & Plain-English Red Flags
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${productCount}, 1fr)`,
              gap: '1.25rem'
            }}
          >
            {analysisResults.products.map((res, idx) => (
              <AnimatedItem key={idx} index={idx} delay={idx * 0.1}>
                <DeceptionVerdictCard result={res} slotIndex={idx + 1} />
              </AnimatedItem>
            ))}
          </div>

          {/* Multi-Product Comparison Matrix */}
          {productCount > 1 && (
            <ComparisonMatrix
              comparison={analysisResults.comparison}
              products={analysisResults.products}
            />
          )}
        </div>
      )}
    </div>
  );
}
