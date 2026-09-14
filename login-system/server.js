const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'lmpc_vision_statutory_gateway_secret_jwt_key_2026';
const DB_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting (In-memory IP tracker)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 minutes

function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (loginAttempts.has(ip)) {
        const record = loginAttempts.get(ip);
        if (now - record.firstAttempt > LOCKOUT_WINDOW) {
            loginAttempts.set(ip, { count: 1, firstAttempt: now });
        } else if (record.count >= MAX_ATTEMPTS) {
            const minutesLeft = Math.ceil((LOCKOUT_WINDOW - (now - record.firstAttempt)) / 60000);
            return res.status(429).json({
                error: `Too many failed login attempts. Account locked for ${minutesLeft} minute(s) for security.`
            });
        }
    }
    next();
}

function recordFailure(ip) {
    const now = Date.now();
    if (!loginAttempts.has(ip)) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
    } else {
        const record = loginAttempts.get(ip);
        record.count += 1;
    }
}

function resetFailures(ip) {
    loginAttempts.delete(ip);
}

// Database helper functions
function loadUsers() {
    if (!fs.existsSync(DB_FILE)) {
        // Seed default verified government inspectors & citizens
        const salt = bcrypt.genSaltSync(10);
        const defaultUsers = [
            {
                id: "OFFICER-DEL-4091",
                name: "Vikramaditya Rathore",
                email: "inspector.delhi@lmpc.gov.in",
                passwordHash: bcrypt.hashSync("Inspector@2026", salt),
                role: "Senior Legal Metrology Inspector",
                department: "Department of Consumer Affairs, Govt of India",
                jurisdiction: "Central & New Delhi Division",
                badgeNumber: "LM-INSP-4091",
                createdAt: new Date().toISOString()
            },
            {
                id: "FSSAI-REG-1024",
                name: "Dr. Priya Sundaram",
                email: "officer.fssai@gov.in",
                passwordHash: bcrypt.hashSync("FSSAI@2026", salt),
                role: "FSSAI Food Safety & Regulatory Officer",
                department: "Food Safety and Standards Authority of India",
                jurisdiction: "National Capital Region (NCR)",
                badgeNumber: "FSSAI-FSO-1024",
                createdAt: new Date().toISOString()
            },
            {
                id: "CITIZEN-USR-7701",
                name: "Ananya Sharma",
                email: "citizen.ananya@gmail.com",
                passwordHash: bcrypt.hashSync("Citizen@2026", salt),
                role: "Citizen Consumer Advocate",
                department: "Consumer Protection Forum",
                jurisdiction: "South Delhi",
                badgeNumber: "CIVIC-7701",
                createdAt: new Date().toISOString()
            },
            {
                id: "CORP-COMP-3302",
                name: "Rajesh Kulkarni",
                email: "compliance@dabur.com",
                passwordHash: bcrypt.hashSync("Packager@2026", salt),
                role: "Brand Packager Compliance Officer",
                department: "Packaged Commodities Regulatory Cell",
                jurisdiction: "All-India FMCG Manufacturing",
                badgeNumber: "MFG-3302",
                createdAt: new Date().toISOString()
            }
        ];
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultUsers, null, 2));
        return defaultUsers;
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users database:', err);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'LMPC Vision Statutory Regulatory Gateway',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// Platform Stats
app.get('/api/stats', (req, res) => {
    const users = loadUsers();
    res.json({
        totalUsers: users.length,
        inspectors: users.filter(u => u.role.includes('Inspector')).length,
        officers: users.filter(u => u.role.includes('FSSAI')).length,
        citizens: users.filter(u => u.role.includes('Citizen')).length,
        manufacturers: users.filter(u => u.role.includes('Packager') || u.role.includes('Brand')).length
    });
});

// POST /api/register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role, jurisdiction, department } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Full name, email, and password are required fields.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }

        const users = loadUsers();
        const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (existing) {
            return res.status(409).json({ error: 'An account with this email address already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const assignedRole = role || 'Citizen Consumer Advocate';
        const isOfficial = assignedRole.includes('Inspector') || assignedRole.includes('FSSAI');
        const badgePrefix = isOfficial ? 'LMPC-INSP' : 'CIVIC';
        const badgeNumber = `${badgePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newUser = {
            id: `USR-${Date.now().toString().slice(-6)}`,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: assignedRole,
            department: department || (isOfficial ? 'Legal Metrology Enforcement Division' : 'Consumer Affairs Forum'),
            jurisdiction: jurisdiction || 'Delhi NCR',
            badgeNumber,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                department: newUser.department,
                jurisdiction: newUser.jurisdiction,
                badgeNumber: newUser.badgeNumber
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            message: 'Account registered successfully.',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department,
                jurisdiction: newUser.jurisdiction,
                badgeNumber: newUser.badgeNumber
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
});

// POST /api/login
app.post('/api/login', rateLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter both your email address and password.' });
        }

        const users = loadUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

        if (!user) {
            recordFailure(ip);
            return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            recordFailure(ip);
            return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
        }

        resetFailures(ip);

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                jurisdiction: user.jurisdiction,
                badgeNumber: user.badgeNumber
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            message: 'Statutory authentication successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                jurisdiction: user.jurisdiction,
                badgeNumber: user.badgeNumber
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error during authentication.' });
    }
});

// Auth Verification Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Session expired or token invalid.' });
        }
        req.user = user;
        next();
    });
}

// GET /api/me
app.get('/api/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

app.listen(PORT, () => {
    console.log(`🛡️ LMPC Vision Statutory Regulatory Gateway listening on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to access the authentication portal.`);
});
