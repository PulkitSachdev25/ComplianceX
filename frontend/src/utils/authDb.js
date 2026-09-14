// Client-side persistent database for LMPC Vision Statutory Authentication
// Synchronizes with localStorage and provides complete CRUD for accounts

const DB_STORAGE_KEY = 'lmpc_users_db';
const SESSION_USER_KEY = 'lmpc_user';
const SESSION_TOKEN_KEY = 'lmpc_token';

// Default pre-seeded statutory accounts
const DEFAULT_USERS = [
  {
    id: 'usr_gov_01',
    email: 'senior.inspector@lmpc.gov.in',
    password: 'Inspector@2026',
    name: 'Sh. Rajeshwar Singh',
    role: 'senior_inspector',
    roleLabel: 'Senior Inspector',
    badgeNumber: 'SI-DEL-4091',
    department: 'Department of Consumer Affairs, Delhi Circle',
    jurisdiction: 'NCT of Delhi, Central Zone',
    isGovVerified: true,
    createdAt: '2026-01-15T09:30:00.000Z'
  },
  {
    id: 'usr_gov_02',
    email: 'junior.inspector@gov.in',
    password: 'Junior@2026',
    name: 'Dr. Sunita Deshmukh',
    role: 'junior_inspector',
    roleLabel: 'Junior Inspector',
    badgeNumber: 'JI-FSO-1024',
    department: 'Standards & Regulatory Inspection Division',
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
    roleLabel: 'Packager',
    badgeNumber: 'MFG-3302',
    department: 'Dabur India Packaging & Metrology Division',
    jurisdiction: 'Industrial Compliance Zone 4',
    isGovVerified: true,
    createdAt: '2026-03-20T16:20:00.000Z'
  }
];

