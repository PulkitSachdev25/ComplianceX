import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Upload, Eye, Focus, Sparkles, FlipHorizontal, Play, Square, FastForward } from 'lucide-react';
import { calculateLaplacianVariance } from '../../utils/laplacian';
import { computeSha256 } from '../../utils/crypto';

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

  // Timing tracking for steady auto-capture (Inspector: 1.8s steady hold)
  const REQUIRED_STEADY_TIME_MS = 1800;
  const FLIP_DELAY_SEC = 4;

  const steadyStartTimeRef = useRef(null);
  const flipTimerRef = useRef(null);
  const isAutoCapturingRef = useRef(false);
  const animationFrameIdRef = useRef(null);

  // Web Audio API feedback on auto-capture
  const playCaptureBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio feedback notice:', e);
    }
  }, []);

  // Stop camera stream utility
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        try {
          videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        } catch (e) {
          // ignore
        }
      }
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

  // Start live camera stream with device-aware hardware selection (rear camera priority)
  const startCamera = async () => {
    try {
      setStreamError(null);
      stopCamera(); // Clean up existing stream

      let stream = null;
      const constraintList = [
        {
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: { ideal: 'environment' }
          },
          audio: false
        },
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: 'environment' }
          },
          audio: false
        },
        {
          video: {
            facingMode: { ideal: 'environment' }
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      for (const constraints of constraintList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          // Fallback to next constraint
        }
      }

      if (!stream) {
        throw new Error('No compatible video camera stream could be opened.');
      }

      streamRef.current = stream;

      // Orientation Normalization: Detect front/user-facing camera for preview mirroring
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings?.() || {};
      const isUserFacing = settings.facingMode === 'user' || (!settings.facingMode && (/front|user|facetime/i.test(videoTrack?.label || '')));
      setIsMirrored(Boolean(isUserFacing));

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

  // Capture snapshot from current video frame (ALWAYS un-mirrored for standard OCR)
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

    // Saved Frame Requirement: The captured Base64 frame emitted to the API must ALWAYS remain un-mirrored
    // so statutory label text reads standard left-to-right for OCR.
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const hash = await computeSha256(dataUrl);

    // Audio feedback on capture (Web Audio API)
    playCaptureBeep();

    // Flash animation feedback
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    // Dispatch update
    onPanelUpdate(activeKey, dataUrl, hash);

    const currentIndex = PANELS_CONFIG.findIndex((p) => p.key === activeKey);

    // If final panel (bottom) or sequence complete: immediately shut down camera hardware and loop
    if (activeKey === 'bottom' || currentIndex === PANELS_CONFIG.length - 1) {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      stopCamera();
      isAutoCapturingRef.current = false;
      return;
    }

    // If handsfree mode is active, handle next panel countdown
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
  }, [selectedPanel, handsfreeMode, onPanelUpdate, playCaptureBeep, stopCamera]);

  // Real-time Laplacian Focus & Micro-Text Auto-Capture Loop (Inspector 1.8s steady hold)
  useEffect(() => {
    const processFrame = () => {
      if (cameraActive && videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Downsampled canvas for real-time 60FPS processing
        canvas.width = Math.min(video.videoWidth || 640, 480);
        canvas.height = Math.min(video.videoHeight || 480, 360);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Calculate Center-Constrained ROI Laplacian Variance & Micro-Text Edge Density
          const metrics = calculateLaplacianVariance(canvas, { x: 0.12, y: 0.12, width: 0.76, height: 0.76 });
          setFocusMetrics(metrics);

          // Hands-free Steady Detection & Auto-Capture:
          // Requires metrics.isReady (variance >= 120.0 and edgeDensity >= 0.025)
          // Uses wall-clock Date.now() for accurate continuous 1.8s elapsed time
          if (handsfreeMode && flipCountdown === null && !isAutoCapturingRef.current) {
            if (metrics.isReady) {
              const now = Date.now();
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

      if (cameraActive) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    if (cameraActive) {
      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
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
    } else if (focusMetrics.isReady) {
      reticleBorderColor = '#48BB78'; // Green ready
      reticleShadow = '0 0 8px rgba(72, 187, 120, 0.5)';
    } else {
      reticleBorderColor = '#E53E3E'; // Red not ready / moving / low text density
      reticleShadow = '0 0 10px rgba(229, 62, 62, 0.4)';
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

        {/* Hands-Free Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: '#1A365D', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={handsfreeMode}
              onChange={(e) => setHandsfreeMode(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Hands-Free Auto-Capture (1.8s Steady)</span>
          </label>
        </div>
      </div>

      {/* 4-Panel Selection Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {PANELS_CONFIG.map((p) => {
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
        
        {/* Viewfinder Column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                pointerEvents: 'none',
                gap: '0.5rem'
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
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Focus size={13} color="#63B3ED" />
                STEP: {currentPanelConfig.label}
              </span>

              {/* Laplacian Variance & Micro-Text Density HUD */}
              <span
                style={{
                  backgroundColor: 'rgba(10, 14, 23, 0.85)',
                  color: focusMetrics.color,
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  border: `1px solid ${focusMetrics.color}`,
                  textAlign: 'right'
                }}
              >
                σ²: {focusMetrics.variance ?? focusMetrics.score} • Text: {((focusMetrics.edgeDensity ?? 0) * 100).toFixed(1)}% • {focusMetrics.label}
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

            {/* Flip Countdown Overlay */}
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

            {/* Central Reticle Bounding Box */}
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

              {/* Bottom Reticle Status */}
              <div style={{ textAlign: 'center' }}>
                {cameraActive && (
                  <span
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      color: capturingCountdown !== null ? '#48BB78' : focusMetrics.isReady ? '#48BB78' : '#FC8181',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '3px',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {capturingCountdown !== null
                      ? `📸 AUTO-CAPTURING IN ${capturingCountdown}s`
                      : focusMetrics.isReady
                      ? '✓ STEADY & SHARP - READY'
                      : (focusMetrics.variance ?? focusMetrics.score) < 45
                      ? '⚠ BLURRY / MOVING - HOLD STEADY'
                      : (focusMetrics.variance ?? focusMetrics.score) < 120
                      ? '⚠ LOW CONTRAST - FOCUS ON TEXT'
                      : '⚠ ALIGN PACKAGING TEXT IN BOX'}
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

          {/* Prominent Manual Touch Shutter Button under the Viewport */}
          {cameraActive && (
            <button
              className="civic-btn civic-btn-primary"
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.65rem 1rem',
                fontSize: '0.88rem',
                fontWeight: 700
              }}
              onClick={() => captureCurrentFrame(selectedPanel)}
            >
              📸 Snap {currentPanelConfig.label} Now
            </button>
          )}
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

            {/* Sharpness & Edge Density Meter Bar */}
            <div style={{ backgroundColor: '#EDF2F7', padding: '0.75rem', borderRadius: '3px', border: '1px solid #CBD5E0', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                <span>Clarity (Focus Score):</span>
                <span style={{ color: focusMetrics.color }}>{focusMetrics.variance ?? focusMetrics.score}</span>
              </div>
              <div style={{ width: '100%', height: '7px', backgroundColor: '#CBD5E0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: `${Math.min(100, ((focusMetrics.variance ?? focusMetrics.score) / 150) * 100)}%`,
                    height: '100%',
                    backgroundColor: focusMetrics.color,
                    transition: 'width 0.15s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                <span>Visibility (Text Density):</span>
                <span style={{ color: focusMetrics.color }}>{((focusMetrics.edgeDensity ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '7px', backgroundColor: '#CBD5E0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, ((focusMetrics.edgeDensity ?? 0) / 0.05) * 100)}%`,
                    height: '100%',
                    backgroundColor: focusMetrics.color,
                    transition: 'width 0.15s ease'
                  }}
                />
              </div>

              <div style={{ fontSize: '0.68rem', color: '#4A5568', marginTop: '0.45rem', lineHeight: 1.3 }}>
                {!focusMetrics.isReady ? (
                  <span style={{ color: '#C53030', fontWeight: 'bold' }}>
                    ⚠ Inadmissible under Section 65B Indian Evidence Act / BSA. Hold micro-text steady inside reticle.
                  </span>
                ) : (
                  <span style={{ color: '#2F855A', fontWeight: 'bold' }}>
                    ✓ Evidentiary dual-gate passed (σ² ≥ 120 & Density ≥ 2.5%). Admissible for Section 36(1) prosecution docket.
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
