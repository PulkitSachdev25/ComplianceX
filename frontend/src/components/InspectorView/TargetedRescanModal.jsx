import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Focus, Sparkles, FlipHorizontal, RefreshCw, Upload } from 'lucide-react';
import { calculateLaplacianVariance } from '../../utils/laplacian';
import { computeSha256 } from '../../utils/crypto';

// Mapping from ruleId to human-readable rule metadata and target panel
const RULE_METADATA = {
  rule_6_1_a: {
    panel: 'back',
    title: 'Rule 6(1)(a) • Manufacturer Name, Address & 6-Digit PIN',
    tip: 'Align the manufacturer / packer address block and 6-digit postal PIN code closely.'
  },
  rule_6_1_b: {
    panel: 'front',
    title: 'Rule 6(1)(b) • Generic / Common Commodity Name',
    tip: 'Align the generic product identity label on the principal display panel.'
  },
  rule_6_1_c: {
    panel: 'front',
    title: 'Rule 6(1)(c) • Net Quantity (SI Units)',
    tip: 'Capture clear close-up of net quantity numeral and SI unit (g / kg / ml / L / N).'
  },
  rule_6_1_d: {
    panel: 'top',
    title: 'Rule 6(1)(d) • Date of Manufacture / Packaging',
    tip: 'Capture the stamped / embossed Month & Year (MM/YYYY) and batch code clearly.'
  },
  rule_6_1_e: {
    panel: 'top',
    title: 'Rule 6(1)(e) • Maximum Retail Price (MRP)',
    tip: 'Ensure the "MRP ₹ (incl. of all taxes)" printed stamp is in sharp focus.'
  },
  rule_6_1_f: {
    panel: 'back',
    title: 'Rule 6(1)(f) • Consumer Care Cell & Grievance Address',
    tip: 'Align consumer helpline phone number, email ID, and nodal grievance address.'
  },
  rule_5_usp: {
    panel: 'bottom',
    title: 'Rule 5 • Unit Sale Price (USP) Mathematical Declaration',
    tip: 'Capture the printed per-unit rate declaration (₹/g or ₹/ml or ₹/piece).'
  }
};

