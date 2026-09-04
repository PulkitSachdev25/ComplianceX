import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Upload, Eye, Focus, Sparkles, FlipHorizontal, Play, Square, FastForward } from 'lucide-react';
import { calculateLaplacianVariance } from '../../utils/laplacian';
import { computeSha256 } from '../../utils/crypto';
import GooeyNav from '../../GooeyNav';

// Statutory 4 Panels configuration referencing scanner_backend
const PANELS_CONFIG = [
  {
    key: 'front',
    label: '1. FRONT PANEL',
    sub: 'Principal Display Panel (MRP, Brand & Net Quantity)',
    tip: 'Align brand name and net quantity in view'
  },
  {
    key: 'back',
    label: '2. BACK / ADDRESS PANEL',
    sub: 'Manufacturer, Ingredients, Care Cell & Postal PIN',
    tip: 'Hold close for address and customer care text'
  },
  {
    key: 'top',
    label: '3. TOP / BOTTOM (STAMP)',
    sub: 'MRP, Batch Code, Date Stamp & Barcode',
    tip: 'Show MRP, batch code, and date stamp'
  },
  {
    key: 'bottom',
    label: '4. FULL / INGREDIENTS SIDE',
    sub: 'Statutory Declarations, USP & Unit Sale Price',
    tip: 'Show any remaining statutory declarations'
  }
];

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
  const [isMirrored, setIsMirrored] = useState(false);
  const [handsfreeMode, setHandsfreeMode] = useState(true);
  const [streamError, setStreamError] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);

  // Focus & Auto-capture states
  const [focusMetrics, setFocusMetrics] = useState({
    score: 0,
    status: 'NO_FEED',
    label: 'Camera Inactive',
    color: '#718096'
  });
  const [capturingCountdown, setCapturingCountdown] = useState(null); // Time remaining before auto-snap
  const [flipCountdown, setFlipCountdown] = useState(null); // Flip delay countdown banner (seconds)
  const [nextPanelPrompt, setNextPanelPrompt] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Timing tracking for steady auto-capture (scanner_backend reference: 0.8s steady time)
  const REQUIRED_STEADY_TIME_MS = 800;
  const SHARPNESS_THRESHOLD = 50.0;
  const FLIP_DELAY_SEC = 4;

  const steadyStartTimeRef = useRef(null);
  const flipTimerRef = useRef(null);
  const isAutoCapturingRef = useRef(false);

  // Stop camera stream utility
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    steadyStartTimeRef.current = null;
    setCapturingCountdown(null);
    setFlipCountdown(null);
    if (flipTimerRef.current) {
      clearInterval(flipTimerRef.current);
      flipTimerRef.current = null;
    }
  }, []);

  // Start live camera stream
  const startCamera = async () => {
    try {
      setStreamError(null);
      stopCamera(); // Clean up existing stream

      // First attempt high resolution 1080p environment camera (as in scanner_backend)
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: { ideal: 'environment' }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn('High-res environment camera failed, trying standard video constraint:', firstErr);
        // Fallback for laptops/webcams
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((playErr) => console.error('Video play error:', playErr));
        };
      }

      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setStreamError(`Camera access denied or device unavailable: ${err.message}. You can also upload packaging images directly.`);
      setCameraActive(false);
    }
  };

  // Ensure video element receives stream whenever cameraActive changes
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((e) => console.log('Auto play note:', e));
      }
    }
  }, [cameraActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture snapshot from current video frame
  const captureCurrentFrame = useCallback(async (targetPanelKey) => {
    const activeKey = targetPanelKey || selectedPanel;
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video stream resolution
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip if mirrored
    if (isMirrored) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -width, 0, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const hash = await computeSha256(dataUrl);

    // Flash animation feedback
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    // Dispatch update
    onPanelUpdate(activeKey, dataUrl, hash);

    // If handsfree mode is active, handle next panel countdown
    const currentIndex = PANELS_CONFIG.findIndex((p) => p.key === activeKey);
    if (handsfreeMode && currentIndex >= 0 && currentIndex < PANELS_CONFIG.length - 1) {
      const nextPanel = PANELS_CONFIG[currentIndex + 1];
      setNextPanelPrompt(nextPanel);
      
      let secondsLeft = FLIP_DELAY_SEC;
      setFlipCountdown(secondsLeft);

      if (flipTimerRef.current) clearInterval(flipTimerRef.current);
      flipTimerRef.current = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          clearInterval(flipTimerRef.current);
          flipTimerRef.current = null;
          setFlipCountdown(null);
          setNextPanelPrompt(null);
          setSelectedPanel(nextPanel.key);
          steadyStartTimeRef.current = null;
          setCapturingCountdown(null);
          isAutoCapturingRef.current = false;
        } else {
          setFlipCountdown(secondsLeft);
        }
      }, 1000);
    } else {
      isAutoCapturingRef.current = false;
    }
  }, [selectedPanel, isMirrored, handsfreeMode, onPanelUpdate]);

  // Real-time Laplacian Focus and Auto-Capture Loop (scanner_backend implementation)
  useEffect(() => {
    let animationFrameId;

    const processFrame = () => {
      if (cameraActive && videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Use downsampled frame for lightning-fast 60FPS Laplacian calculation
        canvas.width = Math.min(video.videoWidth || 640, 480);
        canvas.height = Math.min(video.videoHeight || 480, 360);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const metrics = calculateLaplacianVariance(canvas);
          setFocusMetrics(metrics);

          // Hands-free Steady Detection & Auto-Capture (if not in flip countdown)
          if (handsfreeMode && flipCountdown === null && !isAutoCapturingRef.current) {
            const isSharp = metrics.score >= SHARPNESS_THRESHOLD;

            if (isSharp) {
              const now = performance.now();
              if (steadyStartTimeRef.current === null) {
                steadyStartTimeRef.current = now;
              }
              const elapsed = now - steadyStartTimeRef.current;
              const remainingSec = Math.max(0, (REQUIRED_STEADY_TIME_MS - elapsed) / 1000);
              setCapturingCountdown(remainingSec.toFixed(1));

              if (elapsed >= REQUIRED_STEADY_TIME_MS) {
                isAutoCapturingRef.current = true;
                steadyStartTimeRef.current = null;
                setCapturingCountdown(null);
                captureCurrentFrame(selectedPanel);
              }
            } else {
              steadyStartTimeRef.current = null;
              setCapturingCountdown(null);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (cameraActive) {
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, handsfreeMode, flipCountdown, selectedPanel, captureCurrentFrame]);

  // Manual File Upload Handler
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
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const metrics = calculateLaplacianVariance(c);
            setFocusMetrics(metrics);
          }
        };
        img.src = b64;

        onPanelUpdate(selectedPanel, b64, hash);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentPanelConfig = PANELS_CONFIG.find((p) => p.key === selectedPanel) || PANELS_CONFIG[0];
  const allPanelsCaptured = PANELS_CONFIG.every((p) => Boolean(panels[p.key]));

  // Reticle color determined by steady/sharpness status
  let reticleBorderColor = 'rgba(255, 255, 255, 0.4)';
  let reticleShadow = 'none';
  if (cameraActive) {
    if (capturingCountdown !== null) {
      reticleBorderColor = '#38A169'; // Green capturing
      reticleShadow = '0 0 15px rgba(56, 161, 105, 0.6)';
    } else if (focusMetrics.score < SHARPNESS_THRESHOLD) {
      reticleBorderColor = '#E53E3E'; // Red blurry / moving
      reticleShadow = '0 0 10px rgba(229, 62, 62, 0.4)';
    } else {
      reticleBorderColor = '#48BB78';
    }
  }

  return (
    <div className="civic-card" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="civic-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera size={20} color="#1A365D" />
          <span className="civic-card-title">4-Panel Statutory Camera Rig & Evidentiary Viewfinder</span>
        </div>

        {/* Test Preset & Hands-Free Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: '#1A365D', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={handsfreeMode}
              onChange={(e) => setHandsfreeMode(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Hands-Free Auto-Capture (0.8s Steady)</span>
          </label>

          <select
            className="civic-select"
            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onChange={(e) => onApplyPreset(e.target.value)}
            disabled={disabled}
          >
            <option value="">-- Load Standard Test Package --</option>
            {presets.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} ({p.violation})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Standard Test Packages Quick GooeyNav Switcher */}
      {presets && presets.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase' }}>
            Test Package Dockets:
          </span>
          <GooeyNav
            items={presets.map(p => ({
              label: `${p.name} (${p.violation})`,
              href: `#${p.key}`,
              onClick: (e) => {
                if (e) e.preventDefault();
                onApplyPreset(p.key);
              }
            }))}
          />
        </div>
      )}

      {/* 4-Panel Selection Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {PANELS_CONFIG.map((p, idx) => {
          const hasImage = Boolean(panels[p.key]);
          const isSelected = selectedPanel === p.key;
          return (
            <div
              key={p.key}
              onClick={() => {
                setSelectedPanel(p.key);
                setFlipCountdown(null);
                setNextPanelPrompt(null);
              }}
              style={{
                border: `2px solid ${isSelected ? '#1A365D' : '#CBD5E0'}`,
                backgroundColor: isSelected ? '#EDF2F7' : hasImage ? '#F0FFF4' : '#FAFAFA',
                padding: '0.5rem',
                borderRadius: '3px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1A365D' }}>{p.label}</span>
                {hasImage ? (
                  <CheckCircle size={15} color="#2F855A" />
                ) : (
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#CBD5E0' }} />
                )}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#4A5568', marginTop: '3px', lineHeight: 1.2 }}>{p.tip}</div>

              {panelHashes[p.key] && (
                <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#2B6CB0', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  SHA: {panelHashes[p.key].substring(0, 12)}...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Panel Viewfinder & Controls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1rem' }}>
        
        {/* Viewfinder Monitor */}
        <div
          className="viewfinder-box"
          style={{
            minHeight: '300px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0E17',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '2px solid #2D3748'
          }}
        >
          {/* Top HUD Bar */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 20,
              pointerEvents: 'none'
            }}
          >
            {/* Step Banner */}
            <span
              style={{
                backgroundColor: 'rgba(10, 14, 23, 0.85)',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '3px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Focus size={13} color="#63B3ED" />
              STEP: {currentPanelConfig.label}
            </span>

            {/* Laplacian Variance HUD */}
            <span
              style={{
                backgroundColor: 'rgba(10, 14, 23, 0.85)',
                color: focusMetrics.color,
                padding: '4px 10px',
                borderRadius: '3px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                border: `1px solid ${focusMetrics.color}`
              }}
            >
              σ²: {focusMetrics.score} • {focusMetrics.label}
            </span>
          </div>

          {/* Flash Effect on Capture */}
          {flashEffect && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                zIndex: 40,
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Flip Countdown Overlay (scanner_backend countdown delay) */}
          {flipCountdown !== null && nextPanelPrompt && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                zIndex: 35,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#ECC94B', fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                FLIP TO: {nextPanelPrompt.label}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '1rem' }}>
                {nextPanelPrompt.tip}
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  backgroundColor: '#2B6CB0',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #63B3ED'
                }}
              >
                {flipCountdown}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E0', marginTop: '0.75rem' }}>
                Scanning starts in {flipCountdown}s... (or click to skip)
              </div>
              <button
                className="civic-btn civic-btn-outline"
                style={{ marginTop: '0.75rem', color: '#FFFFFF', borderColor: '#718096', fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}
                onClick={() => {
                  if (flipTimerRef.current) clearInterval(flipTimerRef.current);
                  setFlipCountdown(null);
                  setSelectedPanel(nextPanelPrompt.key);
                  setNextPanelPrompt(null);
                }}
              >
                <FastForward size={12} /> Scan Now
              </button>
            </div>
          )}

          {/* 76% Central Reticle Bounding Box (scanner_backend width/height 0.12 to 0.88) */}
          <div
            style={{
              position: 'absolute',
              top: '12%',
              left: '12%',
              right: '12%',
              bottom: '12%',
              border: `2px solid ${reticleBorderColor}`,
              boxShadow: reticleShadow,
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '0.5rem',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            {/* Reticle Corner Marks */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ width: '12px', height: '12px', borderTop: `2px solid ${reticleBorderColor}`, borderLeft: `2px solid ${reticleBorderColor}` }} />
              <span style={{ width: '12px', height: '12px', borderTop: `2px solid ${reticleBorderColor}`, borderRight: `2px solid ${reticleBorderColor}` }} />
            </div>

            {/* Bottom Reticle Status (AUTO-CAPTURING or BLURRY / HOLD STEADY) */}
            <div style={{ textAlign: 'center' }}>
              {cameraActive && (
                <span
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: capturingCountdown !== null ? '#48BB78' : focusMetrics.score < SHARPNESS_THRESHOLD ? '#FC8181' : '#E2E8F0',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '3px',
                    letterSpacing: '0.04em'
                  }}
                >
                  {capturingCountdown !== null
                    ? `📸 AUTO-CAPTURING IN ${capturingCountdown}s`
                    : focusMetrics.score < SHARPNESS_THRESHOLD
                    ? '⚠ BLURRY / MOVING - HOLD STEADY'
                    : '✓ STEADY & SHARP - READY'}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ width: '12px', height: '12px', borderBottom: `2px solid ${reticleBorderColor}`, borderLeft: `2px solid ${reticleBorderColor}` }} />
              <span style={{ width: '12px', height: '12px', borderBottom: `2px solid ${reticleBorderColor}`, borderRight: `2px solid ${reticleBorderColor}` }} />
            </div>
          </div>

          {/* Video Stream Element (Always mounted to guarantee reliable stream binding) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '340px',
              objectFit: 'cover',
              display: cameraActive ? 'block' : 'none',
              transform: isMirrored ? 'scaleX(-1)' : 'none'
            }}
          />

          {/* Captured Image Preview if camera inactive */}
          {!cameraActive && panels[selectedPanel] && (
            <img
              src={panels[selectedPanel]}
              alt={selectedPanel}
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
            />
          )}

          {/* Inactive Standby Placeholder */}
          {!cameraActive && !panels[selectedPanel] && (
            <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '2rem' }}>
              <Camera size={44} style={{ margin: '0 auto 0.75rem auto', opacity: 0.7, color: '#CBD5E0' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>
                Legal Metrology Viewport Standby
              </div>
              <div style={{ fontSize: '0.72rem', color: '#A0AEC0', marginTop: '0.35rem', maxWidth: '300px', margin: '0.35rem auto 0' }}>
                Click <strong>Start Live Camera</strong> to open camera feed or upload evidentiary photo.
              </div>
            </div>
          )}

          {/* Hidden Canvas for Laplacian Frame Processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Viewfinder Controls & Quality Assessment */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A365D' }}>
                Evidentiary Controls & Sharpness
              </h4>
              {cameraActive && (
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  style={{
                    background: 'none',
                    border: '1px solid #CBD5E0',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    color: '#4A5568',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Mirror camera display"
                >
                  <FlipHorizontal size={12} /> {isMirrored ? 'Mirrored' : 'Standard'}
                </button>
              )}
            </div>

            {/* Sharpness Meter Bar */}
            <div style={{ backgroundColor: '#EDF2F7', padding: '0.75rem', borderRadius: '3px', border: '1px solid #CBD5E0', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
                <span>Laplacian Variance (σ²):</span>
                <span style={{ color: focusMetrics.color }}>{focusMetrics.score}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#CBD5E0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (focusMetrics.score / 150) * 100)}%`,
                    height: '100%',
                    backgroundColor: focusMetrics.color,
                    transition: 'width 0.15s ease'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4A5568', marginTop: '0.4rem', lineHeight: 1.3 }}>
                {focusMetrics.score < SHARPNESS_THRESHOLD ? (
                  <span style={{ color: '#C53030', fontWeight: 'bold' }}>
                    ⚠ Inadmissible blur detected under Section 65B Indian Evidence Act. Hold package steady inside box.
                  </span>
                ) : (
                  <span style={{ color: '#2F855A', fontWeight: 'bold' }}>
                    ✓ Evidentiary threshold passed (σ² ≥ 50). Admissible for Section 36(1) prosecution docket.
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {streamError && (
              <div style={{ fontSize: '0.72rem', color: '#C53030', backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', padding: '0.5rem', borderRadius: '3px', marginBottom: '0.75rem' }}>
                {streamError}
              </div>
            )}

            {/* Step Guidance Tip */}
            <div style={{ backgroundColor: '#EBF8FF', border: '1px solid #BEE3F8', padding: '0.6rem 0.75rem', borderRadius: '3px', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2B6CB0' }}>
                Current Target: {currentPanelConfig.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#2D3748', marginTop: '0.15rem' }}>
                {currentPanelConfig.tip}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              {cameraActive ? (
                <>
                  <button
                    className="civic-btn civic-btn-success"
                    style={{ flex: 1 }}
                    onClick={() => captureCurrentFrame(selectedPanel)}
                  >
                    <Camera size={14} /> Snap {selectedPanel.toUpperCase()}
                  </button>
                  <button className="civic-btn civic-btn-outline" onClick={stopCamera}>
                    <Square size={14} /> Stop
                  </button>
                </>
              ) : (
                <button className="civic-btn civic-btn-primary" style={{ flex: 1 }} onClick={startCamera}>
                  <Camera size={14} /> Start Live Camera Feed
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

            {allPanelsCaptured && (
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#2F855A', fontWeight: 700, marginTop: '0.2rem' }}>
                ✓ All 4 Statutory Panels Captured & SHA Hashed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
