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
  Scale,
  Shield,
  Layers,
  Lock
} from 'lucide-react';
import { scanHistory } from '../../utils/scanHistory';
import './ScanHistoryModal.css';

export default function ScanHistoryModal({ isOpen, onClose, currentUser, onOpenAuth }) {
  const [historyItems, setHistoryItems] = useState(() => scanHistory.getHistory());
  const [filter, setFilter] = useState('all'); // 'all' | 'violations' | 'compliant'
  const [viewScope, setViewScope] = useState('my'); // 'my' (this officer's scans) | 'all' (all scans)
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

  // Active officer ID badge
  const activeOfficerBadge = currentUser?.badgeNumber || 'LM-INSP-DEL-4091';
  const isCustomUser = Boolean(currentUser);

  // Scans filtered by officer
  const myScans = historyItems.filter(
    (item) => (item.inspectorId || '').toLowerCase().trim() === activeOfficerBadge.toLowerCase().trim()
  );
  const myScansCount = myScans.length;
  const allScansCount = historyItems.length;

  // Items based on viewScope
  const scopeItems = viewScope === 'my' ? myScans : historyItems;

  // Stats computed dynamically for current scope
  const stats = {
    total: scopeItems.length,
    nonCompliant: scopeItems.filter((i) => !i.isCompliant).length,
    compliant: scopeItems.filter((i) => i.isCompliant).length,
    totalFines: scopeItems.reduce((acc, i) => acc + (i.fineInr || 0), 0)
  };

  // Search & tab filter
  const filteredItems = scopeItems.filter((item) => {
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
    const targetDesc = viewScope === 'my' ? `scans logged under ${activeOfficerBadge}` : 'all local scan records';
    if (window.confirm(`Are you sure you want to delete ${targetDesc}?`)) {
      if (viewScope === 'my') {
        myScans.forEach((item) => scanHistory.deleteScan(item.id));
      } else {
        scanHistory.clearHistory();
      }
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
          <div className="lmpc-history-title-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="lmpc-history-icon-badge">
                <History size={22} />
              </div>
              <div>
                <h2>Statutory Scan & Audit History Ledger</h2>
                <p>
                  Immutable record of commodities inspected under Officer Badge <strong>{activeOfficerBadge}</strong>.
                </p>
              </div>
            </div>

            {/* Officer Identification Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                background: 'rgba(56, 225, 217, 0.12)',
                border: '1px solid rgba(56, 225, 217, 0.35)',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem'
              }}>
                <Shield size={13} color="#38E1D9" />
                <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
                  Officer: <strong style={{ color: '#38E1D9' }}>{activeOfficerBadge}</strong>
                  {currentUser?.name && <span style={{ opacity: 0.85, marginLeft: '4px' }}>• {currentUser.name}</span>}
                </span>
              </div>

              {!currentUser && onOpenAuth && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94A3B8',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Lock size={11} /> Switch Officer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="lmpc-history-stats-ribbon">
          <div className="lmpc-history-stat-box">
            <Scale size={16} color="#38E1D9" />
            <div>
              <div className="lmpc-history-stat-val">{stats.total}</div>
              <div className="lmpc-history-stat-lbl">
                {viewScope === 'my' ? 'My Scans' : 'Total Department Scans'}
              </div>
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

        {/* Controls: Search, Scope Toggle & Category Filters */}
        <div className="lmpc-history-controls">
          <div className="lmpc-history-search">
            <Search size={15} />
            <input
              type="text"
              placeholder={`Search ${viewScope === 'my' ? `scans by ${activeOfficerBadge}` : 'all department scans'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Scope Switcher: My Scans vs All Department */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              className={`lmpc-history-scope-btn ${viewScope === 'my' ? 'active' : ''}`}
              onClick={() => setViewScope('my')}
              title="Show only items scanned by my active Officer ID"
            >
              <User size={12} />
              My Scans ({myScansCount})
            </button>
            <button
              className={`lmpc-history-scope-btn ${viewScope === 'all' ? 'active' : ''}`}
              onClick={() => setViewScope('all')}
              title="Show scans across all department officers"
            >
              <Layers size={12} />
              All Officers ({allScansCount})
            </button>
          </div>

          {/* Verdict Filter Tabs */}
          <div className="lmpc-history-filter-tabs">
            <button
              className={`lmpc-history-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({scopeItems.length})
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
              <h4>
                {viewScope === 'my' 
                  ? `No scans found for Officer ${activeOfficerBadge}` 
                  : 'No matching department scan records'}
              </h4>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search query or filter criteria.' 
                  : `Commodities you inspect in Inspector Mode using camera or batch sampling will appear here under Officer ID ${activeOfficerBadge}.`}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="lmpc-scan-card">
                <div className="lmpc-scan-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="lmpc-scan-docket-badge">
                      {item.docketId}
                    </span>
                    <span style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      background: 'rgba(56, 225, 217, 0.1)',
                      border: '1px solid rgba(56, 225, 217, 0.25)',
                      color: '#38E1D9',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Officer: {item.inspectorId || 'LM-INSP-DEL-4091'}
                    </span>
                  </div>

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

                  {item.brandName && (
                    <span className="lmpc-scan-meta-item">
                      <FileText size={12} />
                      Brand: <strong>{item.brandName}</strong>
                    </span>
                  )}

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
                    Evidentiary SHA-256: {(item.merkleRoot || '').substring(0, 24)}...
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
            Showing {filteredItems.length} of {scopeItems.length} records for {viewScope === 'my' ? `Officer ${activeOfficerBadge}` : 'all officers'}
          </span>

          {scopeItems.length > 0 && (
            <button className="lmpc-history-clear-btn" onClick={handleClearAll}>
              Clear {viewScope === 'my' ? `Officer ${activeOfficerBadge} Logs` : 'All Logs'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
