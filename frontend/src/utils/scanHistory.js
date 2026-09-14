// Persistent Scan & Statutory Audit History Manager for LMPC Vision
// Tracks all scanned commodities, camera captures, violation verdicts, and SHA-256 dockets.

const SCAN_HISTORY_KEY = 'LMPC_STATUTORY_SCAN_HISTORY';

// Pre-seeded realistic audits logged under Senior Inspector LM-INSP-DEL-4091
const DEFAULT_SCAN_HISTORY = [
  {
    id: 'scan_hist_01',
    docketId: 'GOI-LM-2026-DEL-0892',
    commodityName: "Haldiram's Nagpur Bhujia Sev (400g)",
    brandName: "Haldiram's",
    category: 'Packaged Snacks / Savouries',
    mode: 'inspector',
    inspectorId: 'LM-INSP-DEL-4091',
    officerName: 'Sh. Rajeshwar Singh',
    isCompliant: false,
    violationsCount: 2,
    violations: [
      {
        rule: 'Legal Metrology (Packaged Commodities) Amendment 2021',
        section: 'Rule 6(1)(e) & Section 36(1)',
        description: 'Missing Mandatory Unit Sale Price (USP) for pack exceeding 200g. Printed MRP is ₹125 but ₹/100g unit price is absent.'
      },
      {
        rule: 'Packaged Commodities Rules 2011',
        section: 'Rule 6(1)(a)',
        description: 'Manufacturer address lacks 6-digit postal PIN code on back panel.'
      }
    ],
    fineInr: 25000,
    location: 'Okhla Industrial Area, Phase III, New Delhi 110020',
    timestamp: '2026-09-14T06:45:12.000Z',
    merkleRoot: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    panels: {
      front: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=400&auto=format&fit=crop&q=80',
      back: null,
      top: null,
      bottom: null
    }
  },
  {
    id: 'scan_hist_02',
    docketId: 'GOI-LM-2026-DEL-0841',
    commodityName: 'Tata Salt Vacuum Evaporated (1kg)',
    brandName: 'Tata Consumer Products',
    category: 'Essential Commodity / Iodized Salt',
    mode: 'inspector',
    inspectorId: 'LM-INSP-DEL-4091',
    officerName: 'Sh. Rajeshwar Singh',
    isCompliant: true,
    violationsCount: 0,
    violations: [],
    fineInr: 0,
    location: 'Krishi Bhawan Inspection Yard, New Delhi',
    timestamp: '2026-09-13T11:20:00.000Z',
    merkleRoot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    panels: {
      front: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400&auto=format&fit=crop&q=80',
      back: null,
      top: null,
      bottom: null
    }
  },
  {
    id: 'scan_hist_03',
    docketId: 'GOI-LM-2026-DEL-0799',
    commodityName: 'Sunfeast Dark Fantasy Choco Fills (300g)',
    brandName: 'ITC Limited',
    category: 'Confectionery & Bakery',
    mode: 'inspector',
    inspectorId: 'LM-INSP-DEL-4091',
    officerName: 'Sh. Rajeshwar Singh',
    isCompliant: false,
    violationsCount: 1,
    violations: [
      {
        rule: 'Legal Metrology Rules 2011 Table 1',
        section: 'Rule 7 - Principal Display Panel (PDP) Numeral Height',
        description: 'Net quantity declaration "300g" font numeral height is 2.1mm, failing the statutory 4.0mm minimum threshold.'
      }
    ],
    fineInr: 20000,
    location: 'Patparganj Industrial Estate, Delhi 110092',
    timestamp: '2026-09-12T09:15:30.000Z',
    merkleRoot: 'ca978112ca1bbdcafac231b39a23dc4da7860819c1966ec0725a1144ed30185e',
    panels: {
      front: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80',
      back: null,
      top: null,
      bottom: null
    }
  },
  {
    id: 'scan_hist_04',
    docketId: 'GOI-LM-2026-DEL-0720',
    commodityName: 'Fortune Sunlite Refined Sunflower Oil (1 Litre Pouch)',
    brandName: 'Adani Wilmar Limited',
    category: 'Edible Oils',
    mode: 'inspector',
    inspectorId: 'LM-INSP-DEL-4091',
    officerName: 'Sh. Rajeshwar Singh',
    isCompliant: true,
    violationsCount: 0,
    violations: [],
    fineInr: 0,
    location: 'Azadpur Mandi Wholesale Depot, Delhi',
    timestamp: '2026-09-11T14:40:10.000Z',
    merkleRoot: '8a32a67e0e7a2b25867de23e590494481079d479e0f3169e9a4f6d480da0f279',
    panels: {
      front: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
      back: null,
      top: null,
      bottom: null
    }
  }
];

