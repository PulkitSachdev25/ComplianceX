import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, X, CheckCircle, AlertCircle, CloudUpload } from 'lucide-react';
import { offlineStorage } from '../../utils/offlineStorage';

export default function OfflineQueueModal({ isOpen, onClose, apiBaseUrl = 'http://localhost:8000' }) {
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const loadQueue = () => {
    const q = offlineStorage.getQueue();
    setQueue(q);
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
      setSyncResult(null);
    }
  }, [isOpen]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await offlineStorage.syncWithBackend(apiBaseUrl);
    setSyncing(false);
    if (res.success) {
      setSyncResult({ success: true, message: `Successfully synced ${res.count} cached inspection docket(s) to central GOI servers.` });
      loadQueue();
    } else {
      setSyncResult({ success: false, message: `Sync failed: ${res.error}. Will retain local cache.` });
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all un-synced offline dockets?')) {
      offlineStorage.clearQueue();
      loadQueue();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        className="civic-card"
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          border: '2px solid #1A365D'
        }}
      >
        <div className="civic-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="#1A365D" />
            <span className="civic-card-title">Remote Warehouse Offline Inspection Queue</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}
          >
            <X size={20} />
          </button>
        </div>

        {syncResult && (
          <div
            style={{
              backgroundColor: syncResult.success ? '#F0FFF4' : '#FFF5F5',
              border: `1px solid ${syncResult.success ? '#9AE6B4' : '#FEB2B2'}`,
              color: syncResult.success ? '#22543D' : '#C53030',
              padding: '0.65rem 0.85rem',
              borderRadius: '2px',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {syncResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{syncResult.message}</span>
          </div>
        )}

        {/* Queue Items List */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
              <Database size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>No pending inspection records in offline queue.</p>
              <p style={{ fontSize: '0.75rem', color: '#A0AEC0', marginTop: '0.2rem' }}>
                Any statutory dockets audited without an active internet connection will be cached here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {queue.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#F7FAFC',
                    border: '1px solid #CBD5E0',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '2px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A365D' }}>
                      {item.commodity_name || 'Statutory Inspection Docket'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#718096', fontFamily: 'monospace' }}>
                      {item.docket_id || item.offline_id} • Queued: {new Date(item.queued_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <span
                    className={`civic-badge ${item.is_compliant ? 'badge-compliant' : 'badge-violation'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {item.is_compliant ? 'Compliant' : `${item.violations_count || 1} Violations`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
          <button
            className="civic-btn civic-btn-outline"
            style={{ fontSize: '0.8rem', color: '#C53030' }}
            onClick={handleClear}
            disabled={queue.length === 0 || syncing}
          >
            <Trash2 size={14} /> Clear Cache
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="civic-btn civic-btn-outline" onClick={onClose}>
              Close
            </button>
            <button
              className="civic-btn civic-btn-primary"
              onClick={handleSync}
              disabled={queue.length === 0 || syncing}
            >
              {syncing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Syncing...
                </>
              ) : (
                <>
                  <CloudUpload size={14} /> Sync {queue.length} Record(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
