import React, { useRef, useState } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, RefreshCw, Sparkles, ChevronDown, Video } from 'lucide-react';
import CitizenCameraModal from './CitizenCameraModal';

export default function ProductUploadCard({
  slotIndex,
  productData,
  presets,
  onChange,
  onApplyPreset,
  disabled
}) {
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [initialCameraPanel, setInitialCameraPanel] = useState('front');

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ ...productData, [field]: reader.result, preset_key: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (panelKey, dataUrl) => {
    const field = panelKey === 'front' ? 'front_image_b64' : 'back_image_b64';
    onChange({
      ...productData,
      [field]: dataUrl,
      preset_key: null
    });
  };

  const openCamera = (panel = 'front') => {
    setInitialCameraPanel(panel);
    setCameraModalOpen(true);
  };

  return (
    <div className="civic-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="civic-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              background: '#1A365D',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          >
            {slotIndex}
          </span>
          <span className="civic-card-title">Product #{slotIndex} Formulation</span>
        </div>

        {/* Quick Test Preset Selector */}
        <select
          className="civic-select"
          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          value={productData.preset_key || ''}
          onChange={(e) => onApplyPreset(slotIndex - 1, e.target.value)}
          disabled={disabled}
        >
          <option value="">-- Load Standard Test Package --</option>
          {presets.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name} ({p.tag})
            </option>
          ))}
        </select>
      </div>

      {/* Front & Back Dual Capture Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
        {/* Front Panel (Marketing Claims) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1A365D' }}>
              Front of Pack (Claims)
            </label>
            <button
              type="button"
              onClick={() => openCamera('front')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2B6CB0',
                fontSize: '0.68rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: 600
              }}
            >
              <Camera size={11} /> Live Camera
            </button>
          </div>
          <div
            onClick={() => openCamera('front')}
            style={{
              border: '2px dashed var(--border-medium)',
              backgroundColor: '#FAFAFA',
              height: '110px',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {productData.front_image_b64 ? (
              <img
                src={productData.front_image_b64}
                alt="Front Panel"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <Camera size={20} color="#718096" />
                <span style={{ fontSize: '0.7rem', color: '#718096', marginTop: '0.25rem' }}>
                  Live Camera / Upload Front
                </span>
              </>
            )}
            <input
              type="file"
              ref={frontInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, 'front_image_b64')}
            />
          </div>
          <button
            type="button"
            className="civic-btn civic-btn-outline"
            style={{ width: '100%', marginTop: '0.35rem', padding: '0.2rem 0.4rem', fontSize: '0.68rem' }}
            onClick={(e) => {
              e.stopPropagation();
              frontInputRef.current?.click();
            }}
          >
            <Upload size={11} /> Upload File
          </button>
        </div>

        {/* Back Panel (Nutrition & Ingredients) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1A365D' }}>
              Back of Pack (Nutrition / Ing.)
            </label>
            <button
              type="button"
              onClick={() => openCamera('back')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2B6CB0',
                fontSize: '0.68rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: 600
              }}
            >
              <Camera size={11} /> Live Camera
            </button>
          </div>
          <div
            onClick={() => openCamera('back')}
            style={{
              border: '2px dashed var(--border-medium)',
              backgroundColor: '#FAFAFA',
              height: '110px',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {productData.back_image_b64 ? (
              <img
                src={productData.back_image_b64}
                alt="Back Panel"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <Upload size={20} color="#718096" />
                <span style={{ fontSize: '0.7rem', color: '#718096', marginTop: '0.25rem' }}>
                  Live Camera / Upload Back
                </span>
              </>
            )}
            <input
              type="file"
              ref={backInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, 'back_image_b64')}
            />
          </div>
          <button
            type="button"
            className="civic-btn civic-btn-outline"
            style={{ width: '100%', marginTop: '0.35rem', padding: '0.2rem 0.4rem', fontSize: '0.68rem' }}
            onClick={(e) => {
              e.stopPropagation();
              backInputRef.current?.click();
            }}
          >
            <Upload size={11} /> Upload File
          </button>
        </div>
      </div>

      {/* Manual / Preset Data Overview */}
      <div style={{ flex: 1, backgroundColor: '#F7FAFC', border: '1px solid #E2E8F0', padding: '0.65rem', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2D3748' }}>
            {productData.manual_data?.product_name || (productData.preset_key ? 'Preset Loaded' : 'Custom Upload')}
          </span>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ background: 'none', border: 'none', color: '#1A365D', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {showAdvanced ? 'Hide Fields' : 'Edit Text Data'} <ChevronDown size={12} />
          </button>
        </div>

        {showAdvanced ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#4A5568' }}>Product & Brand Name:</label>
              <input
                type="text"
                className="civic-input"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                value={productData.manual_data?.product_name || ''}
                onChange={(e) =>
                  onChange({
                    ...productData,
                    manual_data: { ...(productData.manual_data || {}), product_name: e.target.value }
                  })
                }
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#4A5568' }}>Front-of-Pack Claims (comma separated):</label>
              <input
                type="text"
                className="civic-input"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                placeholder="e.g. Zero Sugar, 100% Atta"
                value={(productData.manual_data?.fop_claims || []).join(', ')}
                onChange={(e) =>
                  onChange({
                    ...productData,
                    manual_data: {
                      ...(productData.manual_data || {}),
                      fop_claims: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    }
                  })
                }
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#4A5568' }}>Ingredients Declaration:</label>
              <textarea
                className="civic-textarea"
                rows={2}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                value={productData.manual_data?.ingredients_text || ''}
                onChange={(e) =>
                  onChange({
                    ...productData,
                    manual_data: { ...(productData.manual_data || {}), ingredients_text: e.target.value }
                  })
                }
              />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#718096' }}>
            {productData.preset_key ? (
              <p>Ready to run Gemini FSSAI nutrition & deception analysis on preset formula.</p>
            ) : productData.front_image_b64 || productData.back_image_b64 ? (
              <p style={{ color: '#2F855A', fontWeight: '600' }}>✓ Packaging frames ready for OCR extraction.</p>
            ) : (
              <p>Upload packaging images or select a test preset above.</p>
            )}
          </div>
        )}
      </div>

      {/* Citizen 2-Panel Live Camera Rig Modal */}
      <CitizenCameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        slotIndex={slotIndex}
        productData={productData}
        onSaveCaptures={handleCameraCapture}
        initialPanel={initialCameraPanel}
      />
    </div>
  );
}