class ScanHistoryManager {
  constructor() {
    this.initHistory();
  }

  initHistory() {
    try {
      const existing = localStorage.getItem(SCAN_HISTORY_KEY);
      if (!existing) {
        localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(DEFAULT_SCAN_HISTORY));
      }
    } catch (e) {
      console.warn('Failed to init scan history in localStorage:', e);
    }
  }

  getHistory() {
    try {
      const raw = localStorage.getItem(SCAN_HISTORY_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_SCAN_HISTORY;
    } catch (e) {
      return DEFAULT_SCAN_HISTORY;
    }
  }

  addScan(scanRecord) {
    try {
      const history = this.getHistory();
      const newEntry = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        docketId: scanRecord.docketId || `GOI-LM-${Date.now()}`,
        commodityName: scanRecord.commodityName || 'Scanned Packaged Commodity',
        brandName: scanRecord.brandName || 'Brand Declaration',
        category: scanRecord.category || 'General Packaged Food / FMCG',
        mode: scanRecord.mode || 'inspector',
        inspectorId: scanRecord.inspectorId || 'LM-INSP-DEL-4091',
        officerName: scanRecord.officerName || 'Statutory Enforcement Officer',
        isCompliant: scanRecord.isCompliant !== undefined ? scanRecord.isCompliant : false,
        violationsCount: scanRecord.violationsCount || (scanRecord.violations || []).length,
        violations: scanRecord.violations || [],
        fineInr: scanRecord.fineInr || 0,
        location: scanRecord.location || 'Statutory Enforcement Viewport',
        timestamp: scanRecord.timestamp || new Date().toISOString(),
        merkleRoot: scanRecord.merkleRoot || `sha256_${Date.now()}`,
        panels: scanRecord.panels || {}
      };

      history.unshift(newEntry);
      // Keep most recent 50 scans to manage localStorage quota cleanly
      const trimmed = history.slice(0, 50);
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(trimmed));
      window.dispatchEvent(new Event('lmpc_history_change'));
      return newEntry;
    } catch (e) {
      console.error('Failed to add scan record:', e);
      return null;
    }
  }

  deleteScan(scanId) {
    try {
      const history = this.getHistory();
      const updated = history.filter((item) => item.id !== scanId);
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('lmpc_history_change'));
      return updated;
    } catch (e) {
      console.error('Failed to delete scan record:', e);
      return [];
    }
  }

  clearHistory() {
    try {
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify([]));
      window.dispatchEvent(new Event('lmpc_history_change'));
      return [];
    } catch (e) {
      console.error('Failed to clear scan history:', e);
      return [];
    }
  }

  getStats() {
    const history = this.getHistory();
    const total = history.length;
    const nonCompliant = history.filter((item) => !item.isCompliant).length;
    const compliant = history.filter((item) => item.isCompliant).length;
    const totalFines = history.reduce((acc, item) => acc + (item.fineInr || 0), 0);

    return {
      total,
      nonCompliant,
      compliant,
      totalFines
    };
  }
}

export const scanHistory = new ScanHistoryManager();
