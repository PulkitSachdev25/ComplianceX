// Client-side persistent database for LMPC Vision Statutory Authentication
// Synchronizes with localStorage and provides complete CRUD for accounts

const DB_STORAGE_KEY = 'lmpc_users_db';
const SESSION_USER_KEY = 'lmpc_user';
const SESSION_TOKEN_KEY = 'lmpc_token';

// Default pre-seeded statutory accounts
const DEFAULT_USERS = [
  {
    id: 'usr_gov_01',
    email: 'inspector.delhi@lmpc.gov.in',
    password: 'Inspector@2026',
    name: 'Sh. Rajeshwar Singh',
    role: 'inspector',
    roleLabel: 'Senior Legal Metrology Inspector',
    badgeNumber: 'LM-INSP-DEL-4091',
    department: 'Department of Consumer Affairs, Delhi Circle',
    jurisdiction: 'NCT of Delhi, Central Zone',
    isGovVerified: true,
    createdAt: '2026-01-15T09:30:00.000Z'
  },
  {
    id: 'usr_gov_02',
    email: 'officer.fssai@gov.in',
    password: 'FSSAI@2026',
    name: 'Dr. Sunita Deshmukh',
    role: 'fssai',
    roleLabel: 'FSSAI Central Food Safety Officer',
    badgeNumber: 'FSSAI-FSO-1024',
    department: 'FDA Bhawan, Regulatory Vigilance Division',
    jurisdiction: 'North Regional Jurisdiction',
    isGovVerified: true,
    createdAt: '2026-02-10T11:15:00.000Z'
  },
  {
    id: 'usr_gov_04',
    email: 'compliance@dabur.com',
    password: 'Packager@2026',
    name: 'Vikramaditya Roy',
    role: 'packager',
    roleLabel: 'Brand Packager Compliance Officer',
    badgeNumber: 'MFG-3302',
    department: 'Dabur India Packaging & Metrology Division',
    jurisdiction: 'Industrial Compliance Zone 4',
    isGovVerified: true,
    createdAt: '2026-03-20T16:20:00.000Z'
  }
];

class AuthDatabase {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    try {
      const existing = localStorage.getItem(DB_STORAGE_KEY);
      if (!existing) {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      } else {
        // Ensure default accounts exist even if DB was modified
        const users = JSON.parse(existing);
        let updated = false;
        DEFAULT_USERS.forEach((defaultUser) => {
          if (!users.some((u) => u.email.toLowerCase() === defaultUser.email.toLowerCase())) {
            users.push(defaultUser);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch (err) {
      console.warn('Failed to initialize local AuthDatabase:', err);
    }
  }

  getUsers() {
    try {
      const data = localStorage.getItem(DB_STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  }

  findUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()) || null;
  }

  registerUser({ name, email, password, role, department, jurisdiction }) {
    if (!email || !password || !name) {
      return { success: false, error: 'Name, email, and password are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = this.findUserByEmail(cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    let badgePrefix = 'CIVIC';
    let roleTitle = 'Citizen Consumer Advocate';
    let isGovVerified = false;

    if (role === 'inspector') {
      badgePrefix = 'LM-INSP';
      roleTitle = 'Legal Metrology Inspector';
      isGovVerified = true;
    } else if (role === 'fssai') {
      badgePrefix = 'FSSAI-FSO';
      roleTitle = 'Food Safety Officer';
      isGovVerified = true;
    } else if (role === 'packager') {
      badgePrefix = 'MFG';
      roleTitle = 'Packaging Compliance Officer';
      isGovVerified = true;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const badgeNumber = `${badgePrefix}-${randomNum}`;

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: role || 'citizen',
      roleLabel: roleTitle,
      badgeNumber: badgeNumber,
      department: department || 'General Consumer Grievance Portal',
      jurisdiction: jurisdiction || 'National Consumer Portal',
      isGovVerified: isGovVerified,
      createdAt: new Date().toISOString()
    };

    try {
      const users = this.getUsers();
      users.push(newUser);
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(users));
      return { success: true, user: newUser };
    } catch (e) {
      return { success: false, error: 'Failed to write to persistent database.' };
    }
  }

  login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Please provide both email and password.' };
    }

    const user = this.findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid credentials. No officer or citizen record found.' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Invalid password. Access denied under statutory security protocol.' };
    }

    const token = `lmpc_jwt_${btoa(`${user.email}:${Date.now()}`)}`;
    const safeUser = { ...user };
    delete safeUser.password;

    try {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(safeUser));
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      window.dispatchEvent(new Event('lmpc_auth_change'));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }

    return { success: true, user: safeUser, token };
  }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  getToken() {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  logout() {
    try {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      window.dispatchEvent(new Event('lmpc_auth_change'));
    } catch (e) {
      console.warn('Failed to logout:', e);
    }
  }

  getPreseededAccounts() {
    return DEFAULT_USERS.map((u) => {
      const copy = { ...u };
      return copy;
    });
  }

  getStats() {
    const users = this.getUsers();
    return {
      totalRegistered: users.length,
      inspectors: users.filter((u) => u.role === 'inspector').length,
      fssaiOfficers: users.filter((u) => u.role === 'fssai').length,
      citizens: users.filter((u) => u.role === 'citizen').length,
      industry: users.filter((u) => u.role === 'packager').length
    };
  }
}

export const authDb = new AuthDatabase();
