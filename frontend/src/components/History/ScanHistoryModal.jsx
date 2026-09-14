import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Hash,
  Scale
} from 'lucide-react';
import { scanHistory } from '../../utils/scanHistory';
import './ScanHistoryModal.css';

export default function ScanHistoryModal({ isOpen, onClose }) {
  const [historyItems, setHistoryItems] = useState(() => scanHistory.getHistory());
  const [filter, setFilter] = useState('all'); // 'all' | 'violations' | 'compliant'
  const [searchQuery, setSearchQuery] = useState('');

  const refreshHistory = () => {
    setHistoryItems(scanHistory.getHistory());
  };

  useEffect(() => {
    refreshHistory();
    window.addEventListener('lmpc_history_change', refreshHistory);
    return () => window.removeEventListener('lmpc_history_change', refreshHistory);
  }, []);

  if (!isOpen) return null;

  const stats = scanHistory.getStats();

  const filteredItems = historyItems.filter((item) => {
    if (filter === 'violations' && item.isCompliant) return false;
    if (filter === 'compliant' && !item.isCompliant) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (item.commodityName || '').toLowerCase().includes(q);
    const brandMatch = (item.brandName || '').toLowerCase().includes(q);
    const docketMatch = (item.docketId || '').toLowerCase().includes(q);
    const inspectorMatch = (item.inspectorId || '').toLowerCase().includes(q);
    return nameMatch || brandMatch || docketMatch || inspectorMatch;
  });

  const handleDeleteItem = (id) => {
    scanHistory.deleteScan(id);
    refreshHistory();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your local statutory scan history?')) {
      scanHistory.clearHistory();
      refreshHistory();
    }
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="lmpc-history-overlay" onClick={onClose}>
      <div className="lmpc-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          className="lmpc-history-close-btn" 
          onClick={onClose}
          title="Close Scan History"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="lmpc-history-header">
          <div className="lmpc-history-title-row">
            <div className="lmpc-history-icon-badge">
              <History size={22} />
            </div>
            <div>
              <h2>Statutory Scan & Audit History Ledger</h2>
              <p>
                Immutable record of all scanned commodities, Section 36(1) audit dockets & SHA-256 evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="lmpc-history-stats-ribbon">
          <div className="lmpc-history-stat-box">
            <Scale size={16} color="#38E1D9" />
            <div>
              <div className="lmpc-history-stat-val">{stats.total}</div>
              <div className="lmpc-history-stat-lbl">Total Scans</div>
            </div>
          </div>

          <div className="lmpc-history-stat-box">
            <ShieldAlert size={16} color="#F87171" />
            <div>
              <div className="lmpc-history-stat-val" style={{ color: '#F87171' }}>
                {stats.nonCompliant}
              </div>
              <div className="lmpc-history-stat-lbl">Violations Detected</div>
            </div>
          </div>

          <div className="lmpc-history-stat-box">
            <ShieldCheck size={16} color="#34D399" />
            <div>
              <div className="lmpc-history-stat-val" style={{ color: '#34D399' }}>
                {stats.compliant}
              </div>
              <div className="lmpc-history-stat-lbl">100% Compliant</div>
            </div>
          </div>

          {stats.totalFines > 0 && (
            <div className="lmpc-history-stat-box">
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FBBF24' }}>₹</span>
              <div>
                <div className="lmpc-history-stat-val" style={{ color: '#FBBF24' }}>
                  ₹{stats.totalFines.toLocaleString('en-IN')}
                </div>
                <div className="lmpc-history-stat-lbl">Compounding Fines Proposed</div>
              </div>
            </div>
          )}
        </div>

        {/* Controls: Search & Filters */}
        <div className="lmpc-history-controls">
          <div className="lmpc-history-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by commodity, brand, docket ID, or inspector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="lmpc-history-filter-tabs">
            <button
              className={`lmpc-history-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({historyItems.length})
            </button>
            <button
              className={`lmpc-history-filter-tab ${filter === 'violations' ? 'active' : ''}`}
              onClick={() => setFilter('violations')}
            >
              Violations ({stats.nonCompliant})
            </button>
            <button
              className={`lmpc-history-filter-tab ${filter === 'compliant' ? 'active' : ''}`}
              onClick={() => setFilter('compliant')}
            >
              Compliant ({stats.compliant})
            </button>
          </div>
        </div>

        {/* Scan List */}
        <div className="lmpc-history-list">
          {filteredItems.length === 0 ? (
            <div className="lmpc-history-empty">
              <FileText size={42} />
              <h4>No matching scan records found</h4>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search query or filter criteria.' 
                  : 'Start scanning commodities in Inspector or Citizen mode to populate your audit ledger.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="lmpc-scan-card">
                <div className="lmpc-scan-card-header">
                  <span className="lmpc-scan-docket-badge">
                    {item.docketId}
                  </span>

                  <span className={`lmpc-scan-verdict-badge ${item.isCompliant ? 'compliant' : 'violation'}`}>
                    {item.isCompliant ? (
                      <>
                        <ShieldCheck size={13} />
                        100% Statutory Compliant
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={13} />
                        Non-Compliant ({item.violationsCount} Violation{item.violationsCount !== 1 ? 's' : ''})
                      </>
                    )}
                  </span>
                </div>

                <div className="lmpc-scan-title-row">
                  <h3>{item.commodityName}</h3>
                </div>

                <div className="lmpc-scan-meta-row">
                  <span className="lmpc-scan-meta-item">
                    <Clock size={12} />
                    {formatDate(item.timestamp)}
                  </span>

                  <span className="lmpc-scan-meta-item">
                    <User size={12} />
                    Officer: <strong>{item.inspectorId || 'LM-INSP-DEL-4091'}</strong>
                  </span>

                  {item.location && (
                    <span className="lmpc-scan-meta-item">
                      <MapPin size={12} />
                      {item.location}
                    </span>
                  )}
                </div>

                {/* Violations Box if Non-compliant */}
                {!item.isCompliant && item.violations && item.violations.length > 0 && (
                  <div className="lmpc-scan-violations-box">
                    <div className="lmpc-scan-violations-title">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={13} />
                        Statutory Violations Identified
                      </span>
                      {item.fineInr > 0 && (
                        <span style={{ color: '#FBBF24', fontWeight: 800 }}>
                          Proposed Compounding Fine: ₹{item.fineInr.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {item.violations.map((v, idx) => (
                      <div key={idx} className="lmpc-scan-violation-item">
                        • <strong>{v.section || v.rule || 'Violation'}:</strong> {v.description || JSON.stringify(v)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer with Merkle Root and Delete button */}
                <div className="lmpc-scan-card-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'monospace' }}>
                    <Hash size={11} />
                    Merkle SHA-256: {(item.merkleRoot || '').substring(0, 24)}...
                  </span>

                  <button
                    className="lmpc-scan-delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete record from local history"
                  >
                    <Trash2 size={12} />
                    Delete Log
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="lmpc-history-footer">
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Showing {filteredItems.length} of {historyItems.length} total local audit records
          </span>

          {historyItems.length > 0 && (
            <button className="lmpc-history-clear-btn" onClick={handleClearAll}>
              Clear All Audit History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
