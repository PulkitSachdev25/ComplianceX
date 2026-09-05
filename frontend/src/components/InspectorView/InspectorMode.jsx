import React, { useState, useEffect, useCallback } from 'react';
import { Shield, FileText, Download, RefreshCw, AlertCircle, CheckCircle2, Save, MapPin, Database } from 'lucide-react';
import CameraRig from './CameraRig';
import StatutoryAuditCard from './StatutoryAuditCard';
import ChainOfCustodyLedger from './ChainOfCustodyLedger';
import OfflineQueueModal from './OfflineQueueModal';
import TargetedRescanModal from './TargetedRescanModal';
import { offlineStorage } from '../../utils/offlineStorage';
import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';

export default function InspectorMode({ 
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://compliancex.onrender.com' 
}) {
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [rescanModalOpen, setRescanModalOpen] = useState(false);
  const [rescanRuleId, setRescanRuleId] = useState(null);
  const [evaluatingRuleId, setEvaluatingRuleId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(() => offlineStorage.getQueue().length);

  // Inspector Officer & Geolocation State
  const [inspectorId, setInspectorId] = useState('LM-INSP-DEL-4091');
  const [geolocation, setGeolocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    display_name: 'Krishi Bhawan, Department of Consumer Affairs, New Delhi, India'
  });

  // Helper to refresh offline queue count
  const refreshQueueCount = useCallback(() => {
    const q = offlineStorage.getQueue();
    setPendingQueueCount(q.length);
  }, []);

  // Reactive Network & Storage Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshQueueCount();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshQueueCount();
    const interval = setInterval(refreshQueueCount, 2500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshQueueCount]);

  // 4 Panels & Hashes State
  const [panels, setPanels] = useState({
    front: null,
    back: null,
    top: null,
    bottom: null
  });
  const [panelHashes, setPanelHashes] = useState({
    front: null,
    back: null,
    top: null,
    bottom: null
  });

  // Audit Output State
  const [auditResult, setAuditResult] = useState(null);

  // Initialize Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          try {
            const resp = await fetch(`${apiBaseUrl}/api/reverse-geocode?lat=${lat}&lon=${lon}`);
            const geoData = await resp.json();
            setGeolocation({
              latitude: lat,
              longitude: lon,
              display_name: geoData.display_name || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`
            });
          } catch (e) {
            setGeolocation({
              latitude: lat,
              longitude: lon,
              display_name: `Location: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`
            });
          }
        },
        (err) => console.warn('Geolocation access warning:', err.message)
      );
    }
  }, [apiBaseUrl]);

  // Handle panel image update from camera rig
  const handlePanelUpdate = (panelName, dataUrl, hash) => {
    setPanels((prev) => ({ ...prev, [panelName]: dataUrl }));
    setPanelHashes((prev) => ({ ...prev, [panelName]: hash }));
  };

  // Handle human-in-the-loop targeted re-scan request for violated/missing rules
  const handleTargetedRescan = (ruleId) => {
    setRescanRuleId(ruleId);
    setRescanModalOpen(true);
  };

  const handleSaveTargetedCapture = async (panelName, dataUrl, hash, ruleId) => {
    handlePanelUpdate(panelName, dataUrl, hash);
    setRescanModalOpen(false);
    const targetRule = ruleId || rescanRuleId;
    setRescanRuleId(null);

    if (!targetRule) return;

    setEvaluatingRuleId(targetRule);
    try {
      const payload = {
        rule_id: targetRule,
        image_base64: dataUrl,
        current_context: auditResult || {}
      };

      const res = await fetch(`${apiBaseUrl}/api/inspector/re-evaluate-field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Micro-audit failed: ${res.status}`);
      }

      const data = await res.json();
      if (data.updated_audit) {
        setAuditResult(data.updated_audit);
      }
    } catch (err) {
      console.error('Targeted re-evaluation error:', err);
    } finally {
      setEvaluatingRuleId(null);
    }
  };

  // Execute Legal Metrology Statutory Audit
  const handleExecuteAudit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Strict 4-Panel Validation
    if (!panels || !panels.front || !panels.back || !panels.top || !panels.bottom) {
      alert("Please capture all 4 evidentiary panels (Front, Back, Top, Bottom) before executing the audit.");
      return;
    }

    setLoading(true);
    setError(null);

    // 2. Clean Payload Construction (Strictly strings/numbers, NO DOM elements)
    const userLocation = geolocation ? {
      formatted_address: geolocation.display_name || geolocation.formatted_address || "Okhla Industrial Area, Phase III, New Delhi, Delhi 110020",
      lat: geolocation.latitude || 28.7095,
      lng: geolocation.longitude || 77.1565
    } : {
      formatted_address: "Okhla Industrial Area, Phase III, New Delhi, Delhi 110020",
      lat: 28.7095,
      lng: 77.1565
    };

    const payload = {
      panels: {
        front: panels.front,
        back: panels.back,
        top: panels.top,
        bottom: panels.bottom
      },
      panel_hashes: {
        front: panelHashes.front || null,
        back: panelHashes.back || null,
        top: panelHashes.top || null,
        bottom: panelHashes.bottom || null
      },
      location: userLocation,
      geolocation: userLocation,
      inspector_id: inspectorId
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/inspector/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Audit server error: ${res.status}`);
      }

      const data = await res.json();
      setAuditResult(data);
      setTimeout(() => {
        const matrixEl = document.getElementById('statutory-audit-findings');
        if (matrixEl) {
          matrixEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      if (!navigator.onLine || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('Network offline. Activating Offline Queue Cache:', err);
        // Offline fallback: cache raw audit request
        const fallbackDocket = {
          docket_id: `GOI-LM-OFFLINE-${Date.now()}`,
          timestamp_utc: new Date().toISOString(),
          inspector_id: inspectorId,
          commodity_name: 'Queued Offline Commodity Inspection',
          is_compliant: false,
          violations_count: 1,
          geolocation: userLocation,
          panel_hashes: panelHashes
        };
        offlineStorage.enqueue(fallbackDocket);
        refreshQueueCount();
      } else {
        // Handle standard API errors (500s, 400s) without caching
        console.error("API Error:", err);
        setError("Audit failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate & Download Section 36(1) Legal Docket PDF
  const downloadSection36Docket = async () => {
    if (!auditResult) return;
    setPdfGenerating(true);

    try {
      const pdfPayload = {
        ...auditResult,
        formatted_address: geolocation?.display_name || geolocation?.formatted_address || geolocation?.address || "Krishi Bhawan, Department of Consumer Affairs, New Delhi, India",
        location_name: geolocation?.display_name || geolocation?.formatted_address || geolocation?.address || "Krishi Bhawan, Department of Consumer Affairs, New Delhi, India",
        latitude: geolocation?.latitude || geolocation?.lat,
        longitude: geolocation?.longitude || geolocation?.lng,
        geolocation: {
          ...geolocation,
          display_name: geolocation?.display_name || "Krishi Bhawan, Department of Consumer Affairs, New Delhi, India"
        }
      };

      const res = await fetch(`${apiBaseUrl}/api/inspector/generate-docket-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload)
      });

      if (!res.ok) {
        throw new Error('PDF docket generation failed.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Statutory_Docket_${auditResult.docket_id || 'Section36'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate Section 36(1) PDF Docket: ' + err.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="civic-container">
      {/* Banner */}
      <div className="civic-section-banner" style={{ borderLeftColor: '#1A365D' }}>
        <div>
          <div className="banner-title">
            <Shield size={20} />
            <VariableFontHoverByLetter
              label="Legal Metrology Statutory Enforcement & Compounding Division"
              staggerDuration={0.015}
              fromFontVariationSettings="'wght' 700, 'slnt' 0"
              toFontVariationSettings="'wght' 900, 'slnt' -10"
            />
          </div>
          <div className="banner-desc">
            Statutory audits under Section 36(1) Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011. 4-Panel evidentiary rig, USP math fraud validation, and SHA-256 Chain of Custody.
          </div>
        </div>

        {/* Officer Badge & Offline Queue Access */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#EDF2F7', padding: '0.4rem 0.75rem', borderRadius: '2px', border: '1px solid #CBD5E0', fontSize: '0.75rem' }}>
            <span style={{ color: '#718096' }}>Officer: </span>
            <strong>{inspectorId}</strong>
          </div>
          <button
            className="civic-btn civic-btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            onClick={() => setOfflineModalOpen(true)}
          >
            Offline Queue Cache {pendingQueueCount > 0 && `(${pendingQueueCount})`}
          </button>
        </div>
      </div>

      {/* Reactive Network & Offline Queue Banner: Render ONLY IF offline or items in queue */}
      {(!isOnline || pendingQueueCount > 0) && (
        <div
          style={{
            backgroundColor: '#FFFAF0',
            border: '1px solid #FBD38D',
            padding: '0.75rem 1rem',
            borderRadius: '2px',
            color: '#DD6B20',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {!isOnline
                ? 'Connection unavailable in warehouse. Inspection frames & metadata cached locally in offline queue.'
                : `Online. ${pendingQueueCount} cached inspection${pendingQueueCount === 1 ? '' : 's'} pending sync.`}
            </span>
          </div>
          <button
            className="civic-btn civic-btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.85rem',
              backgroundColor: '#DD6B20',
              borderColor: '#C05621'
            }}
            onClick={() => setOfflineModalOpen(true)}
          >
            <Database size={13} /> {isOnline ? 'Sync Offline Queue' : 'View Offline Queue'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', padding: '0.75rem 1rem', borderRadius: '2px', color: '#C53030', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* 4-Panel Camera Rig & Laplacian Focus Viewfinder */}
      <CameraRig
        panels={panels}
        panelHashes={panelHashes}
        onPanelUpdate={handlePanelUpdate}
        disabled={loading}
      />

      {/* Audit Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1.5rem 0' }}>
        <button
          className="civic-btn civic-btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          onClick={handleExecuteAudit}
          disabled={loading}
          id="btn-run-inspector-audit"
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Auditing 6 Declarations & USP Math...
            </>
          ) : (
            <>
              <Shield size={18} />
              Execute Statutory Compliance Audit
            </>
          )}
        </button>

        {auditResult && (
          <button
            className="civic-btn civic-btn-success"
            style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
            onClick={downloadSection36Docket}
            disabled={pdfGenerating}
            id="btn-download-pdf-docket"
          >
            {pdfGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Compiling ReportLab PDF...
              </>
            ) : (
              <>
                <Download size={18} />
                Download Section 36(1) Legal Docket (PDF)
              </>
            )}
          </button>
        )}
      </div>

      {/* Audit Findings & Chain of Custody Displays */}
      {auditResult && (
        <div id="statutory-audit-findings" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
          <StatutoryAuditCard
            auditData={auditResult}
            onTargetedRescan={handleTargetedRescan}
            evaluatingRuleId={evaluatingRuleId}
          />
          <ChainOfCustodyLedger auditData={auditResult} geolocation={geolocation} />
        </div>
      )}

      {/* 1-Shot Human-in-the-Loop Targeted Re-Scan Modal */}
      <TargetedRescanModal
        isOpen={rescanModalOpen}
        ruleId={rescanRuleId}
        onClose={() => {
          setRescanModalOpen(false);
          setRescanRuleId(null);
        }}
        onSaveCapture={handleSaveTargetedCapture}
      />

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={offlineModalOpen}
        onClose={() => {
          setOfflineModalOpen(false);
          refreshQueueCount();
        }}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
}
