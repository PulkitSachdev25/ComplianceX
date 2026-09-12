import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, FileText, Download, RefreshCw, AlertCircle, CheckCircle2, 
  Save, MapPin, Database, Plus, Minus, Layers, Box, CheckCircle, 
  ArrowRight, RotateCcw, AlertTriangle, FileCheck
} from 'lucide-react';
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
  // Batch Audit Protocol Configuration
  const [batchUnits, setBatchUnits] = useState(1);
  const [panelsPerItem, setPanelsPerItem] = useState(4);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [completedUnits, setCompletedUnits] = useState([]);
  const [batchComplete, setBatchComplete] = useState(false);

  // Status & UI States
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [downloadingUnitIndex, setDownloadingUnitIndex] = useState(null);
  const [error, setError] = useState(null);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [rescanModalOpen, setRescanModalOpen] = useState(false);
  const [rescanRuleId, setRescanRuleId] = useState(null);
  const [evaluatingRuleId, setEvaluatingRuleId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(() => offlineStorage.getQueue().length);

  // Current Unit Panels & Hashes State (e.g. { panel_1: b64, panel_2: b64, ... })
  const [panels, setPanels] = useState({});
  const [panelHashes, setPanelHashes] = useState({});

  // Current Unit Audit Output State
  const [auditResult, setAuditResult] = useState(null);

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
        // Also update in completedUnits if present
        setCompletedUnits((prev) =>
          prev.map((unit) =>
            unit.unitIndex === currentUnitIndex + 1
              ? { ...unit, auditResult: data.updated_audit }
              : unit
          )
        );
      }
    } catch (err) {
      console.error('Targeted re-evaluation error:', err);
    } finally {
      setEvaluatingRuleId(null);
    }
  };

  // Perform Legal Metrology Statutory Audit for given panels and hashes
  const auditUnitPanels = async (unitPanels, unitHashes) => {
    setLoading(true);
    setError(null);

    const userLocation = geolocation ? {
      formatted_address: geolocation.display_name || geolocation.formatted_address || "Okhla Industrial Area, Phase III, New Delhi, Delhi 110020",
      lat: geolocation.latitude || 28.7095,
      lng: geolocation.longitude || 77.1565
    } : {
      formatted_address: "Okhla Industrial Area, Phase III, New Delhi, Delhi 110020",
      lat: 28.7095,
      lng: 77.1565
    };

    const activePanels = {};
    const activeHashes = {};
    Object.entries(unitPanels || {}).forEach(([k, v]) => {
      if (v && typeof v === 'string' && v.trim() !== '') activePanels[k] = v;
    });
    Object.entries(unitHashes || {}).forEach(([k, v]) => {
      if (v && typeof v === 'string' && v.trim() !== '' && v !== '0'.repeat(64)) activeHashes[k] = v;
    });

    const payload = {
      panels: activePanels,
      panel_hashes: activeHashes,
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

      // Append or replace unit record in completedUnits
      const unitRecord = {
        unitIndex: currentUnitIndex + 1,
        auditResult: data,
        panels: unitPanels,
        panelHashes: unitHashes,
        docketId: data.docket_id,
        commodityName: data.commodity_name || `Unit ${currentUnitIndex + 1}`,
        isCompliant: data.is_compliant,
        violationsCount: data.violations_count || (data.violations || []).length,
        merkleRoot: data.merkle_root || data.master_evidence_sha256,
        fineInr: data.statutory_charge_sheet?.proposed_compounding_fine_inr || 0,
        timestamp: new Date().toISOString()
      };

      setCompletedUnits((prev) => {
        const filtered = prev.filter((u) => u.unitIndex !== unitRecord.unitIndex);
        return [...filtered, unitRecord];
      });

      if (currentUnitIndex + 1 >= batchUnits) {
        setBatchComplete(true);
      }

      setTimeout(() => {
        const matrixEl = document.getElementById('statutory-audit-findings');
        if (matrixEl) {
          matrixEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);

      return data;
    } catch (err) {
      if (!navigator.onLine || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('Network offline. Activating Offline Queue Cache:', err);
        const fallbackDocket = {
          docket_id: `GOI-LM-OFFLINE-${Date.now()}`,
          timestamp_utc: new Date().toISOString(),
          inspector_id: inspectorId,
          commodity_name: `Queued Offline Unit ${currentUnitIndex + 1}`,
          is_compliant: false,
          violations_count: 1,
          geolocation: userLocation,
          panel_hashes: unitHashes
        };
        offlineStorage.enqueue(fallbackDocket);
        refreshQueueCount();
      } else {
        console.error("API Error:", err);
        setError("Audit failed: " + err.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Called automatically by CameraRig when all panelsPerItem for current unit are captured
  const handleUnitPanelsComplete = (completedPanels, completedHashes) => {
    setPanels(completedPanels);
    setPanelHashes(completedHashes);
    auditUnitPanels(completedPanels, completedHashes);
  };

  // Manual trigger button to execute compliance audit on current panels
  const handleManualExecuteAudit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const activeKeys = Array.from({ length: panelsPerItem }, (_, i) => `panel_${i + 1}`);
    const missingPanels = activeKeys.filter((k) => !panels[k]);

    if (missingPanels.length > 0) {
      const confirmContinue = window.confirm(
        `You have captured ${activeKeys.length - missingPanels.length} of ${panelsPerItem} panels. Proceed with variable-leaf Merkle statutory audit on current evidence?`
      );
      if (!confirmContinue) return;
    }

    await auditUnitPanels(panels, panelHashes);
  };

  // Proceed to next unit in the batch
  const handleProceedToNextUnit = () => {
    if (currentUnitIndex + 1 < batchUnits) {
      setCurrentUnitIndex((prev) => prev + 1);
      setPanels({});
      setPanelHashes({});
      setAuditResult(null);
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset/Restart entire batch
  const handleResetBatch = () => {
    if (window.confirm('Reset current batch inspection session? All captured panels for active batch will be cleared.')) {
      setCurrentUnitIndex(0);
      setCompletedUnits([]);
      setBatchComplete(false);
      setPanels({});
      setPanelHashes({});
      setAuditResult(null);
      setError(null);
    }
  };

  // Generate & Download Section 36(1) Legal Docket PDF for given audit result
  const downloadSection36Docket = async (targetAudit = auditResult, unitNum = currentUnitIndex + 1) => {
    if (!targetAudit) return;
    setPdfGenerating(true);
    setDownloadingUnitIndex(unitNum);

    try {
      const pdfPayload = {
        ...targetAudit,
        formatted_address: geolocation?.display_name || geolocation?.formatted_address || "Krishi Bhawan, Department of Consumer Affairs, New Delhi, India",
        location_name: geolocation?.display_name || geolocation?.formatted_address || "Krishi Bhawan, Department of Consumer Affairs, New Delhi, India",
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
      a.download = `Statutory_Docket_${targetAudit.docket_id || `Unit_${unitNum}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate Section 36(1) PDF Docket: ' + err.message);
    } finally {
      setPdfGenerating(false);
      setDownloadingUnitIndex(null);
    }
  };

  // Number of panels captured for current unit
  const currentCapturedCount = Object.keys(panels).filter((k) => Boolean(panels[k])).length;

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
            Statutory audits under Section 36(1) Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011. Configurable batch sampling, dynamic multi-angle evidentiary rig, USP math fraud verification, and Section 63 BSA Merkle tree chain of custody.
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

      {/* Reactive Network & Offline Queue Banner */}
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

      {/* Inspection Protocol & Batch Configuration Card */}
      <div 
        className="civic-card" 
        style={{ 
          marginBottom: '1rem', 
          backgroundColor: '#F7FAFC', 
          borderLeft: '4px solid #1A365D' 
        }}
        id="batch-config-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Steppers Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            {/* Stepper 1: Batch Units / Items */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                <Box size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Batch Units / Items:
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E0', borderRadius: '3px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setBatchUnits((prev) => Math.max(1, prev - 1))}
                  disabled={loading || currentUnitIndex > 0 || completedUnits.length > 0}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: '#EDF2F7',
                    border: 'none',
                    borderRight: '1px solid #CBD5E0',
                    cursor: (loading || currentUnitIndex > 0 || completedUnits.length > 0) ? 'not-allowed' : 'pointer',
                    color: '#1A365D',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Decrease batch units"
                  id="btn-decrease-units"
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={batchUnits}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setBatchUnits(Math.min(25, Math.max(1, val)));
                  }}
                  disabled={loading || currentUnitIndex > 0 || completedUnits.length > 0}
                  style={{
                    width: '45px',
                    textAlign: 'center',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#1A365D',
                    outline: 'none',
                    padding: '0.3rem 0'
                  }}
                  id="input-batch-units"
                />
                <button
                  type="button"
                  onClick={() => setBatchUnits((prev) => Math.min(25, prev + 1))}
                  disabled={loading || currentUnitIndex > 0 || completedUnits.length > 0}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: '#EDF2F7',
                    border: 'none',
                    borderLeft: '1px solid #CBD5E0',
                    cursor: (loading || currentUnitIndex > 0 || completedUnits.length > 0) ? 'not-allowed' : 'pointer',
                    color: '#1A365D',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Increase batch units"
                  id="btn-increase-units"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Stepper 2: Panels Per Item */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                <Layers size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Panels Per Item:
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E0', borderRadius: '3px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setPanelsPerItem((prev) => Math.max(1, prev - 1))}
                  disabled={loading || currentUnitIndex > 0 || completedUnits.length > 0}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: '#EDF2F7',
                    border: 'none',
                    borderRight: '1px solid #CBD5E0',
                    cursor: (loading || currentUnitIndex > 0 || completedUnits.length > 0) ? 'not-allowed' : 'pointer',
                    color: '#1A365D',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Decrease panels per item"
                  id="btn-decrease-panels"
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={panelsPerItem}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setPanelsPerItem(Math.min(6, Math.max(1, val)));
                  }}
                  disabled={loading || currentUnitIndex > 0 || completedUnits.length > 0}
                  style={{
                    width: '45px',
                    textAlign: 'center',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#1A365D',
                    outline: 'none',
                    padding: '0.3rem 0'
                  }}
                  id="input-panels-per-item"
                />
                <button
                  type="button"
                  onClick={() => setPanelsPerItem((prev) => Math.min(6, prev + 1))}
                  disabled={loading || currentUnitIndex > 0 || completedUnits.length > 0}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: '#EDF2F7',
                    border: 'none',
                    borderLeft: '1px solid #CBD5E0',
                    cursor: (loading || currentUnitIndex > 0 || completedUnits.length > 0) ? 'not-allowed' : 'pointer',
                    color: '#1A365D',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Increase panels per item"
                  id="btn-increase-panels"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Status Badge & Protocol Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span
              className="civic-badge badge-compliant"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                backgroundColor: '#1A365D',
                color: '#FFFFFF'
              }}
              id="badge-batch-progress"
            >
              Item {currentUnitIndex + 1} of {batchUnits} | {currentCapturedCount} of {panelsPerItem} Panels
            </span>

            {(completedUnits.length > 0 || currentUnitIndex > 0) && (
              <button
                className="civic-btn civic-btn-outline"
                style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
                onClick={handleResetBatch}
                title="Reset batch inspection session"
              >
                <RotateCcw size={12} /> New Batch
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unit Progression Banner when Unit Audited and More Units Remain */}
      {auditResult && currentUnitIndex + 1 < batchUnits && !batchComplete && (
        <div
          style={{
            backgroundColor: '#F0FFF4',
            border: '1px solid #9AE6B4',
            padding: '0.85rem 1.25rem',
            borderRadius: '3px',
            color: '#22543D',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 2px 4px rgba(47, 133, 90, 0.1)'
          }}
          id="unit-advance-banner"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle size={20} color="#2F855A" />
            <div>
              <strong style={{ fontSize: '0.92rem' }}>
                Unit {currentUnitIndex + 1} of {batchUnits} Audited Successfully!
              </strong>
              <div style={{ fontSize: '0.75rem', color: '#276749', marginTop: '1px' }}>
                Docket ID: {auditResult.docket_id} • Status: {auditResult.is_compliant ? 'Compliant' : `${auditResult.violations_count || auditResult.violations?.length || 0} Violation(s)`}
              </div>
            </div>
          </div>

          <button
            className="civic-btn civic-btn-success"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            onClick={handleProceedToNextUnit}
            id="btn-proceed-next-unit"
          >
            <span>Proceed to Scan Unit {currentUnitIndex + 2}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Camera Rig & Laplacian Viewfinder */}
      <CameraRig
        panels={panels}
        panelHashes={panelHashes}
        onPanelUpdate={handlePanelUpdate}
        onUnitPanelsComplete={handleUnitPanelsComplete}
        panelsPerItem={panelsPerItem}
        currentUnitIndex={currentUnitIndex}
        totalUnits={batchUnits}
        disabled={loading}
      />

      {/* Audit Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', margin: '1.5rem 0' }}>
        <button
          className="civic-btn civic-btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          onClick={handleManualExecuteAudit}
          disabled={loading}
          id="btn-run-inspector-audit"
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Auditing Unit {currentUnitIndex + 1} ({panelsPerItem} Panels & USP)...
            </>
          ) : (
            <>
              <Shield size={18} />
              Execute Compliance Audit (Unit {currentUnitIndex + 1} of {batchUnits})
            </>
          )}
        </button>

        {auditResult && (
          <button
            className="civic-btn civic-btn-success"
            style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
            onClick={() => downloadSection36Docket(auditResult, currentUnitIndex + 1)}
            disabled={pdfGenerating}
            id="btn-download-pdf-docket"
          >
            {pdfGenerating && downloadingUnitIndex === currentUnitIndex + 1 ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Compiling ReportLab PDF...
              </>
            ) : (
              <>
                <Download size={18} />
                Download Section 36(1) Legal Docket (Unit {currentUnitIndex + 1})
              </>
            )}
          </button>
        )}
      </div>

      {/* Batch Summary Card when All Units Completed or Batch Finished */}
      {(batchComplete || completedUnits.length === batchUnits) && completedUnits.length > 0 && (
        <div 
          className="civic-card" 
          style={{ 
            marginTop: '1.5rem', 
            marginBottom: '1.5rem', 
            borderTop: '4px solid #1A365D', 
            backgroundColor: '#FAFAFA' 
          }}
          id="batch-summary-card"
        >
          <div className="civic-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={20} color="#1A365D" />
              <span className="civic-card-title">
                Batch Audit Complete: {completedUnits.length} Units Inspected
              </span>
            </div>
            <span className="civic-badge badge-compliant" style={{ fontSize: '0.75rem' }}>
              ✓ All {completedUnits.length} Units Cryptographically Verified
            </span>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
            <table className="civic-table" style={{ width: '100%', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#EDF2F7', color: '#1A365D' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Unit #</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Docket Reference ID</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Commodity</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Compliance Status</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fine Assessed</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Merkle Seal</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Section 36(1) Docket</th>
                </tr>
              </thead>
              <tbody>
                {completedUnits.map((u) => (
                  <tr key={u.unitIndex} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Unit {u.unitIndex}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', color: '#1A365D' }}>{u.docketId}</td>
                    <td style={{ padding: '0.5rem' }}>{u.commodityName}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span className={`civic-badge ${u.isCompliant ? 'badge-compliant' : 'badge-violation'}`} style={{ fontSize: '0.7rem' }}>
                        {u.isCompliant ? '✓ COMPLIANT' : `⚠ ${u.violationsCount} VIOLATION(S)`}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>
                      {u.fineInr > 0 ? `₹${u.fineInr.toLocaleString('en-IN')}` : 'NIL'}
                    </td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.68rem', color: '#718096' }}>
                      {u.merkleRoot ? `${u.merkleRoot.substring(0, 12)}...` : 'N/A'}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <button
                        className="civic-btn civic-btn-outline"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                        onClick={() => downloadSection36Docket(u.auditResult, u.unitIndex)}
                        disabled={pdfGenerating && downloadingUnitIndex === u.unitIndex}
                        id={`btn-download-docket-unit-${u.unitIndex}`}
                      >
                        {pdfGenerating && downloadingUnitIndex === u.unitIndex ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Download size={12} />
                        )}
                        <span> PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Findings & Chain of Custody Displays for Active Unit */}
      {auditResult && (
        <div id="statutory-audit-findings" className="grid-2" style={{ marginTop: '1.5rem' }}>
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