export default function TargetedRescanModal({
  isOpen,
  ruleId,
  onClose,
  onSaveCapture
}) {
  const meta = RULE_METADATA[ruleId] || {
    panel: 'back',
    title: `Statutory Rule (${ruleId || 'Evidentiary Rescan'})`,
    tip: 'Align the missing statutory declaration text inside the viewfinder reticle.'
  };

  const [cameraActive, setCameraActive] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);

  const [focusMetrics, setFocusMetrics] = useState({
    variance: 0,
    edgeDensity: 0,
    score: 0,
    isReady: false,
    label: 'Camera Standby',
    color: '#718096'
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const b64 = reader.result;
        const hash = await computeSha256(b64);
        playCaptureBeep();
        setCapturedPreview(b64);
        stopCamera();
        if (onSaveCapture) {
          onSaveCapture(meta.panel, b64, hash, ruleId);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Web Audio API feedback
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

  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
  }, []);

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
        { video: true, audio: false }
      ];

      for (const constraints of constraintList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          // fallback
        }
      }

      if (!stream) {
        throw new Error('Unable to access camera on this device.');
      }

      streamRef.current = stream;

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
      console.error('Targeted rescan camera error:', err);
      setStreamError(`Camera access denied: ${err.message}.`);
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Real-time Laplacian Focus calculation loop
  useEffect(() => {
    const processFrame = () => {
      if (cameraActive && videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = Math.min(video.videoWidth || 640, 480);
        canvas.height = Math.min(video.videoHeight || 480, 360);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const metrics = calculateLaplacianVariance(canvas, { x: 0.12, y: 0.12, width: 0.76, height: 0.76 });
          setFocusMetrics(metrics);
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
  }, [cameraActive]);

  // Capture targeted 1-shot frame
  const handleSnap = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const hash = await computeSha256(dataUrl);

    playCaptureBeep();
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    setCapturedPreview(dataUrl);

    // Stop hardware tracks immediately
    stopCamera();

    // Trigger parent callback
    if (onSaveCapture) {
      onSaveCapture(meta.panel, dataUrl, hash, ruleId);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 1100,
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
          maxWidth: '680px',
          backgroundColor: '#FFFFFF',
          padding: '1.25rem',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
          marginBottom: 0
        }}
      >
        {/* Header */}
        <div className="civic-card-header" style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="#1A365D" />
            <span className="civic-card-title" style={{ fontSize: '0.95rem' }}>
              Targeted 1-Shot Re-Scan: {meta.title}
            </span>
          </div>
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

        {/* Instructions */}
        <div
          style={{
            backgroundColor: '#EBF8FF',
            border: '1px solid #BEE3F8',
            padding: '0.6rem 0.85rem',
            borderRadius: '3px',
            marginBottom: '0.85rem',
            fontSize: '0.78rem',
            color: '#2B6CB0'
          }}
        >
          <strong>Statutory Focus:</strong> {meta.tip}
        </div>

        {/* Viewfinder Frame */}
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
            border: '2px solid #2D3748',
            marginBottom: '0.85rem'
          }}
        >
          {/* Top HUD */}
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
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Focus size={13} color="#63B3ED" />
              Target Panel: {meta.panel.toUpperCase()}
            </span>

            {cameraActive && (
              <span
                style={{
                  backgroundColor: 'rgba(10, 14, 23, 0.85)',
                  color: focusMetrics.color,
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  border: `1px solid ${focusMetrics.color}`
                }}
              >
                σ²: {focusMetrics.variance ?? focusMetrics.score} • {focusMetrics.label}
              </span>
            )}
          </div>

          {/* Flash Effect */}
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

          {/* Reticle ROI */}
          {cameraActive && (
            <div
              style={{
                position: 'absolute',
                top: '12%',
                left: '12%',
                right: '12%',
                bottom: '12%',
                border: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}`,
                boxShadow: focusMetrics.isReady ? '0 0 10px rgba(72, 187, 120, 0.5)' : 'none',
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 15,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ width: '12px', height: '12px', borderTop: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}`, borderLeft: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}` }} />
                <span style={{ width: '12px', height: '12px', borderTop: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}`, borderRight: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}` }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: focusMetrics.isReady ? '#48BB78' : '#FC8181',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px'
                  }}
                >
                  {focusMetrics.isReady ? '✓ SHARP & STEADY - READY' : '⚠ HOLD STEADY ON TEXT'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ width: '12px', height: '12px', borderBottom: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}`, borderLeft: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}` }} />
                <span style={{ width: '12px', height: '12px', borderBottom: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}`, borderRight: `2px solid ${focusMetrics.isReady ? '#48BB78' : '#E53E3E'}` }} />
              </div>
            </div>
          )}

          {/* Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '280px',
              objectFit: 'cover',
              display: cameraActive ? 'block' : 'none',
              transform: isMirrored ? 'scaleX(-1)' : 'none'
            }}
          />

          {/* Captured Preview */}
          {!cameraActive && capturedPreview && (
            <img
              src={capturedPreview}
              alt="Targeted Re-scan"
              style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
            />
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Meters */}
        {cameraActive && (
          <div style={{ backgroundColor: '#EDF2F7', padding: '0.6rem 0.75rem', borderRadius: '3px', border: '1px solid #CBD5E0', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
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
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <button
              className="civic-btn civic-btn-outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <Upload size={13} /> Upload Close-up Frame
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="civic-btn civic-btn-outline"
              onClick={() => {
                stopCamera();
                onClose();
              }}
            >
              Cancel
            </button>

            {cameraActive ? (
              <button
                className="civic-btn civic-btn-primary"
                onClick={handleSnap}
                style={{ fontWeight: 700 }}
              >
                📸 Capture Targeted Shot
              </button>
            ) : (
              <button
                className="civic-btn civic-btn-primary"
                onClick={startCamera}
                style={{ fontWeight: 700 }}
              >
                <RefreshCw size={14} /> Re-Take Shot
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
