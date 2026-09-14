import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Zap, Check, Building2, Shield, HeartPulse, UserPlus, Lock } from 'lucide-react';
import shieldLogo from '../../assets/lmpc_shield_logo.png';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignIn?: (credentials: { email: string; password: string; role?: 'inspector' | 'fssai' | 'packager' }) => void;
  onCreateAccount?: (userData: { name: string; email: string; password: string; role: 'inspector' | 'fssai' | 'packager'; department?: string }) => void;
  onResetPassword?: () => void;
  onQuickDemo?: (role: 'inspector' | 'fssai' | 'packager') => void;
  errorMessage?: string | null;
  statusMessage?: string | null;
}

// Pre-seeded official demo accounts
const TEST_ACCOUNTS = [
  {
    role: 'inspector' as const,
    roleTitle: 'Senior Legal Metrology Inspector',
    name: 'Sh. Rajeshwar Singh',
    id: 'LM-INSP-DEL-4091',
    email: 'inspector.delhi@lmpc.gov.in',
    pass: 'Inspector@2026',
    icon: '🛡️',
    badgeClass: 'text-violet-300 bg-violet-500/20 border-violet-500/40'
  },
  {
    role: 'fssai' as const,
    roleTitle: 'FSSAI Food Safety Officer',
    name: 'Dr. Sunita Deshmukh',
    id: 'FSSAI-FSO-1024',
    email: 'officer.fssai@gov.in',
    pass: 'FSSAI@2026',
    icon: '🔬',
    badgeClass: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
  },
  {
    role: 'packager' as const,
    roleTitle: 'Brand Packager Compliance Officer',
    name: 'Vikramaditya Roy',
    id: 'MFG-3302',
    email: 'compliance@dabur.com',
    pass: 'Packager@2026',
    icon: '📦',
    badgeClass: 'text-amber-300 bg-amber-500/20 border-amber-500/40'
  }
];

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md transition-all focus-within:border-violet-500 focus-within:bg-zinc-900/90 focus-within:ring-2 focus-within:ring-violet-500/20 shadow-sm">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = "Welcome Back",
  description = "Access your statutory account and continue regulatory & packaging compliance operations",
  onSignIn,
  onResetPassword,
  onQuickDemo,
  errorMessage,
  onCreateAccount,
  statusMessage,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [inputFullName, setInputFullName] = useState('');
  const [inputDepartment, setInputDepartment] = useState('');
  const [inputIdentifier, setInputIdentifier] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'inspector' | 'fssai' | 'packager'>('inspector');

  const handleSelectTestAccount = (acc: typeof TEST_ACCOUNTS[number]) => {
    setMode('signin');
    setInputIdentifier(acc.id);
    setInputPassword(acc.pass);
    setSelectedRole(acc.role);

    if (onQuickDemo) {
      onQuickDemo(acc.role);
    } else if (onSignIn) {
      onSignIn({ email: acc.id, password: acc.pass, role: acc.role });
    }
  };

  const handleRoleNavbarClick = (role: 'inspector' | 'fssai' | 'packager') => {
    setSelectedRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (onCreateAccount) {
        onCreateAccount({
          name: inputFullName,
          email: inputIdentifier,
          password: inputPassword,
          role: selectedRole,
          department: inputDepartment
        });
      } else if (onSignIn) {
        onSignIn({ email: inputIdentifier, password: inputPassword, role: selectedRole });
      }
    } else {
      if (onSignIn) {
        onSignIn({ email: inputIdentifier, password: inputPassword, role: selectedRole });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-14 bg-[#08090d] text-zinc-100 selection:bg-violet-500/30 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Canvas */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="fixed top-1/4 -left-48 w-[32rem] h-[32rem] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 -right-48 w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Spacious, Grand Executive Container (max-w-5xl) */}
      <div className="w-full max-w-5xl bg-[#111218]/95 border border-zinc-800/80 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-2xl z-10 grid grid-cols-1 lg:grid-cols-12 my-6">
        
        {/* =========================================================================
            LEFT PANEL: Statutory Branding & Instant Demo Access (5 Columns)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#161722] via-[#12131b] to-[#0c0d12] p-6 sm:p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-zinc-800/80 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Radial inside Left Column */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* National Statutory Emblem & Portal Title */}
            <div className="flex items-center gap-3.5 mb-6">
              <img 
                src={shieldLogo} 
                alt="LMPC Vision Official Shield" 
                className="w-13 h-13 object-contain drop-shadow-[0_4px_12px_rgba(139,92,246,0.25)]" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white font-sans">LMPC Vision</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Portal
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">Government of India · Statutory Metrology</p>
              </div>
            </div>

            {/* Statutory Law Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-[11px] font-medium px-3 py-1 rounded-xl bg-zinc-800/70 text-zinc-300 border border-zinc-700/60 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-violet-400" />
                Legal Metrology Act 2009
              </span>
              <span className="text-[11px] font-medium px-3 py-1 rounded-xl bg-zinc-800/70 text-zinc-300 border border-zinc-700/60 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-amber-400" />
                PCR Rules 2011
              </span>
              <span className="text-[11px] font-medium px-3 py-1 rounded-xl bg-zinc-800/70 text-zinc-300 border border-zinc-700/60 flex items-center gap-1.5">
                <HeartPulse className="w-3 h-3 text-emerald-400" />
                FSSAI 2020 Matrix
              </span>
            </div>

            {/* Quick Demo Test Access Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Quick Demo Test Access
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">1-Click Auto Fill</span>
              </div>
              
              <div className="space-y-2.5">
                {TEST_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectTestAccount(acc)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 group relative overflow-hidden ${
                      selectedRole === acc.role
                        ? 'bg-violet-950/40 border-violet-500/50 shadow-lg shadow-violet-950/40 scale-[1.01]'
                        : 'bg-zinc-900/50 hover:bg-zinc-850 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xl p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 shrink-0">
                      {acc.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                          {acc.name}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${acc.badgeClass}`}>
                          {acc.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{acc.roleTitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="pt-6 border-t border-zinc-800/80 mt-8 text-[11px] text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Statutory 256-Bit Audit Security
            </span>
            <span className="font-mono text-zinc-500 text-[10px]">v2.4.0</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: Interactive Authentication Console (7 Columns)
            ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-12 flex flex-col justify-center relative">
          {/* Top Row: Title + Mode Toggle (Sign In / Create Account) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                {mode === 'signin' ? title : 'Create Account'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm">
                {mode === 'signin' 
                  ? description 
                  : 'Register a new statutory officer or brand packaging account'}
              </p>
            </div>

            {/* Pill Mode Switcher */}
            <div className="flex items-center p-1 bg-[#0a0b10] rounded-2xl border border-zinc-800 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 animate-element">
              <span className="text-lg">⚠️</span>
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-element">
              <span className="text-lg">✅</span>
              <span className="leading-snug">{statusMessage}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === 'signup' ? (
              <>
                {/* Step 1: Full Legal Name */}
                <div>
                  <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block mb-2">
                    Step 1 • Full Legal Name
                  </label>
                  <GlassInputWrapper>
                    <input 
                      name="fullName" 
                      type="text" 
                      required 
                      value={inputFullName} 
                      onChange={(e) => setInputFullName(e.target.value)}
                      placeholder="e.g. Sh. Rajeshwar Singh or Vikramaditya Roy" 
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder:text-zinc-500" 
                    />
                  </GlassInputWrapper>
                </div>

                {/* Step 2: Email or Packager ID */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Step 2 • Official Email Address or Packager ID
                    </label>
                    <span className="text-[11px] text-violet-400 font-mono">Accepts MFG-XXXX / email</span>
                  </div>
                  <GlassInputWrapper>
                    <input 
                      name="email" 
                      type="text" 
                      required 
                      value={inputIdentifier} 
                      onChange={(e) => setInputIdentifier(e.target.value)}
                      placeholder="e.g. inspector@lmpc.gov.in or MFG-5510" 
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder:text-zinc-500" 
                    />
                  </GlassInputWrapper>
                </div>

                {/* Step 3: Department / Organization (Optional) */}
                <div>
                  <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block mb-2">
                    Step 3 • Department / Organization / Company (Optional)
                  </label>
                  <GlassInputWrapper>
                    <input 
                      name="department" 
                      type="text" 
                      value={inputDepartment} 
                      onChange={(e) => setInputDepartment(e.target.value)}
                      placeholder="e.g. Department of Consumer Affairs or Packaging Division" 
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder:text-zinc-500" 
                    />
                  </GlassInputWrapper>
                </div>

                {/* Step 4: Password */}
                <div>
                  <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block mb-2">
                    Step 4 • Create Password
                  </label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input 
                        name="password" 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        value={inputPassword} 
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="Create a secure account password" 
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder:text-zinc-500" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-white transition-colors p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>
              </>
            ) : (
              <>
                {/* Step 1: Email or Officer / Packager ID */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Step 1 • Email Address or Officer / Packager ID
                    </label>
                    <span className="text-[11px] text-violet-400 font-mono">Packager IDs (e.g. MFG-3302) supported</span>
                  </div>
                  <GlassInputWrapper>
                    <input 
                      name="email" 
                      type="text" 
                      required 
                      value={inputIdentifier} 
                      onChange={(e) => setInputIdentifier(e.target.value)}
                      placeholder="Enter your email or ID (e.g. compliance@dabur.com or MFG-3302)" 
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder:text-zinc-500" 
                    />
                  </GlassInputWrapper>
                </div>

                {/* Step 2: Password */}
                <div>
                  <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block mb-2">
                    Step 2 • Password
                  </label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input 
                        name="password" 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        value={inputPassword} 
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="Enter your statutory account password" 
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder:text-zinc-500" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-white transition-colors p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>
              </>
            )}

            {/* Step 3 (or 5): 3-Role Navbar */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  {mode === 'signup' ? 'Step 5 • Select Account Role' : 'Step 3 • Select Role'}
                </label>
                <span className="text-[11px] text-violet-400">Click to select role, then Sign In below</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-[#0a0b10] border border-zinc-800">
                {/* 1. Inspector */}
                <button
                  type="button"
                  onClick={() => handleRoleNavbarClick('inspector')}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRole === 'inspector'
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border-violet-400 ring-2 ring-violet-500/30 scale-[1.02]'
                      : 'bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300 border-transparent hover:border-zinc-700'
                  }`}
                  title="Select Legal Metrology Inspector role"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <div className="text-center sm:text-left">
                    <div className="leading-tight">1. Inspector</div>
                    <div className={`text-[10px] font-normal ${selectedRole === 'inspector' ? 'text-violet-200' : 'text-zinc-500'}`}>
                      Legal Metrology
                    </div>
                  </div>
                  {selectedRole === 'inspector' && <Check className="w-3.5 h-3.5 ml-auto hidden sm:block" />}
                </button>

                {/* 2. FSSAI Officer */}
                <button
                  type="button"
                  onClick={() => handleRoleNavbarClick('fssai')}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRole === 'fssai'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-400 ring-2 ring-emerald-500/30 scale-[1.02]'
                      : 'bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300 border-transparent hover:border-zinc-700'
                  }`}
                  title="Select FSSAI Food Safety Officer role"
                >
                  <HeartPulse className="w-4 h-4 shrink-0" />
                  <div className="text-center sm:text-left">
                    <div className="leading-tight">2. FSSAI Officer</div>
                    <div className={`text-[10px] font-normal ${selectedRole === 'fssai' ? 'text-emerald-200' : 'text-zinc-500'}`}>
                      Food Safety
                    </div>
                  </div>
                  {selectedRole === 'fssai' && <Check className="w-3.5 h-3.5 ml-auto hidden sm:block" />}
                </button>

                {/* 3. Packager */}
                <button
                  type="button"
                  onClick={() => handleRoleNavbarClick('packager')}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRole === 'packager'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border-amber-400 ring-2 ring-amber-500/30 scale-[1.02]'
                      : 'bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300 border-transparent hover:border-zinc-700'
                  }`}
                  title="Select Brand Packager (MFG) role"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <div className="text-center sm:text-left">
                    <div className="leading-tight">3. Packager</div>
                    <div className={`text-[10px] font-normal ${selectedRole === 'packager' ? 'text-amber-200' : 'text-zinc-500'}`}>
                      Brand & Packaging
                    </div>
                  </div>
                  {selectedRole === 'packager' && <Check className="w-3.5 h-3.5 ml-auto hidden sm:block" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Reset Password (Sign In mode only) */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" name="rememberMe" defaultChecked className="custom-checkbox" />
                  <span className="text-zinc-400">Keep me signed in</span>
                </label>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} 
                  className="hover:underline text-violet-400 transition-colors"
                >
                  Reset password
                </a>
              </div>
            )}

            {/* Submit Action Button */}
            <button 
              type="submit" 
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-white py-4 font-semibold text-sm transition-all cursor-pointer shadow-xl shadow-violet-600/25 active:scale-[0.99] flex items-center justify-center gap-2 border border-violet-400/30 tracking-wide mt-2"
            >
              {mode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Access Portal</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Regulatory Portal</span>
                </>
              )}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-medium">
                {selectedRole === 'inspector' ? 'as Inspector' : selectedRole === 'fssai' ? 'as FSSAI Officer' : 'as Packager'}
              </span>
            </button>

            {/* Bottom Mode Switcher Link */}
            <div className="text-center pt-3 text-xs text-zinc-400 border-t border-zinc-800/80">
              {mode === 'signin' ? (
                <span>
                  Don't have an official account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-violet-400 font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Create an Account
                  </button>
                </span>
              ) : (
                <span>
                  Already have a registered account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-violet-400 font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
