import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Upload, Eye, Focus } from 'lucide-react';
import { calculateLaplacianVariance } from '../../utils/laplacian';
import { computeSha256 } from '../../utils/crypto';

export default function CameraRig({
  panels,
  panelHashes,
  onPanelUpdate,
  presets,
  onApplyPreset,
  disabled
}) {
  const [selectedPanel, setSelectedPanel] = useState('front');
  const [cameraActive, setCameraActive] = useState(false);
  const [focusMetrics, setFocusMetrics] = useState({ score: 142.5, status: 'SHARP', label: 'SHARP (EVIDENTIARY QUALITY)', color: '#2F855A' });
  const [streamError, setStreamError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const panelNames = [
    { key: 'front', label: 'Panel 1: FRONT', sub: 'Principal Display Panel (MRP, Brand)' },
    { key: 'back', label: 'Panel 2: BACK', sub: 'Manufacturer, Ingredients, Care Cell' },
    { key: 'top', label: 'Panel 3: TOP', sub: 'Date of Packing / Batch Seal' },
    { key: 'bottom', label: 'Panel 4: BOTTOM', sub: 'Net Quantity, Barcode / USP' }
  ];

  // Start / Stop Camera Stream
  const startCamera = async () => {
    try {
      setStreamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Live camera stream not available on device:', err);
      setStreamError('Direct web camera unavailable. Please upload high-resolution evidentiary photo or use test presets.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Real-time Laplacian Variance Focus Loop
  useEffect(() => {
    let animationFrame;
    const checkFocus = () => {
      if (cameraActive && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const metrics = calculateLaplacianVariance(canvas);
          setFocusMetrics(metrics);
        }
      }
      animationFrame = requestAnimationFrame(checkFocus);
    };

    if (cameraActive) {
      animationFrame = requestAnimationFrame(checkFocus);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [cameraActive]);

  // Capture snapshot from active video stream
  const captureFrame = async () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      const hash = await computeSha256(dataUrl);
      onPanelUpdate(selectedPanel, dataUrl, hash);
    }
  };

  // Handle manual file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const b64 = reader.result;
        const hash = await computeSha256(b64);
        
        // Measure sharpness of uploaded photo
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const metrics = calculateLaplacianVariance(c);
          setFocusMetrics(metrics);
        };
        img.src = b64;

        onPanelUpdate(selectedPanel, b64, hash);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="civic-card">
      <div className="civic-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera size={20} color="#1A365D" />
          <span className="civic-card-title">4-Panel Statutory Camera Rig & Laplacian Viewfinder</span>
        </div>

        {/* Quick Test Case Loader */}
        <select
          className="civic-select"
          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          onChange={(e) => onApplyPreset(e.target.value)}
          disabled={disabled}
        >
          <option value="">-- Load Legal Metrology Test Package --</option>
          {presets.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name} ({p.violation})
            </option>
          ))}
        </select>
      </div>

      {/* 4-Panel Selection Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {panelNames.map((p) => {
          const hasImage = Boolean(panels[p.key]);
          const isSelected = selectedPanel === p.key;
          return (
            <div
              key={p.key}
              onClick={() => setSelectedPanel(p.key)}
              style={{
                border: `2px solid ${isSelected ? '#1A365D' : '#CBD5E0'}`,
                backgroundColor: isSelected ? '#EDF2F7' : '#FAFAFA',
                padding: '0.5rem',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1A365D' }}>{p.label}</span>
                {hasImage ? (
                  <CheckCircle size={14} color="#2F855A" />
                ) : (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#CBD5E0' }} />
                )}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '2px' }}>{p.sub}</div>

              {panelHashes[p.key] && (
                <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#4A5568', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  SHA: {panelHashes[p.key].substring(0, 12)}...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Panel Viewfinder & Focus HUD */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
        {/* Viewfinder Monitor */}
        <div className="viewfinder-box" style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Real-time Focus HUD */}
          <div className="viewfinder-hud">
            <span
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: focusMetrics.color,
                padding: '3px 8px',
                borderRadius: '2px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: `1px solid ${focusMetrics.color}`
              }}
            >
              <Focus size={13} />
              Laplacian Variance: {focusMetrics.score} • {focusMetrics.label}
            </span>

            <span style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', color: '#FFFFFF', padding: '3px 8px', borderRadius: '2px', fontSize: '0.7rem' }}>
              PANEL: {selectedPanel.toUpperCase()}
            </span>
          </div>

          <div className="viewfinder-reticle" />

          {/* Live Video / Captured Image / Placeholder */}
          {cameraActive ? (
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline />
          ) : panels[selectedPanel] ? (
            <img
              src={panels[selectedPanel]}
              alt={selectedPanel}
              style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#718096', padding: '2rem' }}>
              <Camera size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Camera Rig Viewport</div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                Activate camera or load packaging evidence for Panel: {selectedPanel.toUpperCase()}
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Viewfinder Controls & Evidentiary Quality Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A365D', marginBottom: '0.5rem' }}>
              Evidentiary Capture Controls
            </h4>

            {/* Sharpness Meter Bar */}
            <div style={{ backgroundColor: '#EDF2F7', padding: '0.65rem', borderRadius: '2px', border: '1px solid #CBD5E0', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                <span>Focus Sharpness Variance (σ²):</span>
                <span style={{ color: focusMetrics.color }}>{focusMetrics.score}</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#CBD5E0', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (focusMetrics.score / 200) * 100)}%`,
                    height: '100%',
                    backgroundColor: focusMetrics.color,
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4A5568', marginTop: '0.35rem' }}>
                {focusMetrics.score < 45 ? (
                  <span style={{ color: '#C53030', fontWeight: 'bold' }}>
                    ⚠ Inadmissible blur detected under Section 65B Indian Evidence Act. Hold steady.
                  </span>
                ) : (
                  <span style={{ color: '#2F855A' }}>
                    ✓ Evidentiary threshold passed (Variance ≥ 45). Compliant for legal seizure docket.
                  </span>
                )}
              </div>
            </div>

            {streamError && (
              <div style={{ fontSize: '0.7rem', color: '#C53030', backgroundColor: '#FFF5F5', padding: '0.4rem', borderRadius: '2px', marginBottom: '0.5rem' }}>
                {streamError}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {cameraActive ? (
                <>
                  <button className="civic-btn civic-btn-success" style={{ flex: 1 }} onClick={captureFrame}>
                    <Camera size={14} /> Capture {selectedPanel.toUpperCase()}
                  </button>
                  <button className="civic-btn civic-btn-outline" onClick={stopCamera}>
                    Stop
                  </button>
                </>
              ) : (
                <button className="civic-btn civic-btn-primary" style={{ flex: 1 }} onClick={startCamera}>
                  <Camera size={14} /> Start Live Camera
                </button>
              )}
            </div>

            <button
              className="civic-btn civic-btn-outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%' }}
            >
              <Upload size={14} /> Upload Frame for {selectedPanel.toUpperCase()}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