export function formatNameFromEmail(identifier) {
  if (!identifier) return 'Authorized Officer';
  const clean = identifier.trim();
  if (clean.toUpperCase().startsWith('MFG-') || clean.toLowerCase().includes('packager')) {
    return `Packager Officer (${clean.toUpperCase()})`;
  }
  if (clean.toUpperCase().startsWith('SI-') || clean.toUpperCase().startsWith('SFI-') || clean.toLowerCase().includes('senior')) {
    return `Senior Inspector (${clean.toUpperCase()})`;
  }
  if (clean.toUpperCase().startsWith('JI-') || clean.toUpperCase().startsWith('JFI-') || clean.toLowerCase().includes('junior')) {
    return `Junior Inspector (${clean.toUpperCase()})`;
  }
  if (clean.toUpperCase().startsWith('LM-') || clean.toLowerCase().includes('inspector')) {
    return `Senior Inspector (${clean.toUpperCase()})`;
  }
  if (clean.toUpperCase().startsWith('FSSAI-') || clean.toLowerCase().includes('fso')) {
    return `Junior Inspector (${clean.toUpperCase()})`;
  }
  const prefix = clean.split('@')[0];
  const parts = prefix.split(/[._\-+]+/).filter(Boolean);
  if (parts.length === 0) return clean;
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

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
        // Ensure default accounts exist and are updated to current roles
        let users = JSON.parse(existing);
        let updated = false;

        // Upgrade any existing legacy accounts
        users = users.map((u) => {
          if (u.id === 'usr_gov_01' || u.role === 'inspector' || u.role === 'senior_food_inspector' || u.role === 'senior_inspector') {
            updated = true;
            return {
              ...u,
              role: 'senior_inspector',
              roleLabel: 'Senior Inspector',
              badgeNumber: u.badgeNumber && !u.badgeNumber.startsWith('SI-') ? u.badgeNumber.replace('LM-INSP', 'SI').replace('SFI', 'SI') : u.badgeNumber || 'SI-DEL-4091',
              email: u.email || 'senior.inspector@lmpc.gov.in'
            };
          }
          if (u.id === 'usr_gov_02' || u.role === 'fssai' || u.role === 'junior_food_inspector' || u.role === 'junior_inspector') {
            updated = true;
            return {
              ...u,
              role: 'junior_inspector',
              roleLabel: 'Junior Inspector',
              badgeNumber: u.badgeNumber && !u.badgeNumber.startsWith('JI-') ? u.badgeNumber.replace('FSSAI-FSO', 'JI').replace('JFI', 'JI') : u.badgeNumber || 'JI-FSO-1024',
              email: u.email || 'junior.inspector@gov.in'
            };
          }
          return u;
        });

        DEFAULT_USERS.forEach((defaultUser) => {
          if (!users.some((u) => (u.email || '').toLowerCase() === defaultUser.email.toLowerCase() || (u.badgeNumber || '') === defaultUser.badgeNumber || u.id === defaultUser.id)) {
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
    return users.find((u) => (u.email || '').toLowerCase().trim() === email.toLowerCase().trim()) || null;
  }

  findUserByIdOrEmail(identifier) {
    if (!identifier) return null;
    const clean = identifier.toLowerCase().trim();
    const users = this.getUsers();
    return (
      users.find((u) => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uBadge = (u.badgeNumber || '').toLowerCase().trim();
        const uId = (u.id || '').toLowerCase().trim();
        return uEmail === clean || uBadge === clean || uId === clean;
      }) || null
    );
  }

  registerUser({ name, email, password, role, department, jurisdiction }) {
    if (!email) {
      return { success: false, error: 'Email or ID is required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = this.findUserByIdOrEmail(cleanEmail);
    if (existing) {
      if (name && name.trim()) existing.name = name.trim();
      if (role) {
        existing.role = role;
        if (role === 'packager') existing.roleLabel = 'Packager';
        else if (role === 'junior_inspector' || role === 'junior_food_inspector' || role === 'fssai') existing.roleLabel = 'Junior Inspector';
        else if (role === 'senior_inspector' || role === 'senior_food_inspector' || role === 'inspector') existing.roleLabel = 'Senior Inspector';
      }
      if (password) existing.password = password;
      if (department) existing.department = department;
      const users = this.getUsers().map((u) => u.id === existing.id ? existing : u);
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(users));
      return { success: true, user: existing };
    }

    const userName = (name && name.trim()) || formatNameFromEmail(cleanEmail);

    let badgePrefix = 'SI';
    let roleTitle = 'Senior Inspector';
    let isGovVerified = true;

    if (role === 'junior_inspector' || role === 'junior_food_inspector' || role === 'fssai') {
      badgePrefix = 'JI';
      roleTitle = 'Junior Inspector';
      isGovVerified = true;
    } else if (role === 'packager') {
      badgePrefix = 'MFG';
      roleTitle = 'Packager';
      isGovVerified = true;
    } else if (role === 'citizen') {
      badgePrefix = 'CIVIC';
      roleTitle = 'Citizen Consumer Advocate';
      isGovVerified = false;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const badgeNumber = `${badgePrefix}-${randomNum}`;

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: userName,
      email: cleanEmail,
      password: password || 'Default@2026',
      role: role || 'senior_inspector',
      roleLabel: roleTitle,
      badgeNumber: badgeNumber,
      department: department || (role === 'packager' ? 'Packaging & Manufacturing Compliance Division' : 'Department of Consumer Affairs, Enforcement Circle'),
      jurisdiction: jurisdiction || 'Active Inspection Jurisdiction',
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

  login(identifier, password, selectedRole) {
    if (!identifier) {
      return { success: false, error: 'Please enter your email or officer / packager ID.' };
    }

    const clean = identifier.trim();
    let user = this.findUserByIdOrEmail(clean);

    // If account doesn't exist, automatically provision with correct derived name from email or ID
    if (!user) {
      let role = selectedRole || 'senior_inspector';
      const upper = clean.toUpperCase();
      if (upper.startsWith('MFG') || clean.toLowerCase().includes('packager')) {
        role = 'packager';
      } else if (upper.startsWith('JI') || upper.startsWith('JFI') || upper.startsWith('FSSAI') || clean.toLowerCase().includes('junior') || clean.toLowerCase().includes('fso')) {
        role = 'junior_inspector';
      }

      let badgePrefix = 'SI';
      let roleTitle = 'Senior Inspector';
      if (role === 'packager') {
        badgePrefix = 'MFG';
        roleTitle = 'Packager';
      } else if (role === 'junior_inspector' || role === 'junior_food_inspector' || role === 'fssai') {
        badgePrefix = 'JI';
        roleTitle = 'Junior Inspector';
      }

      const generatedBadge = (upper.startsWith('MFG-') || upper.startsWith('SI-') || upper.startsWith('SFI-') || upper.startsWith('JI-') || upper.startsWith('JFI-') || upper.startsWith('LM-') || upper.startsWith('FSSAI-'))
        ? upper
        : `${badgePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      const email = clean.includes('@') ? clean.toLowerCase() : `${clean.toLowerCase().replace(/[^a-z0-9]/g, '')}@lmpc.gov.in`;

      const regRes = this.registerUser({
        name: formatNameFromEmail(clean),
        email: email,
        password: password || 'Default@2026',
        role: role
      });

      if (regRes.success) {
        user = regRes.user;
        user.badgeNumber = generatedBadge;
        user.role = role;
        user.roleLabel = roleTitle;
      } else {
        return { success: false, error: regRes.error || 'Failed to authenticate user.' };
      }
    } else {
      // Sync selected role if specified
      if (selectedRole && user.role !== selectedRole) {
        user.role = selectedRole;
        if (selectedRole === 'packager') {
          user.roleLabel = 'Packager';
        } else if (selectedRole === 'junior_inspector' || selectedRole === 'junior_food_inspector' || selectedRole === 'fssai') {
          user.roleLabel = 'Junior Inspector';
        } else if (selectedRole === 'senior_inspector' || selectedRole === 'senior_food_inspector' || selectedRole === 'inspector') {
          user.roleLabel = 'Senior Inspector';
        }
      }
      if (password && user.password && user.password !== password) {
        user.password = password;
        const users = this.getUsers().map((u) => u.id === user.id ? { ...u, password } : u);
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(users));
      }
    }

    const token = `lmpc_jwt_${btoa(`${user.email || user.badgeNumber}:${Date.now()}`)}`;
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
