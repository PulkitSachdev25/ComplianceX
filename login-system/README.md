# LMPC Vision Statutory Regulatory Authentication Gateway

Production-ready, full-stack authentication system for **LMPC Vision** (Legal Metrology & Packaged Commodities Statutory Compliance Portal) matching the Cruip Open PRO dark theme glassmorphism architecture.

---

## 🌟 Architecture & Features

- **Frontend**: Cruip Open PRO dark theme glassmorphism with dynamic tabs (Sign In, Officer Register, Instant 1-Click Demo Access).
- **Backend**: Node.js & Express with `bcryptjs`, `jsonwebtoken`, and `express-rate-limit`.
- **Security**:
  - `bcryptjs` salted password hashing (10 rounds).
  - Rate limiting (max 5 failed attempts per IP per 15-minute window).
  - JSON Web Tokens (`jwt`) for stateless session authorization.
  - Constant-time password comparison to mitigate timing attacks.
- **Database Persistence**: File-backed `users.json` that stores registered accounts and auto-seeds official government inspector & citizen credentials.
- **Pre-Seeded Official Credentials**:
  - `inspector.delhi@lmpc.gov.in` / `Inspector@2026` (Senior Legal Metrology Inspector, New Delhi)
  - `officer.fssai@gov.in` / `FSSAI@2026` (FSSAI Food Safety & Regulatory Officer)
  - `citizen.ananya@gmail.com` / `Citizen@2026` (Citizen Consumer Advocate)
  - `compliance@dabur.com` / `Packager@2026` (Brand Packager Compliance Officer)

---

## 🚀 Quickstart

1. Navigate to this directory:
   ```bash
   cd ComplianceX/login-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser:
   ```
   http://localhost:5001
   ```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/register` | Create a new officer/citizen account | No |
| `POST` | `/api/login` | Authenticate with email and password | No (Rate-limited) |
| `GET` | `/api/me` | Fetch authenticated officer profile | Yes (`Bearer <token>`) |
| `GET` | `/api/stats` | Platform user and inspector counts | No |
| `GET` | `/api/health` | Gateway health status | No |
