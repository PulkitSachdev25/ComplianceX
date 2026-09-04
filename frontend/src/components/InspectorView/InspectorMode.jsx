import React, { useState, useEffect } from 'react';
import { Shield, FileText, Download, RefreshCw, AlertCircle, CheckCircle2, Save, MapPin } from 'lucide-react';
import CameraRig from './CameraRig';
import StatutoryAuditCard from './StatutoryAuditCard';
import ChainOfCustodyLedger from './ChainOfCustodyLedger';
import OfflineQueueModal from './OfflineQueueModal';
import { offlineStorage } from '../../utils/offlineStorage';

export default function InspectorMode({ 
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://compliancex.onrender.com' 
}) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(null);

  // Inspector Officer & Geolocation State
  const [inspectorId, setInspectorId] = useState('LM-INSP-DEL-4091');
  const [geolocation, setGeolocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    display_name: 'Krishi Bhawan, Department of Consumer Affairs, New Delhi, India'
  });

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
  const [selectedPresetKey, setSelectedPresetKey] = useState('fraudulent_pricing_chips');

  // Audit Output State
  const [auditResult, setAuditResult] = useState(null);

  // Fetch presets & initialize Geolocation
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/presets/inspector`)
      .then((res) => res.json())
      .then((data) => {
        if (data.presets) setPresets(data.presets);
      })
      .catch((err) => console.error('Presets load error:', err));

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
    setSelectedPresetKey(null);
  };

  // Apply Preset Legal Metrology Case
  const handleApplyPreset = (presetKey) => {
    setSelectedPresetKey(presetKey);
    const p = presets.find((item) => item.key === presetKey);
    if (p) {
      setPanels({ front: null, back: null, top: null, bottom: null });
      setPanelHashes({
        front: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        back: 'ca978112ca1bbdcafac231b39a23dc4da7860819c1966ec0725a1144ed30185e',
        top: '8a32a67e0e7a2b25867de23e590494481079d479e0f3169e9a4f6d480da0f279',
        bottom: 'cb5a8e03bc21bb7740b0ccbe479339e03d4ccbb1d5462cfb37b4f53535970c79'
      });
    }
  };

  // Execute Legal Metrology Statutory Audit
  const runAudit = async () => {
    setLoading(true);
    setError(null);
    setOfflineNotice(null);

    const payload = {
      preset_key: selectedPresetKey,
      panels: panels,
      panel_hashes: panelHashes,
      geolocation: geolocation,
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
    } catch (err) {
      console.warn('Live audit failed. Activating Offline Queue Cache:', err);
      // Offline fallback: cache raw audit request
      const fallbackDocket = {
        docket_id: `GOI-LM-OFFLINE-${Date.now()}`,
        timestamp_utc: new Date().toISOString(),
        inspector_id: inspectorId,
        commodity_name: 'Queued Offline Commodity Inspection',
        is_compliant: false,
        violations_count: 1,
        geolocation: geolocation,
        panel_hashes: panelHashes
      };
      offlineStorage.enqueue(fallbackDocket);
      setOfflineNotice('Connection unavailable in warehouse. Inspection frames & metadata cached locally in offline queue.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run initial audit on mount
  useEffect(() => {
    runAudit();
  }, [selectedPresetKey]);

  // Generate & Download Section 36(1) Legal Docket PDF
  const downloadSection36Docket = async () => {
    if (!auditResult) return;
    setPdfGenerating(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/inspector/generate-docket-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditResult)
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
            Legal Metrology Statutory Enforcement & Compounding Division
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
            Offline Queue Cache
          </button>
        </div>
      </div>

      {offlineNotice && (
        <div style={{ backgroundColor: '#FFFAF0', border: '1px solid #FBD38D', padding: '0.75rem 1rem', borderRadius: '2px', color: '#DD6B20', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{offlineNotice}</span>
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
        presets={presets}
        onApplyPreset={handleApplyPreset}
        disabled={loading}
      />

      {/* Audit Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1.5rem 0' }}>
        <button
          className="civic-btn civic-btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          onClick={runAudit}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
          <StatutoryAuditCard auditData={auditResult} />
          <ChainOfCustodyLedger auditData={auditResult} geolocation={geolocation} />
        </div>
      )}

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
}
