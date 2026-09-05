import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, CheckCircle, Focus, FlipHorizontal, Square, FastForward, Sparkles } from 'lucide-react';
import { calculateLaplacianVariance } from '../../utils/laplacian';
import { computeSha256 } from '../../utils/crypto';

// Citizen 2-Panel Scanning Sequence: FOP (Claims) -> BOP (Ingredients / Nutrition Table)
const CITIZEN_PANELS = [
  {
    key: 'front',
    field: 'front_image_b64',
    label: '1. FRONT OF PACK (FOP)',
    shortLabel: 'Front (Claims)',
    sub: 'Principal Display Panel & Marketing Claims (e.g., "100% Atta", "Zero Sugar")',
    tip: 'Align brand claims and promotional badges in the center box'
  },
  {
    key: 'back',
    field: 'back_image_b64',
    label: '2. BACK OF PACK (BOP)',
    shortLabel: 'Back (Nutrition/Ingredients)',
    sub: 'Statutory Ingredients List, Allergen Warnings & Nutrition Facts Table',
    tip: 'Align the ingredients declaration and nutrition table in the center box'
  }
];

export default function CitizenCameraModal({
  isOpen,
  onClose,
  slotIndex,
  productData,
  onSaveCaptures,
  initialPanel = 'front'
}) {
  const [selectedPanel, setSelectedPanel] = useState(initialPanel);
  const [capturedFrames, setCapturedFrames] = useState({
    front: productData?.front_image_b64 || null,
    back: productData?.back_image_b64 || null
  });
  const [cameraActive, setCameraActive] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [handsfreeMode, setHandsfreeMode] = useState(true);
  const [streamError, setStreamError] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);

  // Focus & Auto-capture metrics
  const [focusMetrics, setFocusMetrics] = useState({
    variance: 0,
    edgeDensity: 0,
    score: 0,
    isReady: false,
    status: 'NO_FEED',
    label: 'Camera Standby',
    color: '#718096'
  });

  const [capturingCountdown, setCapturingCountdown] = useState(null);
  const [flipCountdown, setFlipCountdown] = useState(null);
  const [nextPanelPrompt, setNextPanelPrompt] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Timing tracking for fast citizen evaluation (1.2s continuous steady hold)
  const REQUIRED_STEADY_TIME_MS = 1200;
  const FLIP_DELAY_SEC = 4;

  const steadyStartTimeRef = useRef(null);
  const flipTimerRef = useRef(null);
  const isAutoCapturingRef = useRef(false);

  // Web Audio API auditory feedback on capture
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

  // Reset captured frames when opened
  useEffect(() => {
    if (isOpen) {
      setCapturedFrames({
        front: productData?.front_image_b64 || null,
        back: productData?.back_image_b64 || null
      });
      setSelectedPanel(initialPanel || 'front');
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, initialPanel, productData]);

  // Stop camera stream utility
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((t) => t.stop());
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

  // Device-Aware Hardware Selection (Rear camera priority)
  const startCamera = async () => {
    try {
      setStreamError(null);
      stopCamera();

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
          // Fallback to next constraints
        }
      }

      if (!stream) {
        throw new Error('Unable to access camera on this device.');
      }

      streamRef.current = stream;

      // Orientation Normalization: Detect front/user webcam vs rear camera
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
      setStreamError(`Camera access denied: ${err.message}.`);
      setCameraActive(false);
    }
  };

  // Ensure stream binding
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

  // Capture current video frame (ALWAYS un-mirrored for standard OCR)
  const captureCurrentFrame = useCallback(async (targetPanelKey) => {
    const activeKey = targetPanelKey || selectedPanel;
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

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

    // Audio feedback on capture (Web Audio API)
    playCaptureBeep();

    // Flash animation feedback
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    const updatedCaptures = {
      ...capturedFrames,
      [activeKey]: dataUrl
    };
    setCapturedFrames(updatedCaptures);

    // Notify parent immediately of captured panel
    if (onSaveCaptures) {
      onSaveCaptures(activeKey, dataUrl);
    }

    // If back panel (BOP) captured, complete sequence and shut down hardware
    if (activeKey === 'back') {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      stopCamera();
      isAutoCapturingRef.current = false;
      return;
    }

    // 2-Panel Citizen Sequence: If Front was captured, initiate 4-second Rotation Buffer to Back (BOP)
    if (activeKey === 'front' && handsfreeMode) {
      const nextPanel = CITIZEN_PANELS[1]; // Back of Pack
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
          setSelectedPanel('back');
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
  }, [selectedPanel, capturedFrames, handsfreeMode, onSaveCaptures, playCaptureBeep, stopCamera]);

  // Real-time Laplacian Focus & Micro-Text Auto-Capture Loop (Citizen: 1.2s Fast Steady Hold)
  useEffect(() => {
    let animationFrameId;

    const processFrame = () => {
      if (cameraActive && videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = Math.min(video.videoWidth || 640, 480);
        canvas.height = Math.min(video.videoHeight || 480, 360);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Calculate Center-Constrained ROI Laplacian Variance & Micro-Text Edge Density
          const metrics = calculateLaplacianVariance(canvas, { x: 0.15, y: 0.15, width: 0.70, height: 0.70 });
          setFocusMetrics(metrics);

          // Hands-free Steady Detection & Auto-Capture:
          // Requires metrics.isReady (variance >= 120.0 and edgeDensity >= 0.025)
          // Uses wall-clock Date.now() for continuous 1.2s steady hold
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

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (cameraActive) {
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, handsfreeMode, flipCountdown, selectedPanel, captureCurrentFrame]);

  if (!isOpen) return null;

  const currentPanelConfig = CITIZEN_PANELS.find((p) => p.key === selectedPanel) || CITIZEN_PANELS[0];
  const allCaptured = Boolean(capturedFrames.front && capturedFrames.back);

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
      reticleBorderColor = '#E53E3E'; // Red not ready
      reticleShadow = '0 0 10px rgba(229, 62, 62, 0.4)';
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
    >
      <div
        className="civic-card"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          padding: '1.25rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          marginBottom: 0
        }}
      >
        {/* Header */}
        <div className="civic-card-header" style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="#1A365D" />
            <span className="civic-card-title">
              Product #{slotIndex} • 2-Panel Food Safety Camera Rig
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: '#1A365D', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={handsfreeMode}
                onChange={(e) => setHandsfreeMode(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Fast Auto-Capture (1.2s Steady)</span>
            </label>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#4A5568',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2-Panel Steps Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          {CITIZEN_PANELS.map((p) => {
            const isSelected = selectedPanel === p.key;
            const hasImage = Boolean(capturedFrames[p.key]);
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
                  padding: '0.6rem 0.85rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A365D' }}>{p.label}</span>
                  {hasImage ? (
                    <CheckCircle size={16} color="#2F855A" />
                  ) : (
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#CBD5E0' }} />
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#4A5568', marginTop: '2px' }}>{p.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Viewfinder Monitor & Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1rem' }}>
          {/* Viewfinder Column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className="viewfinder-box"
              style={{
                minHeight: '280px',
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
                  STEP: {currentPanelConfig.shortLabel}
                </span>

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
                  <div style={{ color: '#ECC94B', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    FLIP TO: {nextPanelPrompt.label}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '1rem' }}>
                    {nextPanelPrompt.tip}
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      backgroundColor: '#2B6CB0',
                      width: '56px',
                      height: '56px',
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
                    Scanning starts in {flipCountdown}s...
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

              {/* Central Reticle Box (Center 70% ROI) */}
              <div
                style={{
                  position: 'absolute',
                  top: '15%',
                  left: '15%',
                  right: '15%',
                  bottom: '15%',
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
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ width: '12px', height: '12px', borderTop: `2px solid ${reticleBorderColor}`, borderLeft: `2px solid ${reticleBorderColor}` }} />
                  <span style={{ width: '12px', height: '12px', borderTop: `2px solid ${reticleBorderColor}`, borderRight: `2px solid ${reticleBorderColor}` }} />
                </div>

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

              {/* Video Stream Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '300px',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none',
                  transform: isMirrored ? 'scaleX(-1)' : 'none'
                }}
              />

              {/* Inactive Image Preview */}
              {!cameraActive && capturedFrames[selectedPanel] && (
                <img
                  src={capturedFrames[selectedPanel]}
                  alt={selectedPanel}
                  style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                />
              )}

              {/* Standby Placeholder */}
              {!cameraActive && !capturedFrames[selectedPanel] && (
                <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '1.5rem' }}>
                  <Camera size={40} style={{ margin: '0 auto 0.5rem auto', opacity: 0.7, color: '#CBD5E0' }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E2E8F0' }}>
                    Camera Standby
                  </div>
                </div>
              )}

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
                📸 Snap {currentPanelConfig.shortLabel} Now
              </button>
            )}
          </div>

          {/* Controls & Metrics Column */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A365D' }}>
                  Focus & Text Density
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

              {/* Sharpness & Edge Density Meter */}
              <div style={{ backgroundColor: '#EDF2F7', padding: '0.65rem', borderRadius: '3px', border: '1px solid #CBD5E0', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  <span>Clarity (Focus Score):</span>
                  <span style={{ color: focusMetrics.color }}>{focusMetrics.variance ?? focusMetrics.score}</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#CBD5E0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.4rem' }}>
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
                <div style={{ width: '100%', height: '6px', backgroundColor: '#CBD5E0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, ((focusMetrics.edgeDensity ?? 0) / 0.05) * 100)}%`,
                      height: '100%',
                      backgroundColor: focusMetrics.color,
                      transition: 'width 0.15s ease'
                    }}
                  />
                </div>
              </div>

              {/* Guidance Box */}
              <div style={{ backgroundColor: '#EBF8FF', border: '1px solid #BEE3F8', padding: '0.5rem 0.65rem', borderRadius: '3px', marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2B6CB0' }}>
                  {currentPanelConfig.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#2D3748', marginTop: '0.15rem' }}>
                  {currentPanelConfig.tip}
                </div>
              </div>

              {streamError && (
                <div style={{ fontSize: '0.7rem', color: '#C53030', backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', padding: '0.4rem', borderRadius: '3px', marginBottom: '0.5rem' }}>
                  {streamError}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                {cameraActive ? (
                  <>
                    <button
                      className="civic-btn civic-btn-success"
                      style={{ flex: 1 }}
                      onClick={() => captureCurrentFrame(selectedPanel)}
                    >
                      <Camera size={14} /> Snap {currentPanelConfig.shortLabel}
                    </button>
                    <button className="civic-btn civic-btn-outline" onClick={stopCamera}>
                      <Square size={14} /> Pause
                    </button>
                  </>
                ) : (
                  <button className="civic-btn civic-btn-primary" style={{ flex: 1 }} onClick={startCamera}>
                    <Camera size={14} /> Resume Live Feed
                  </button>
                )}
              </div>

              <button
                className="civic-btn civic-btn-primary"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                style={{ width: '100%' }}
              >
                ✓ Done & Use Photos ({[capturedFrames.front && 'FOP', capturedFrames.back && 'BOP'].filter(Boolean).join(' + ') || 'None'})
              </button>

              {allCaptured && (
                <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#2F855A', fontWeight: 700 }}>
                  ✓ Dual Panels (FOP + BOP) Captured for Analysis
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
